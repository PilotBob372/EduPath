import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  CreateAnthropicConversationBody,
  CreateAnthropicConversationResponse,
  GetAnthropicConversationParams,
  GetAnthropicConversationResponse,
  DeleteAnthropicConversationParams,
  ListAnthropicMessagesParams,
  SendAnthropicMessageBody,
  SendAnthropicMessageParams,
  ListAnthropicConversationsResponse,
  ListAnthropicMessagesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
}

function serializeConversation(c: { id: number; title: string; createdAt: Date }) {
  return { id: c.id, title: c.title, createdAt: c.createdAt.toISOString() };
}

function serializeMessage(m: {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}) {
  return { ...m, createdAt: m.createdAt.toISOString() };
}

// GET /anthropic/conversations
router.get("/anthropic/conversations", async (req, res): Promise<void> => {
  const rows = await db.select().from(conversations).orderBy(conversations.createdAt);
  res.json(ListAnthropicConversationsResponse.parse(rows.map(serializeConversation)));
});

// POST /anthropic/conversations
router.post("/anthropic/conversations", async (req, res): Promise<void> => {
  const parsed = CreateAnthropicConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [conv] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();
  res.status(201).json(CreateAnthropicConversationResponse.parse(serializeConversation(conv)));
});

// GET /anthropic/conversations/:id
router.get("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const rawParams = GetAnthropicConversationParams.safeParse({
    id: parseId(req.params.id),
  });
  if (!rawParams.success || isNaN(rawParams.data.id)) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }
  const id = rawParams.data.id;
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db.select().from(messages).where(eq(messages.conversationId, id));
  res.json(
    GetAnthropicConversationResponse.parse({
      ...serializeConversation(conv),
      messages: msgs.map(serializeMessage),
    }),
  );
});

// DELETE /anthropic/conversations/:id
router.delete("/anthropic/conversations/:id", async (req, res): Promise<void> => {
  const rawParams = DeleteAnthropicConversationParams.safeParse({
    id: parseId(req.params.id),
  });
  if (!rawParams.success) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }
  const id = rawParams.data.id;
  const [conv] = await db.select().from(conversations).where(eq(conversations.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).send();
});

// GET /anthropic/conversations/:id/messages
router.get("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawParams = ListAnthropicMessagesParams.safeParse({
    id: parseId(req.params.id),
  });
  if (!rawParams.success) {
    res.status(400).json({ error: "Invalid conversation ID" });
    return;
  }
  const id = rawParams.data.id;
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json(ListAnthropicMessagesResponse.parse(msgs.map(serializeMessage)));
});

// POST /anthropic/conversations/:id/messages (SSE stream)
router.post("/anthropic/conversations/:id/messages", async (req, res): Promise<void> => {
  const rawParams = SendAnthropicMessageParams.safeParse({
    id: parseId(req.params.id),
  });
  const bodyParsed = SendAnthropicMessageBody.safeParse(req.body);
  if (!rawParams.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const convId = rawParams.data.id;
  const userContent = bodyParsed.data.content;

  const [conv] = await db.select().from(conversations).where(eq(conversations.id, convId));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messages).values({
    conversationId: convId,
    role: "user",
    content: userContent,
  });

  // Build history for Claude
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(messages.createdAt);

  const chatMessages = history.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // System prompt for EduPath AI consultant
  const systemPrompt = `Ты — дружелюбный и опытный AI-консультант по поступлению в российские вузы "EduPath AI".
Ты помогаешь школьникам выбрать профессию, университет и подготовиться к ЕГЭ.
Отвечай на русском языке, будь поддерживающим и конкретным.
Если абитуриент сомневается в выборе — помоги разобраться с возражениями.
Предлагай альтернативы, объясняй варианты поступления.
Контекст беседы: ${conv.title}`;

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    system: systemPrompt,
    messages: chatMessages,
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullResponse += event.delta.text;
      res.write(`data: ${JSON.stringify({ content: event.delta.text })}\n\n`);
    }
  }

  // Save assistant response
  await db.insert(messages).values({
    conversationId: convId,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
