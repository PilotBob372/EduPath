#!/bin/bash
# ============================================================
# EduPath — первоначальная установка на EC2 (Ubuntu/Amazon Linux)
# Запускать один раз: bash setup.sh
# ============================================================
set -e

echo "==> [1/7] Установка Docker..."
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo systemctl enable --now docker

echo "==> [2/7] Установка Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "==> [3/7] Клонирование репозитория..."
git clone https://github.com/PilotBob372/EduPath.git ~/edupath
cd ~/edupath/deploy

echo "==> [4/7] Создание .env файла..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "!!! Заполните ~/edupath/deploy/.env и снова запустите deploy.sh !!!"
  echo "    nano ~/edupath/deploy/.env"
  exit 0
fi

echo "==> [5/7] Создание папок для сертификата..."
mkdir -p certbot/conf certbot/www

echo "==> [6/7] Запуск с HTTP-конфигом (для получения сертификата)..."
cp nginx/nginx-init.conf nginx/nginx.conf
docker-compose --env-file .env up -d --build web api db

echo "==> [7/7] Получение SSL-сертификата Let's Encrypt..."
docker-compose --env-file .env run --rm certbot

echo ""
echo "==> Переключение на HTTPS-конфиг..."
cp nginx/nginx.conf nginx/nginx.conf.bak
cp nginx/nginx-ssl.conf nginx/nginx.conf 2>/dev/null || \
  echo "Скопируйте nginx-ssl.conf в nginx.conf вручную"

echo "==> Перезапуск nginx с HTTPS..."
docker-compose --env-file .env up -d web

echo ""
echo "==> [ГОТОВО] Приложение запущено на https://edupath.biz"
echo ""
echo "    Применить схему БД: bash migrate.sh"
echo "    Обновить приложение: bash deploy.sh"
