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

echo "==> [1/4] Подготовка esbuild для Mac (darwin-arm64)..."
# pnpm-workspace.yaml исключает darwin-биарники (не нужны на Linux/Replit).
# Скачиваем нужный бинарник через npm и копируем прямо в директорию pnpm-пакета.
ESBUILD_PNPM="node_modules/.pnpm/esbuild@0.27.3/node_modules/esbuild"
if [ -d "$ESBUILD_PNPM" ]; then
  npm install --prefix /tmp/esbuild-fix @esbuild/darwin-arm64@0.27.3 --no-save --silent 2>/dev/null || true
  if [ -f "/tmp/esbuild-fix/node_modules/@esbuild/darwin-arm64/bin/esbuild" ]; then
    mkdir -p "$ESBUILD_PNPM/node_modules/@esbuild/darwin-arm64/bin"
    cp /tmp/esbuild-fix/node_modules/@esbuild/darwin-arm64/bin/esbuild \
       "$ESBUILD_PNPM/node_modules/@esbuild/darwin-arm64/bin/"
    cp /tmp/esbuild-fix/node_modules/@esbuild/darwin-arm64/package.json \
       "$ESBUILD_PNPM/node_modules/@esbuild/darwin-arm64/"
    echo "    esbuild darwin-arm64 установлен."
  fi
fi

echo "==> [1b/4] Подготовка rollup для Mac (darwin-arm64)..."
ROLLUP_PNPM="node_modules/.pnpm/rollup@4.62.2/node_modules/rollup"
if [ -d "$ROLLUP_PNPM" ]; then
  npm install --prefix /tmp/rollup-fix @rollup/rollup-darwin-arm64@4.62.2 --no-save --silent 2>/dev/null || true
  if [ -f "/tmp/rollup-fix/node_modules/@rollup/rollup-darwin-arm64/rollup.darwin-arm64.node" ]; then
    mkdir -p "$ROLLUP_PNPM/node_modules/@rollup/rollup-darwin-arm64"
    cp /tmp/rollup-fix/node_modules/@rollup/rollup-darwin-arm64/* \
       "$ROLLUP_PNPM/node_modules/@rollup/rollup-darwin-arm64/" 2>/dev/null || true
    echo "    rollup darwin-arm64 установлен."
  fi
fi

echo "==> [2/4] Сборка фронтенда локально..."
PORT=3000 BASE_PATH=/ NODE_ENV=production \
  pnpm --filter @workspace/edu-consultant run build

echo "==> [3/4] Загрузка файлов на EC2..."
rsync -az --delete \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  artifacts/edu-consultant/dist/public/ \
  $EC2_USER@$EC2_HOST:/tmp/frontend-dist/

echo "==> [4/4] Копирование в nginx-контейнер..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST \
  "docker cp /tmp/frontend-dist/. deploy-web-1:/usr/share/nginx/html/"

echo "==> [4/4] Очистка временных файлов..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $EC2_USER@$EC2_HOST \
  "rm -rf /tmp/frontend-dist"

echo ""
echo "✅ Готово! Фронтенд обновлён. Обновите страницу в браузере."
