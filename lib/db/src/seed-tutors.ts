import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { tutorsTable } from "./schema/tutors";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const tutors = [
  { name: "Анна Смирнова",       subject: "Математика",       experienceYears: 7,  rating: "4.9", costPerHour: 1800, format: "онлайн",        bio: "Специализация: ЕГЭ профиль. Средний балл учеников — 87" },
  { name: "Дмитрий Козлов",      subject: "Физика",           experienceYears: 5,  rating: "4.7", costPerHour: 1600, format: "онлайн/офлайн", bio: "Готовлю к ЕГЭ и олимпиадам" },
  { name: "Мария Иванова",       subject: "Русский язык",     experienceYears: 10, rating: "4.8", costPerHour: 1400, format: "онлайн",        bio: "100 баллов у 3 учеников за последние 2 года" },
  { name: "Игорь Петров",        subject: "Химия",            experienceYears: 13, rating: "4.9", costPerHour: 3000, format: "онлайн",        bio: "Поступление в МГУ и Губку" },
  { name: "Алексей Захаров",     subject: "Биология",         experienceYears: 8,  rating: "5.0", costPerHour: 2500, format: "онлайн",        bio: "ЕГЭ и Олимпиады" },
  { name: "Мария Литвинова",     subject: "История",          experienceYears: 5,  rating: "4.8", costPerHour: 2900, format: "онлайн/очно",   bio: "ЕГЭ на 100, Олимпиады" },
  { name: "Ольга Кудрявцева",    subject: "География",        experienceYears: 6,  rating: "4.9", costPerHour: 3500, format: "онлайн",        bio: "Средний балл 90" },
  { name: "Андрей Боков",        subject: "Обществознание",   experienceYears: 3,  rating: "4.8", costPerHour: 2500, format: "онлайн",        bio: "ЕГЭ, Олимпиады. Средний балл учеников 92" },
  { name: "Анна Варламова",      subject: "Литература",       experienceYears: 24, rating: "4.9", costPerHour: 3000, format: "онлайн",        bio: "7 стобальников за прошлые 4 года" },
  { name: "Михаил Ветров",       subject: "Информатика",      experienceYears: 5,  rating: "4.9", costPerHour: 3000, format: "онлайн",        bio: "ЕГЭ, Олимпиады, проекты" },
  { name: "Анатолий Светлов",    subject: "Английский язык",  experienceYears: 5,  rating: "4.9", costPerHour: 3000, format: "онлайн",        bio: "ЕГЭ средний балл 91" },
  { name: "Инга Михайлова",      subject: "Немецкий язык",    experienceYears: 5,  rating: "4.9", costPerHour: 3000, format: "онлайн",        bio: "Готовлю в МГУ и Вышку" },
  { name: "Ольга Румянцева",     subject: "Французский язык", experienceYears: 5,  rating: "4.9", costPerHour: 3000, format: "онлайн",        bio: "Готовлю к ЕГЭ и олимпиадам" },
];

await db.delete(tutorsTable);
await db.insert(tutorsTable).values(tutors);
console.log(`Inserted ${tutors.length} tutors.`);
await pool.end();
