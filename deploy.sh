#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-4173}"

APP_NAME_SERVER="versia-server"
APP_NAME_WEB="versia-web"

log() {
  printf "\033[1;32m[deploy]\033[0m %s\n" "$*"
}

warn() {
  printf "\033[1;33m[deploy]\033[0m %s\n" "$*" >&2
}

error() {
  printf "\033[1;31m[deploy]\033[0m %s\n" "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || error "Comando obrigatório não encontrado: $1"
}

require_cmd node
require_cmd npm

NODE_MAJOR_VERSION="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if (( NODE_MAJOR_VERSION < 18 )); then
  error "Node.js >= 18 é necessário (versão atual: $(node -v))"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  log "Instalando pm2 globalmente..."
  npm install -g pm2
fi

ENV_FILE="$APP_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  warn "Arquivo .env não encontrado."
  read -rp "Informe a URL do webhook (ex: https://meuwebhook.com/endpoint): " INPUT_WEBHOOK
  if [ -z "${INPUT_WEBHOOK}" ]; then
    warn "Nenhuma URL informada. Usando placeholder."
    INPUT_WEBHOOK="https://defina-sua-url-de-webhook.example.com"
  fi

  read -rp "Informe a URL pública da API (default: http://localhost:${BACKEND_PORT}): " INPUT_API
  if [ -z "${INPUT_API}" ]; then
    INPUT_API="http://localhost:${BACKEND_PORT}"
  fi

  cat > "$ENV_FILE" <<EOF
VITE_WEBHOOK_URL=${INPUT_WEBHOOK}
VITE_API_URL=${INPUT_API}
EOF

  log "Arquivo .env criado. Revise os valores conforme necessário."
else
  log "Usando .env existente."
fi

log "Instalando dependências (npm ci)..."
if [ -f "$APP_ROOT/package-lock.json" ]; then
  npm ci
else
  npm install
fi

log "Gerando build do frontend..."
npm run build

log "Parando processos anteriores do pm2 (se existirem)..."
pm2 delete "$APP_NAME_SERVER" >/dev/null 2>&1 || true
pm2 delete "$APP_NAME_WEB" >/dev/null 2>&1 || true

log "Subindo servidor backend (porta ${BACKEND_PORT})..."
PORT="$BACKEND_PORT" pm2 start server/index.js --name "$APP_NAME_SERVER" --time

log "Subindo frontend na porta ${FRONTEND_PORT}..."
pm2 start npm --name "$APP_NAME_WEB" -- run preview -- --host 0.0.0.0 --port "$FRONTEND_PORT"

log "Salvando configuração do pm2..."
pm2 save

log "Status atual do pm2:"
pm2 status

cat <<EOF

Deploy concluído!

- Backend rodando em: http://localhost:${BACKEND_PORT}
- Frontend rodando em: http://localhost:${FRONTEND_PORT}
- Arquivo de log do pm2: pm2 logs
- Para reiniciar: pm2 restart ${APP_NAME_SERVER} e pm2 restart ${APP_NAME_WEB}
- Para habilitar pm2 no boot: pm2 startup

EOF

