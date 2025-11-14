#!/bin/bash

# Script DESTRUTIVO - Remove TUDO e reconstrói do zero

set -e

APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$APP_ROOT"

echo "💥 DESTRUIÇÃO E REBUILD COMPLETO"
echo "=================================="
echo ""
echo "⚠️  Este script vai:"
echo "   1. Parar e remover TODOS os processos PM2"
echo "   2. Deletar TUDO (dist, caches, node_modules/.vite)"
echo "   3. Verificar e validar .env"
echo "   4. Fazer rebuild completo"
echo "   5. Reiniciar serviços"
echo ""
read -p "Continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "❌ Cancelado"
  exit 1
fi

echo ""
echo "🔥 Iniciando destruição..."
echo ""

# 1. PARA E REMOVE APENAS OS PROCESSOS DO VERSIA
echo "1️⃣ Parando e removendo processos PM2 do VERSIA..."
pm2 stop versia-server 2>/dev/null || true
pm2 stop versia-web 2>/dev/null || true
pm2 delete versia-server 2>/dev/null || true
pm2 delete versia-web 2>/dev/null || true
sleep 2
echo "✅ Processos VERSIA removidos (outros serviços PM2 não foram afetados)"
echo ""

# 2. MATA PROCESSOS NA PORTA 4173 (apenas se for do versia-web)
echo "2️⃣ Verificando porta 4173..."
# Verifica se há processo na porta e se é do versia
PORT_PID=$(lsof -ti:4173 2>/dev/null || true)
if [ ! -z "$PORT_PID" ]; then
  # Verifica se o processo é do node/npm (versia-web)
  if ps -p $PORT_PID -o comm= | grep -qE "(node|npm)"; then
    echo "   Matando processo do versia-web na porta 4173..."
    kill -9 $PORT_PID 2>/dev/null || true
    sleep 1
    echo "✅ Porta 4173 liberada"
  else
    echo "⚠️  Porta 4173 está em uso por outro processo (não será encerrado)"
  fi
else
  echo "✅ Porta 4173 está livre"
fi
echo ""

# 3. REMOVE TUDO DO PROJETO VERSIA (apenas dentro deste diretório)
echo "3️⃣ Removendo builds e caches do projeto VERSIA..."
echo "   (Apenas arquivos dentro de: $APP_ROOT)"
rm -rf dist
rm -rf node_modules/.vite
rm -rf .vite
rm -rf .vite-cache
rm -rf .cache
# Remove apenas .js.map dentro do diretório atual
find . -maxdepth 10 -name "*.js.map" -delete 2>/dev/null || true
find . -maxdepth 5 -name ".vite" -type d -exec rm -rf {} + 2>/dev/null || true
echo "✅ Limpeza completa (apenas arquivos do projeto VERSIA)"
echo ""

# 4. VERIFICA .env
echo "4️⃣ Verificando .env..."
if [ ! -f .env ]; then
  echo "❌ ERRO: Arquivo .env não encontrado!"
  echo "   Crie o arquivo .env baseado no env.example"
  exit 1
fi

# Mostra VITE_API_URL
echo "📋 Conteúdo atual do .env (VITE_*):"
grep "^VITE_" .env || echo "⚠️ Nenhuma variável VITE_ encontrada"

# Verifica erros
HAS_ERROR=0

if grep -q "conversa" .env; then
  echo ""
  echo "❌ ERRO: .env contém 'conversa'!"
  HAS_ERROR=1
fi

if grep -q "VITE_API_URL.*:3001" .env || grep -q "VITE_API_URL.*:3002" .env; then
  echo ""
  echo "❌ ERRO: .env contém porta na VITE_API_URL!"
  HAS_ERROR=1
fi

if [ $HAS_ERROR -eq 1 ]; then
  echo ""
  echo "🔧 CORRIJA O .env ANTES DE CONTINUAR!"
  echo ""
  echo "A linha VITE_API_URL deve ser:"
  echo "VITE_API_URL=https://chatinho.versatecnologia.com.br"
  echo ""
  echo "SEM porta, SEM 'conversa'"
  exit 1
fi

echo "✅ .env validado"
echo ""

# 5. CARREGA VARIÁVEIS
echo "5️⃣ Carregando variáveis do .env..."
# Limpa variáveis antigas
unset VITE_API_URL VITE_WEBHOOK_URL VITE_ALLOWED_HOSTS

# Carrega do .env
export $(grep -E '^VITE_' .env | grep -v '^#' | xargs)

# Se não carregou, usa padrão
if [ -z "$VITE_API_URL" ]; then
  echo "⚠️ VITE_API_URL não encontrado, usando padrão..."
  export VITE_API_URL="https://chatinho.versatecnologia.com.br"
fi

echo "📋 Variáveis que serão usadas no build:"
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

# 6. BUILD FORÇADO
echo "6️⃣ Fazendo build FORÇADO..."
echo "   Modo: production"
echo "   VITE_API_URL: $VITE_API_URL"
echo ""

# Força modo produção e limpa variáveis antigas
export NODE_ENV=production
export MODE=production

# Build
npm run build

echo ""
echo "✅ Build concluído"
echo ""

# 7. VERIFICAÇÃO CRÍTICA
echo "7️⃣ Verificando build gerado..."
if [ ! -d "dist" ]; then
  echo "❌ ERRO: Pasta dist não foi criada!"
  exit 1
fi

echo "   Procurando valores no build..."
echo ""

# Procura "conversa"
CONVERSA_FOUND=$(grep -r "conversa.versatecnologia.com.br" dist/ 2>/dev/null | wc -l)
if [ "$CONVERSA_FOUND" -gt 0 ]; then
  echo "❌ ERRO CRÍTICO: Build contém 'conversa' ($CONVERSA_FOUND ocorrências)!"
  grep -r "conversa.versatecnologia.com.br" dist/ 2>/dev/null | head -5
  echo ""
  echo "O build foi feito com valores antigos!"
  echo "Verifique o .env e tente novamente."
  exit 1
fi

# Procura ":3001"
PORT_FOUND=$(grep -r ":3001" dist/ 2>/dev/null | grep -v ".map" | wc -l)
if [ "$PORT_FOUND" -gt 0 ]; then
  echo "⚠️ ATENÇÃO: Build contém ':3001' ($PORT_FOUND ocorrências)"
  grep -r ":3001" dist/ 2>/dev/null | grep -v ".map" | head -3
  echo ""
fi

# Verifica domínio correto
CHATINHO_FOUND=$(grep -r "chatinho.versatecnologia.com.br" dist/ 2>/dev/null | wc -l)
if [ "$CHATINHO_FOUND" -gt 0 ]; then
  echo "✅ Build contém domínio correto: chatinho.versatecnologia.com.br ($CHATINHO_FOUND ocorrências)"
fi

echo ""
echo "✅ Verificação concluída"
echo ""

# 8. REINICIA SERVIÇOS
echo "8️⃣ Reiniciando serviços..."

# Backend
echo "   Iniciando backend..."
PORT="${BACKEND_PORT:-3002}" pm2 start server/index.js --name versia-server --time

# Frontend
echo "   Iniciando frontend..."
FRONTEND_PORT="${FRONTEND_PORT:-4173}"
pm2 start npm --name versia-web -- run preview -- --host 0.0.0.0 --port "$FRONTEND_PORT"

# Salva PM2
pm2 save

echo ""
echo "✅ Serviços reiniciados"
echo ""

# 9. STATUS
echo "9️⃣ Status final:"
pm2 status
echo ""

echo "=================================="
echo "✅ DESTRUIÇÃO E REBUILD CONCLUÍDOS!"
echo ""
echo "📋 PRÓXIMOS PASSOS CRÍTICOS:"
echo ""
echo "1. LIMPE O CACHE DO NAVEGADOR COMPLETAMENTE:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete"
echo "   - Selecione 'Todo o período'"
echo "   - Marque 'Imagens e arquivos em cache'"
echo "   - Clique em 'Limpar dados'"
echo ""
echo "   OU use modo anônimo: Ctrl+Shift+N"
echo ""
echo "2. Abra o console do navegador (F12)"
echo ""
echo "3. Recarregue a página FORÇADAMENTE:"
echo "   - Ctrl+Shift+R (Windows/Linux)"
echo "   - Cmd+Shift+R (Mac)"
echo ""
echo "4. Verifique os logs no console:"
echo "   - Deve mostrar: chatinho.versatecnologia.com.br"
echo "   - NÃO deve mostrar: conversa ou :3001"
echo ""
echo "5. Se ainda mostrar 'conversa' ou ':3001':"
echo "   - O navegador está usando cache"
echo "   - Feche TODAS as abas do site"
echo "   - Feche o navegador completamente"
echo "   - Abra novamente em modo anônimo"
echo ""
echo "📊 Logs do servidor:"
echo "   pm2 logs versia-web"
echo ""

