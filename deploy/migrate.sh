#!/bin/bash
# ============================================================
# Применяет схему базы данных через drizzle-kit push
# Запускать после первого запуска и при изменениях схемы
# ============================================================
set -e

cd ~/edupath

source deploy/.env

echo "==> Применяем схему БД..."
NETWORK=$(docker network ls --filter "name=_default" --format "{{.Name}}" | grep -E "^(deploy|edupath)_default$" | head -1)
echo "==> Используем сеть: ${NETWORK}"

docker run --rm \
  --network "${NETWORK}" \
  -e DATABASE_URL="postgresql://edupath:${DB_PASSWORD}@db:5432/edupath" \
  -v "$(pwd):/app" \
  -w /app \
  node:22-alpine sh -c "
    npm install -g pnpm &&
    pnpm install --no-frozen-lockfile &&
    pnpm --filter @workspace/db run push
  "

echo "==> Схема применена успешно."
