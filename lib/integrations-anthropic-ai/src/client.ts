import Anthropic from "@anthropic-ai/sdk";

// Support both Replit AI Integration (proxy) and direct user API key
const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;

if (!apiKey) {
  throw new Error(
    "ANTHROPIC_API_KEY must be set. Please add your Anthropic API key as a secret.",
  );
}

export const anthropic = new Anthropic({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
