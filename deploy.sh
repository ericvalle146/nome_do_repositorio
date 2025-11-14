#!/usr/bin/env bash

set -euo pipefail

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

BACKEND_PORT="${BACKEND_PORT:-3002}"
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

log "Carregando variáveis do .env para o build..."
# Limpa variáveis antigas
unset VITE_API_URL VITE_WEBHOOK_URL VITE_ALLOWED_HOSTS

# Carrega variáveis VITE_* do .env
if [ -f "$ENV_FILE" ]; then
  # Exporta apenas variáveis VITE_* (ignora comentários e linhas vazias)
  export $(grep -E '^VITE_' "$ENV_FILE" | grep -v '^#' | xargs)
  
  log "Variáveis carregadas:"
  log "  VITE_API_URL=${VITE_API_URL:-NÃO DEFINIDO}"
  log "  VITE_WEBHOOK_URL=${VITE_WEBHOOK_URL:-NÃO DEFINIDO}"
  log "  VITE_ALLOWED_HOSTS=${VITE_ALLOWED_HOSTS:-NÃO DEFINIDO}"
  
  # Valida VITE_API_URL
  if [ -z "$VITE_API_URL" ]; then
    warn "VITE_API_URL não está definido no .env"
    warn "Usando valor padrão: https://chatinho.versatecnologia.com.br"
    export VITE_API_URL="https://chatinho.versatecnologia.com.br"
  fi
  
  # Valida se não tem valores errados
  if [[ "$VITE_API_URL" == *"conversa"* ]]; then
    error "ERRO: VITE_API_URL no .env contém 'conversa' (domínio errado)!"
    error "Corrija o .env para: VITE_API_URL=https://chatinho.versatecnologia.com.br"
  fi
  
  if [[ "$VITE_API_URL" == *":3001"* ]] || [[ "$VITE_API_URL" == *":3002"* ]] || [[ "$VITE_API_URL" == *":4001"* ]]; then
    warn "ATENÇÃO: VITE_API_URL contém porta!"
    warn "A URL não deve conter porta. Remova a porta do .env"
    warn "Valor atual: $VITE_API_URL"
  fi
else
  warn "Arquivo .env não encontrado. Variáveis VITE_* não serão carregadas."
fi

log "Limpando build anterior..."
rm -rf dist node_modules/.vite .vite .vite-cache

log "Gerando build do frontend com variáveis do .env..."
# Força modo produção
export NODE_ENV=production
export MODE=production

# Build com as variáveis exportadas
npm run build

# Verifica se o build foi gerado corretamente
if [ ! -d "dist" ]; then
  error "ERRO: Build não foi gerado! Pasta dist não existe."
fi

log "Verificando build gerado..."
# Verifica se não tem valores antigos
if grep -r "conversa.versatecnologia.com.br" dist/ 2>/dev/null | head -1; then
  error "ERRO: Build contém 'conversa'! O .env pode estar incorreto ou o build não foi atualizado."
fi

if grep -r ":3001" dist/ 2>/dev/null | grep -v ".map" | head -1; then
  warn "ATENÇÃO: Build contém ':3001'. Verifique se é esperado."
fi

log "✅ Build gerado com sucesso"

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

