#!/bin/bash

# Script para rebuild do frontend com as variáveis do .env atualizadas

set -e

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

echo "🔨 Rebuild do Frontend VERSIA"
echo ""

# Carrega variáveis do .env
if [ -f .env ]; then
  echo "📋 Carregando variáveis do .env..."
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️ Arquivo .env não encontrado!"
  exit 1
fi

# Verifica se as variáveis necessárias estão definidas
if [ -z "$VITE_API_URL" ]; then
  echo "⚠️ VITE_API_URL não está definido no .env"
  echo "💡 Usando valor padrão: https://chatinho.versatecnologia.com.br"
  export VITE_API_URL="https://chatinho.versatecnologia.com.br"
fi

echo "🌐 VITE_API_URL: $VITE_API_URL"
echo "🔗 VITE_WEBHOOK_URL: ${VITE_WEBHOOK_URL:-não definido}"
echo "🌍 VITE_ALLOWED_HOSTS: ${VITE_ALLOWED_HOSTS:-não definido}"
echo ""

# Para o frontend atual
echo "🛑 Parando frontend atual..."
pm2 stop versia-web 2>/dev/null || true

# Faz o rebuild
echo "🔨 Fazendo rebuild do frontend..."
npm run build

# Reinicia o frontend
echo "🚀 Reiniciando frontend..."
pm2 restart versia-web || pm2 start npm --name versia-web -- run preview -- --host 0.0.0.0 --port "${FRONTEND_PORT:-4173}"

echo ""
echo "✅ Rebuild concluído!"
echo ""
echo "📊 Status:"
pm2 status

echo ""
echo "📋 Logs:"
echo "   pm2 logs versia-web"

