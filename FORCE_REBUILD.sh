#!/bin/bash

# Script FORÇADO para rebuild completo - RESOLVE PROBLEMA DE BUILD ANTIGO

set -e

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

echo "🔥 REBUILD FORÇADO - Frontend VERSIA"
echo "===================================="
echo ""

# 1. Para TUDO
echo "1️⃣ Parando TODOS os processos..."
pm2 stop versia-web 2>/dev/null || true
pm2 delete versia-web 2>/dev/null || true
sleep 2

# 2. Limpa TUDO (builds, caches, node_modules/.vite)
echo "2️⃣ Limpando TUDO..."
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite
rm -rf .vite-cache
find . -name "*.js.map" -delete 2>/dev/null || true
echo "✅ Limpeza completa"
echo ""

# 3. Verifica .env
echo "3️⃣ Verificando .env..."
if [ ! -f .env ]; then
  echo "❌ ERRO: Arquivo .env não encontrado!"
  exit 1
fi

# Mostra o VITE_API_URL atual
echo "📋 VITE_API_URL atual no .env:"
grep "^VITE_API_URL" .env || echo "⚠️ VITE_API_URL não encontrado no .env"

# Verifica se tem valores errados
if grep -q "conversa" .env; then
  echo "❌ ERRO: .env contém 'conversa'!"
  echo "   Corrija o .env primeiro!"
  exit 1
fi

if grep -q "VITE_API_URL.*:3001" .env || grep -q "VITE_API_URL.*:3002" .env; then
  echo "❌ ERRO: .env contém porta na VITE_API_URL!"
  echo "   VITE_API_URL deve ser apenas o domínio (sem porta)"
  echo "   Exemplo: VITE_API_URL=https://chatinho.versatecnologia.com.br"
  exit 1
fi

echo "✅ .env validado"
echo ""

# 4. Carrega variáveis
echo "4️⃣ Carregando variáveis do .env..."
unset VITE_API_URL VITE_WEBHOOK_URL VITE_ALLOWED_HOSTS
export $(grep -E '^VITE_' .env | grep -v '^#' | xargs)

# Verifica se carregou
if [ -z "$VITE_API_URL" ]; then
  echo "⚠️ VITE_API_URL não carregado, usando padrão..."
  export VITE_API_URL="https://chatinho.versatecnologia.com.br"
fi

echo "📋 Variáveis carregadas:"
echo "   VITE_API_URL=$VITE_API_URL"
echo "   VITE_WEBHOOK_URL=${VITE_WEBHOOK_URL:-não definido}"
echo "   VITE_ALLOWED_HOSTS=${VITE_ALLOWED_HOSTS:-não definido}"
echo ""

# Valida novamente
if [[ "$VITE_API_URL" == *"conversa"* ]]; then
  echo "❌ ERRO: VITE_API_URL ainda contém 'conversa'!"
  echo "   Valor: $VITE_API_URL"
  exit 1
fi

if [[ "$VITE_API_URL" == *":3001"* ]] || [[ "$VITE_API_URL" == *":3002"* ]]; then
  echo "❌ ERRO: VITE_API_URL contém porta!"
  echo "   Valor: $VITE_API_URL"
  exit 1
fi

echo "✅ Variáveis validadas"
echo ""

# 5. Build FORÇADO
echo "5️⃣ Fazendo build FORÇADO..."
echo "   Modo: production"
echo "   VITE_API_URL será: $VITE_API_URL"
echo ""

# Força modo produção
export NODE_ENV=production
export MODE=production

# Build
npm run build

echo ""
echo "✅ Build concluído"
echo ""

# 6. VERIFICAÇÃO CRÍTICA DO BUILD
echo "6️⃣ Verificando build gerado..."
if [ ! -d "dist" ]; then
  echo "❌ ERRO: Pasta dist não foi criada!"
  exit 1
fi

echo "   Procurando valores antigos no build..."
echo ""

# Procura por "conversa"
if grep -r "conversa.versatecnologia.com.br" dist/ 2>/dev/null | head -3; then
  echo ""
  echo "❌ ERRO CRÍTICO: Build contém 'conversa.versatecnologia.com.br'!"
  echo "   O build não foi atualizado corretamente."
  echo "   Possíveis causas:"
  echo "   1. Cache do Vite não foi limpo"
  echo "   2. Variáveis não foram carregadas corretamente"
  echo "   3. Build foi feito com valores antigos"
  exit 1
fi

# Procura por ":3001"
if grep -r ":3001" dist/ 2>/dev/null | grep -v ".map" | head -3; then
  echo ""
  echo "⚠️ ATENÇÃO: Build contém ':3001'"
  echo "   (pode ser de outro lugar, mas verifique)"
fi

# Verifica se tem o domínio correto
if grep -r "chatinho.versatecnologia.com.br" dist/ 2>/dev/null | head -3; then
  echo ""
  echo "✅ Build contém domínio correto: chatinho.versatecnologia.com.br"
fi

echo ""
echo "✅ Verificação concluída"
echo ""

# 7. Reinicia frontend
echo "7️⃣ Reiniciando frontend..."
FRONTEND_PORT="${FRONTEND_PORT:-4173}"
pm2 start npm --name versia-web -- run preview -- --host 0.0.0.0 --port "$FRONTEND_PORT"

echo ""
echo "✅ Frontend reiniciado na porta $FRONTEND_PORT"
echo ""

# 8. Status
echo "8️⃣ Status final:"
pm2 status
echo ""

echo "===================================="
echo "✅ REBUILD FORÇADO CONCLUÍDO!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Limpe o cache do navegador COMPLETAMENTE:"
echo "      - Chrome/Edge: Ctrl+Shift+Delete → Limpar dados de navegação"
echo "      - Ou use modo anônimo: Ctrl+Shift+N"
echo ""
echo "   2. Abra o console do navegador (F12)"
echo ""
echo "   3. Recarregue a página (Ctrl+Shift+R ou Ctrl+F5)"
echo ""
echo "   4. Verifique os logs no console"
echo "      - Deve mostrar: chatinho.versatecnologia.com.br"
echo "      - NÃO deve mostrar: conversa ou :3001"
echo ""
echo "📊 Para ver logs do servidor:"
echo "   pm2 logs versia-web"
echo ""

