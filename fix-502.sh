#!/bin/bash

# Script para diagnosticar e corrigir erro 502

set -e

echo "🔧 DIAGNÓSTICO E CORREÇÃO - Erro 502"
echo "====================================="
echo ""

# 1. Verifica processos PM2
echo "1️⃣ Verificando processos PM2..."
pm2 status
echo ""

# 2. Verifica se backend está rodando
echo "2️⃣ Testando backend (porta 3002)..."
if curl -s http://localhost:3002/api/health > /dev/null 2>&1; then
  echo "✅ Backend está respondendo"
  curl -s http://localhost:3002/api/health | head -3
else
  echo "❌ Backend NÃO está respondendo!"
  echo "   Tentando iniciar..."
  cd ~/nome_do_repositorio
  PORT=3002 pm2 start server/index.js --name versia-server --time || true
  sleep 2
  curl -s http://localhost:3002/api/health || echo "   Ainda não responde"
fi
echo ""

# 3. Verifica se frontend está rodando
echo "3️⃣ Testando frontend (porta 4173)..."
if curl -s http://localhost:4173 > /dev/null 2>&1; then
  echo "✅ Frontend está respondendo"
  curl -s http://localhost:4173 | head -3
else
  echo "❌ Frontend NÃO está respondendo!"
  echo "   Tentando iniciar..."
  cd ~/nome_do_repositorio
  pm2 start npm --name versia-web -- run preview -- --host 0.0.0.0 --port 4173 || true
  sleep 3
  curl -s http://localhost:4173 | head -3 || echo "   Ainda não responde"
fi
echo ""

# 4. Verifica processos nas portas
echo "4️⃣ Processos nas portas:"
echo "   Porta 3002:"
lsof -i :3002 2>/dev/null || echo "   ❌ Nenhum processo"
echo "   Porta 4173:"
lsof -i :3002 2>/dev/null || echo "   ❌ Nenhum processo"
echo ""

# 5. Verifica logs do PM2
echo "5️⃣ Últimas linhas dos logs:"
echo "   Backend:"
pm2 logs versia-server --lines 5 --nostream 2>/dev/null || echo "   Sem logs"
echo "   Frontend:"
pm2 logs versia-web --lines 5 --nostream 2>/dev/null || echo "   Sem logs"
echo ""

echo "✅ Diagnóstico concluído!"
echo ""
echo "Se ainda não funcionar, execute:"
echo "  cd ~/nome_do_repositorio"
echo "  ./stop-all.sh"
echo "  ./deploy.sh"

