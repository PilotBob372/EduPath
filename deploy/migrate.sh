#!/bin/bash
# ============================================================
# Применяет схему базы данных через drizzle-kit push
# Запускать после первого запуска и при изменениях схемы
# ============================================================
set -e

cd ~/edupath

source deploy/.env

echo "==> Применяем схему БД..."
API_CONTAINER=$(docker ps --filter "name=deploy-api" --format "{{.Names}}" | head -1)
echo "==> Запускаем миграцию в контейнере: ${API_CONTAINER}"

docker exec \
  -e DATABASE_URL="postgresql://edupath:${DB_PASSWORD}@db:5432/edupath" \
  "${API_CONTAINER}" \
  sh -c "cd /app && pnpm --filter @workspace/db run push"

echo "==> Схема применена успешно."
