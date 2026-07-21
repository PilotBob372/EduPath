#!/bin/bash
# ============================================================
# Быстрое обновление фронтенда без пересборки Docker-образа.
# Собирает edu-consultant локально и копирует в nginx-контейнер.
# Использование: bash deploy/deploy-frontend.sh
# ============================================================
set -e

cd ~/edupath

echo "==> [1/4] Проверка Node.js и pnpm..."
if ! command -v node &>/dev/null; then
  echo "    Установка Node.js..."
  sudo dnf install -y nodejs
fi
if ! command -v pnpm &>/dev/null; then
  echo "    Установка pnpm..."
  sudo npm install -g pnpm@9
fi

echo "==> [2/4] Установка зависимостей (с кэшем)..."
pnpm install --no-frozen-lockfile 2>&1 | tail -5

echo "==> [3/4] Сборка фронтенда..."
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  pnpm --filter @workspace/edu-consultant run build

echo "==> [4/4] Копирование файлов в nginx-контейнер..."
WEB_CONTAINER=$(docker ps --filter "name=deploy-web" --format "{{.Names}}" | head -1)
docker cp artifacts/edu-consultant/dist/public/. ${WEB_CONTAINER}:/usr/share/nginx/html/

echo ""
echo "==> Готово! Фронтенд обновлён без пересборки Docker."
echo "    Изменения видны немедленно — обновите страницу."
