#!/bin/bash

# Script para corrigir o build do frontend - FORÇA REBUILD COMPLETO

set -e

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

echo "🔧 CORREÇÃO DE BUILD - Frontend VERSIA"
echo "========================================"
echo ""

# 1. Para tudo
echo "1️⃣ Parando processos..."
pm2 stop versia-web 2>/dev/null || true
sleep 2

# 2. Limpa TUDO
echo "2️⃣ Limpando builds e caches antigos..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite
find . -name "*.js.map" -delete 2>/dev/null || true
echo "✅ Limpeza concluída"
echo ""

# 3. Carrega .env
echo "3️⃣ Carregando variáveis do .env..."
if [ ! -f .env ]; then
  echo "❌ ERRO: Arquivo .env não encontrado!"
  exit 1
fi

# Carrega variáveis do .env (apenas VITE_*)
export $(grep -E '^VITE_' .env | grep -v '^#' | xargs)

# Verifica variáveis críticas
echo "📋 Variáveis carregadas:"
echo "   VITE_API_URL=${VITE_API_URL:-NÃO DEFINIDO}"
echo "   VITE_WEBHOOK_URL=${VITE_WEBHOOK_URL:-NÃO DEFINIDO}"
echo "   VITE_ALLOWED_HOSTS=${VITE_ALLOWED_HOSTS:-NÃO DEFINIDO}"
echo ""

# Valida VITE_API_URL
if [ -z "$VITE_API_URL" ]; then
  echo "⚠️ VITE_API_URL não está definido!"
  echo "💡 Definindo valor padrão..."
  export VITE_API_URL="https://chatinho.versatecnologia.com.br"
fi

# Verifica se tem porta na URL (não deve ter)
if [[ "$VITE_API_URL" == *":3001"* ]] || [[ "$VITE_API_URL" == *":3002"* ]] || [[ "$VITE_API_URL" == *":4001"* ]]; then
  echo "⚠️ ATENÇÃO: VITE_API_URL contém porta!"
  echo "   Valor atual: $VITE_API_URL"
  echo "   Deve ser apenas o domínio (sem porta)"
  echo ""
  read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Cancelado. Corrija o .env primeiro."
    exit 1
  fi
fi

# Verifica se tem "conversa" no domínio
if [[ "$VITE_API_URL" == *"conversa"* ]]; then
  echo "❌ ERRO: VITE_API_URL contém 'conversa' (domínio errado)!"
  echo "   Valor atual: $VITE_API_URL"
  echo "   Deve ser: https://chatinho.versatecnologia.com.br"
  exit 1
fi

echo "✅ Variáveis validadas"
echo ""

# 4. Faz build FORÇADO
echo "4️⃣ Fazendo build FORÇADO com variáveis corretas..."
echo "   VITE_API_URL=$VITE_API_URL"
echo ""

# Força modo produção
export NODE_ENV=production

# Build
npm run build

echo ""
echo "✅ Build concluído"
echo ""

# 5. Verifica se o build tem as variáveis corretas
echo "5️⃣ Verificando build..."
if [ ! -d "dist" ]; then
  echo "❌ ERRO: Pasta dist não foi criada!"
  exit 1
fi

# Procura por valores antigos no build
echo "   Procurando valores antigos no build..."
if grep -r "conversa.versatecnologia.com.br" dist/ 2>/dev/null; then
  echo "❌ ERRO: Build ainda contém 'conversa.versatecnologia.com.br'!"
  echo "   O build não foi atualizado corretamente."
  exit 1
fi

if grep -r ":3001" dist/ 2>/dev/null | grep -v ".map" | head -1; then
  echo "⚠️ ATENÇÃO: Build contém ':3001' (pode ser de outro lugar)"
fi

# Verifica se tem o domínio correto
if grep -r "chatinho.versatecnologia.com.br" dist/ 2>/dev/null | head -1; then
  echo "✅ Build contém domínio correto: chatinho.versatecnologia.com.br"
fi

echo "✅ Verificação concluída"
echo ""

# 6. Reinicia frontend
echo "6️⃣ Reiniciando frontend..."
pm2 delete versia-web 2>/dev/null || true
sleep 1

FRONTEND_PORT="${FRONTEND_PORT:-4173}"
pm2 start npm --name versia-web -- run preview -- --host 0.0.0.0 --port "$FRONTEND_PORT"

echo ""
echo "✅ Frontend reiniciado na porta $FRONTEND_PORT"
echo ""

# 7. Status
echo "7️⃣ Status final:"
pm2 status
echo ""

echo "========================================"
echo "✅ CORREÇÃO CONCLUÍDA!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Limpe o cache do navegador (Ctrl+Shift+R)"
echo "   2. Recarregue a página"
echo "   3. Verifique o console do navegador"
echo ""
echo "📊 Para ver logs:"
echo "   pm2 logs versia-web"
echo ""

