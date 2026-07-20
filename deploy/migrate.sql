-- EduPath schema + seed
-- Безопасно запускать повторно (IF NOT EXISTS / ON CONFLICT DO NOTHING)

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  grade TEXT NOT NULL,
  ege_year INTEGER NOT NULL,
  favorite_subjects JSONB NOT NULL,
  hobbies JSONB NOT NULL,
  interests JSONB NOT NULL,
  priorities JSONB NOT NULL,
  orientation_answers JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS tutors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  rating NUMERIC(3,1) NOT NULL,
  cost_per_hour INTEGER NOT NULL,
  format TEXT NOT NULL,
  bio TEXT
);

-- Seed tutors (пропускаем если уже есть)
INSERT INTO tutors (name, subject, experience_years, rating, cost_per_hour, format, bio) VALUES
  ('Анна Смирнова',     'Математика',       7,  4.9, 1800, 'онлайн',        'Специализация: ЕГЭ профиль. Средний балл учеников — 87'),
  ('Дмитрий Козлов',    'Физика',           5,  4.7, 1600, 'онлайн/офлайн', 'Готовлю к ЕГЭ и олимпиадам'),
  ('Мария Иванова',     'Русский язык',     10, 4.8, 1400, 'онлайн',        '100 баллов у 3 учеников за последние 2 года'),
  ('Игорь Петров',      'Химия',            13, 4.9, 3000, 'онлайн',        'Поступление в МГУ и Губку'),
  ('Алексей Захаров',   'Биология',         8,  5.0, 2500, 'онлайн',        'ЕГЭ и Олимпиады'),
  ('Мария Литвинова',   'История',          5,  4.8, 2900, 'онлайн/очно',   'ЕГЭ на 100, Олимпиады'),
  ('Ольга Кудрявцева',  'География',        6,  4.9, 3500, 'онлайн',        'Средний балл 90'),
  ('Андрей Боков',      'Обществознание',   3,  4.8, 2500, 'онлайн',        'ЕГЭ, Олимпиады. Средний балл учеников 92'),
  ('Анна Варламова',    'Литература',       24, 4.9, 3000, 'онлайн',        '7 стобальников за прошлые 4 года'),
  ('Михаил Ветров',     'Информатика',      5,  4.9, 3000, 'онлайн',        'ЕГЭ, Олимпиады, проекты'),
  ('Анатолий Светлов',  'Английский язык',  5,  4.9, 3000, 'онлайн',        'ЕГЭ средний балл 91'),
  ('Инга Михайлова',    'Немецкий язык',    5,  4.9, 3000, 'онлайн',        'Готовлю в МГУ и Вышку'),
  ('Ольга Румянцева',   'Французский язык', 5,  4.9, 3000, 'онлайн',        'Готовлю к ЕГЭ и олимпиадам')
ON CONFLICT DO NOTHING;
