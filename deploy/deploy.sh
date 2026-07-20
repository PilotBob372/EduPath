#!/bin/bash
# ============================================================
# EduPath — обновление приложения (после git pull)
# Запускать при каждом обновлении кода
# ============================================================
set -e

cd ~/edupath

echo "==> [1/3] Получаем последнюю версию кода..."
git pull origin main

echo "==> [2/3] Пересобираем и перезапускаем контейнеры..."
cd deploy
docker-compose --env-file .env up -d --build --remove-orphans

echo "==> [3/3] Удаляем устаревшие образы..."
docker image prune -f

echo ""
echo "==> Обновление завершено. Статус:"
docker-compose --env-file .env ps
