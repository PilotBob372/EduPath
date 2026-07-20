import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, profilesTable, tutorsTable } from "@workspace/db";
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

// Map EGE subject labels → tutor subject names in DB
const SUBJECT_ALIASES: Record<string, string[]> = {
  "Иностранный язык": ["Английский язык", "Немецкий язык", "Французский язык"],
  "Математика (профиль)": ["Математика"],
  "Математика (база)": ["Математика"],
};

function resolveSubjects(egeSubjects: string[]): string[] {
  const resolved = new Set<string>();
  for (const s of egeSubjects) {
    const aliases = SUBJECT_ALIASES[s];
    if (aliases) aliases.forEach((a) => resolved.add(a));
    else resolved.add(s);
  }
  return [...resolved];
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
  if (isNaN(id)) { res.status(400).json({ error: "Invalid profile ID" }); return; }
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, id));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json(serializeProfile(profile));
});

// GET /edu/tutors?subjects=Математика,Физика
router.get("/edu/tutors", async (req, res): Promise<void> => {
  const raw = req.query.subjects as string | undefined;
  if (!raw) {
    const all = await db.select().from(tutorsTable).orderBy(tutorsTable.rating);
    res.json(all);
    return;
  }
  const subjects = resolveSubjects(raw.split(",").map((s) => s.trim()));
  const rows = subjects.length
    ? await db.select().from(tutorsTable).where(inArray(tutorsTable.subject, subjects))
    : await db.select().from(tutorsTable);
  res.json(rows);
});

// POST /edu/recommendations — AI-powered
router.post("/edu/recommendations", async (req, res): Promise<void> => {
  const parsed = GenerateRecommendationsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, parsed.data.profileId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

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
- Используй реальные специальности российских вузов
- Пиши на русском языке
- Отвечай строго JSON, без markdown-блоков`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const aiData = JSON.parse(text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());
  res.json(GenerateRecommendationsResponse.parse({ profileId: profile.id, ...aiData }));
});

// POST /edu/universities — AI-powered
router.post("/edu/universities", async (req, res): Promise<void> => {
  const parsed = MatchUniversitiesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, parsed.data.profileId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const directionHint = parsed.data.studyDirectionName
    ? `Предпочтительное направление: ${parsed.data.studyDirectionName}` : "";

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

Используй реальные московские вузы: МГУ, МФТИ, НИУ ВШЭ, МГТУ им. Баумана, РАНХиГС, МГИМО, РУДН, НИТУ МИСиС, МАИ, РЭУ им. Плеханова, МИРЭА и другие.
mathLevel: "базовый" или "профильный". id от 1 до 4. matchScore от 0 до 100. Пиши на русском.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const aiData = JSON.parse(text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());
  res.json(MatchUniversitiesResponse.parse(aiData));
});

// POST /edu/programs — AI structure + real tutors from DB
router.post("/edu/programs", async (req, res): Promise<void> => {
  const parsed = GenerateProgramsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, parsed.data.profileId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const currentYear = new Date().getFullYear();
  const monthsLeft = Math.max(1, (profile.egeYear - currentYear) * 12 + (6 - new Date().getMonth()));

  // Step 1: ask Claude for EGE subjects and course structure only (no tutors)
  const structurePrompt = `Ты — методист по подготовке к ЕГЭ.

Абитуриент поступает на: ${parsed.data.specialty}
Класс: ${profile.grade}, год ЕГЭ: ${profile.egeYear}, месяцев до ЕГЭ: ~${monthsLeft}

Верни ТОЛЬКО JSON (без markdown):
{
  "universityName": "Название вуза (строка)",
  "specialty": "${parsed.data.specialty}",
  "exams": ["Русский язык", "Математика (профиль)", "третий предмет"],
  "preparationMonths": ${monthsLeft},
  "programs": [
    {
      "type": "basic",
      "name": "Базовая программа",
      "durationMonths": ${Math.round(monthsLeft * 0.7)},
      "courses": [
        { "name": "Название курса", "subject": "Предмет ЕГЭ", "format": "онлайн", "durationWeeks": 16, "costPerMonth": 3500 }
      ],
      "totalCostEstimate": 45000
    },
    {
      "type": "intensive",
      "name": "Интенсивная программа",
      "durationMonths": ${Math.round(monthsLeft * 0.9)},
      "courses": [...],
      "totalCostEstimate": 75000
    },
    {
      "type": "individual",
      "name": "Индивидуальная программа",
      "durationMonths": ${monthsLeft},
      "courses": [...],
      "totalCostEstimate": 120000
    }
  ]
}

Дай 3 программы: basic, intensive, individual. Для каждой 2-3 курса (без репетиторов — только курсы).
Реалистичные цены в рублях. Пиши на русском языке.`;

  const structureMsg = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: structurePrompt }],
  });
  const structureText = structureMsg.content[0].type === "text" ? structureMsg.content[0].text : "";
  const structure = JSON.parse(structureText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim());

  // Step 2: fetch real tutors from DB that match the EGE subjects
  const egeSubjects: string[] = structure.exams ?? [];
  const dbSubjects = resolveSubjects(egeSubjects);
  const realTutors = dbSubjects.length
    ? await db.select().from(tutorsTable).where(inArray(tutorsTable.subject, dbSubjects))
    : await db.select().from(tutorsTable);

  // Step 3: attach tutors to each program (pick 1-2 relevant ones per program)
  const tutorsBySubject: Record<string, typeof realTutors> = {};
  for (const t of realTutors) {
    if (!tutorsBySubject[t.subject]) tutorsBySubject[t.subject] = [];
    tutorsBySubject[t.subject].push(t);
  }

  // Flatten tutors ordered by subject relevance, deduplicated
  const orderedTutors: typeof realTutors = [];
  const seen = new Set<number>();
  for (const subj of dbSubjects) {
    for (const t of tutorsBySubject[subj] ?? []) {
      if (!seen.has(t.id)) { seen.add(t.id); orderedTutors.push(t); }
    }
  }

  const programsWithTutors = (structure.programs as any[]).map((prog, i) => {
    // Each program gets a different slice so tutors aren't identical across all three
    const slice = orderedTutors.slice(i, i + 2).map((t) => ({
      name: t.name,
      subject: t.subject,
      experience: `${t.experienceYears} ${t.experienceYears === 1 ? "год" : t.experienceYears < 5 ? "года" : "лет"}`,
      rating: parseFloat(String(t.rating)),
      costPerHour: t.costPerHour,
      bio: t.bio ?? undefined,
      format: t.format,
    }));
    return { ...prog, tutors: slice };
  });

  res.json(GenerateProgramsResponse.parse({
    universityName: structure.universityName,
    specialty: structure.specialty,
    exams: structure.exams,
    preparationMonths: structure.preparationMonths,
    programs: programsWithTutors,
  }));
});

export default router;
