#!/bin/bash
# ============================================================
# Сборка и деплой фронтенда с Mac на EC2.
# Запускать из корня проекта: bash deploy/deploy-from-mac.sh
# ============================================================
set -e

# ── Настройки ─────────────────────────────────────────────
EC2_HOST="100.53.15.232"
EC2_USER="ec2-user"
SSH_KEY="$HOME/.ssh/EduPath.pem"
# ──────────────────────────────────────────────────────────

echo "==> [1/4] Сборка фронтенда локально..."
pnpm --filter @workspace/edu-consultant run build

echo "==> [2/4] Загрузка файлов на EC2..."
rsync -az --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  artifacts/edu-consultant/dist/public/ \
  $EC2_USER@$EC2_HOST:/tmp/frontend-dist/

echo "==> [3/4] Копирование в nginx-контейнер..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST \
  "docker cp /tmp/frontend-dist/. deploy-web-1:/usr/share/nginx/html/"

echo "==> [4/4] Очистка временных файлов..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST \
  "rm -rf /tmp/frontend-dist"

echo ""
echo "✅ Готово! Фронтенд обновлён. Обновите страницу в браузере."
