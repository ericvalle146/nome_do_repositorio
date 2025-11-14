#!/bin/bash

# Script para PARAR TUDO relacionado ao VERSIA

set -e

echo "🛑 PARANDO TUDO - VERSIA"
echo "========================"
echo ""

# 1. Para processos PM2
echo "1️⃣ Parando processos PM2..."
pm2 stop versia-server 2>/dev/null || true
pm2 stop versia-web 2>/dev/null || true
pm2 delete versia-server 2>/dev/null || true
pm2 delete versia-web 2>/dev/null || true
sleep 2
echo "✅ PM2 limpo"
echo ""

# 2. Mata processos Node.js na porta 4173
echo "2️⃣ Matando processos na porta 4173..."
lsof -ti:4173 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ Porta 4173 liberada"
echo ""

# 3. Mata processos Node.js na porta 3002
echo "3️⃣ Matando processos na porta 3002..."
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
sleep 1
echo "✅ Porta 3002 liberada"
echo ""

# 4. Verifica processos Docker
echo "4️⃣ Verificando containers Docker..."
if command -v docker >/dev/null 2>&1; then
  docker ps | grep -E "versia|4173|3002" || echo "Nenhum container VERSIA rodando"
  echo ""
  echo "Para parar containers Docker (se houver):"
  echo "  docker stop \$(docker ps -q --filter 'name=versia')"
  echo "  docker rm \$(docker ps -aq --filter 'name=versia')"
else
  echo "Docker não instalado"
fi
echo ""

# 5. Verifica processos 'serve' (pode estar servindo arquivos estáticos)
echo "5️⃣ Verificando processos 'serve'..."
ps aux | grep -E "serve.*4173|serve.*dist" | grep -v grep || echo "Nenhum processo 'serve' encontrado"
echo ""

# 6. Status final
echo "6️⃣ Status final das portas:"
netstat -tuln | grep -E ":3001|:3002|:4173|:4001" || echo "Nenhuma porta VERSIA em uso"
echo ""

echo "✅ TUDO PARADO!"
echo ""
echo "Agora você pode rodar: ./deploy.sh"

