#!/bin/bash
# ============================================================
# EduPath — применяет схему БД и заполняет репетиторов
# Запускать после первого запуска и при изменениях схемы
# ============================================================
set -e

cd ~/edupath/deploy

source .env

DB_CONTAINER=$(docker ps --filter "name=deploy-db" --format "{{.Names}}" | head -1)
echo "==> Применяем схему БД в контейнере: ${DB_CONTAINER}"

docker exec -i \
  -e PGPASSWORD="${DB_PASSWORD}" \
  "${DB_CONTAINER}" \
  psql -U edupath -d edupath < migrate.sql

echo "==> Схема применена и репетиторы добавлены успешно."
