#!/bin/bash
# ============================================================
# Применяет схему базы данных через drizzle-kit push
# Запускать после первого запуска и при изменениях схемы
# ============================================================
set -e

cd ~/edupath

source deploy/.env

echo "==> Применяем схему БД..."
docker run --rm \
  --network edupath_default \
  -e DATABASE_URL="postgresql://edupath:${DB_PASSWORD}@db:5432/edupath" \
  -v "$(pwd):/app" \
  -w /app \
  node:22-alpine sh -c "
    npm install -g pnpm &&
    pnpm install --frozen-lockfile &&
    pnpm --filter @workspace/db run push
  "

echo "==> Схема применена успешно."
