import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import {
  CreateProfileBody,
  CreateProfileResponse,
  GenerateRecommendationsBody,
  GenerateRecommendationsResponse,
  MatchUniversitiesBody,
  MatchUniversitiesResponse,
  GenerateProgramsBody,
  GenerateProgramsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseId(raw: string | string[]): number {
  const s = Array.isArray(raw) ? raw[0] : raw;
  return parseInt(s, 10);
}

function serializeProfile(p: typeof profilesTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString() };
}

// POST /edu/profile
router.post("/edu/profile", async (req, res): Promise<void> => {
  const parsed = CreateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const [profile] = await db
    .insert(profilesTable)
    .values({
      grade: d.grade,
      egeYear: d.egeYear,
      favoriteSubjects: d.favoriteSubjects,
      hobbies: d.hobbies,
      interests: d.interests,
      priorities: d.priorities,
      orientationAnswers: d.orientationAnswers,
    })
    .returning();
  res.status(201).json(CreateProfileResponse.parse(serializeProfile(profile)));
});

// GET /edu/profile/:id
router.get("/edu/profile/:id", async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid profile ID" });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, id));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json(serializeProfile(profile));
});

// POST /edu/recommendations — AI-powered
router.post("/edu/recommendations", async (req, res): Promise<void> => {
  const parsed = GenerateRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, parsed.data.profileId));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const prompt = `Ты — профессиональный консультант по профориентации для российских школьников.

Анализируй профиль абитуриента и верни рекомендации строго в формате JSON.

Профиль абитуриента:
- Класс: ${profile.grade}
- Год сдачи ЕГЭ: ${profile.egeYear}
- Любимые предметы: ${profile.favoriteSubjects.join(", ")}
- Хобби и увлечения: ${profile.hobbies.join(", ")}
- Интересующие профессии/сферы: ${profile.interests.join(", ")}
- Приоритеты в профессии: ${profile.priorities.join(", ")}
- Ответы на профориентационные вопросы: ${JSON.stringify(profile.orientationAnswers, null, 2)}

Верни ТОЛЬКО валидный JSON объект (без markdown, без пояснений) точно в этом формате:
{
  "strengths": "Развёрнутое описание сильных сторон и склонностей (2-3 предложения)",
  "studyDirections": [
    {
      "name": "Название направления (реальная специальность вуза)",
      "description": "Краткое описание направления (1-2 предложения)",
      "whyFits": "Почему подходит этому абитуриенту (1-2 предложения)",
      "professions": ["профессия 1", "профессия 2", "профессия 3"],
      "matchScore": 90
    }
  ],
  "interestAreas": ["область 1", "область 2", "область 3"]
}

Правила:
- Дай 4-5 направлений, отсортированных по matchScore (убыванию)
- matchScore от 0 до 100
- Используй реальные специальности российских вузов (например: "Компьютерные науки", "Медицина", "Экономика и управление", "Психология", "Журналистика")
- Пиши на русском языке
- Отвечай строго JSON, без markdown-блоков`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  const text = block.type === "text" ? block.text : "";
  const jsonText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  const aiData = JSON.parse(jsonText);

  const result = GenerateRecommendationsResponse.parse({
    profileId: profile.id,
    strengths: aiData.strengths,
    studyDirections: aiData.studyDirections,
    interestAreas: aiData.interestAreas,
  });
  res.json(result);
});

// POST /edu/universities — AI-powered
router.post("/edu/universities", async (req, res): Promise<void> => {
  const parsed = MatchUniversitiesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, parsed.data.profileId));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const directionHint = parsed.data.studyDirectionName
    ? `Предпочтительное направление: ${parsed.data.studyDirectionName}`
    : "";

  const prompt = `Ты — консультант по поступлению в московские вузы.

Профиль абитуриента:
- Любимые предметы: ${profile.favoriteSubjects.join(", ")}
- Интересующие профессии: ${profile.interests.join(", ")}
- Приоритеты: ${profile.priorities.join(", ")}
${directionHint}

Выбери 4 подходящих вуза из топ-30 Москвы и верни ТОЛЬКО JSON (без markdown):
{
  "matches": [
    {
      "university": {
        "id": 1,
        "name": "Полное название вуза",
        "shortName": "Аббревиатура",
        "description": "1-2 предложения о вузе",
        "egeSubjects": ["Предмет ЕГЭ 1", "Предмет ЕГЭ 2", "Предмет ЕГЭ 3"],
        "mathLevel": "профильный",
        "rank": 1
      },
      "recommendedFaculty": "Название факультета/специальности",
      "matchReason": "Почему подходит (1-2 предложения)",
      "matchScore": 92
    }
  ]
}

Используй реальные московские вузы: МГУ, МФТИ, НИУ ВШЭ, МГТУ им. Баумана, СПбГУ (отделение в Москве), РАНХиГС, МГИМО, РУДН, НИТУ МИСиС, МАИ, РЭУ им. Плеханова, МИРЭА, МИЭТ и другие.
mathLevel: "базовый" или "профильный"
Пиши на русском, id от 1 до 4, matchScore от 0 до 100.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  const text = block.type === "text" ? block.text : "";
  const jsonText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  const aiData = JSON.parse(jsonText);

  res.json(MatchUniversitiesResponse.parse(aiData));
});

// POST /edu/programs — AI-powered
router.post("/edu/programs", async (req, res): Promise<void> => {
  const parsed = GenerateProgramsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, parsed.data.profileId));
  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const currentYear = new Date().getFullYear();
  const monthsLeft = Math.max(
    1,
    (profile.egeYear - currentYear) * 12 + (6 - new Date().getMonth()),
  );

  const prompt = `Ты — методист по подготовке к ЕГЭ.

Абитуриент поступает в: ${parsed.data.specialty} (${parsed.data.universityId})
Класс: ${profile.grade}, год ЕГЭ: ${profile.egeYear}, месяцев до ЕГЭ: ~${monthsLeft}

Верни ТОЛЬКО JSON (без markdown):
{
  "universityName": "Название вуза",
  "specialty": "${parsed.data.specialty}",
  "exams": ["Русский язык", "Математика (профиль)", "предмет по выбору"],
  "preparationMonths": ${monthsLeft},
  "programs": [
    {
      "type": "basic",
      "name": "Базовая программа",
      "durationMonths": ${Math.round(monthsLeft * 0.8)},
      "courses": [
        {
          "name": "Название курса",
          "subject": "Предмет ЕГЭ",
          "format": "онлайн",
          "durationWeeks": 16,
          "costPerMonth": 3500
        }
      ],
      "tutors": [
        {
          "name": "Имя Фамилия",
          "subject": "Предмет",
          "experience": "5 лет",
          "rating": 4.8,
          "costPerHour": 1500
        }
      ],
      "totalCostEstimate": 45000
    },
    {
      "type": "intensive",
      "name": "Интенсивная программа",
      ...
    },
    {
      "type": "individual",
      "name": "Индивидуальная программа",
      ...
    }
  ]
}

Дай 3 программы: basic, intensive, individual.
Для каждой — 2-3 курса и 1-2 репетитора.
Реалистичные цены в рублях, русские имена преподавателей.
Пиши на русском языке.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  const text = block.type === "text" ? block.text : "";
  const jsonText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
  const aiData = JSON.parse(jsonText);

  res.json(GenerateProgramsResponse.parse(aiData));
});

export default router;
