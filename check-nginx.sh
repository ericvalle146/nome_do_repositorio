#!/bin/bash

echo "🔍 VERIFICANDO CONFIGURAÇÃO NGINX E SERVIÇOS"
echo "============================================="
echo ""

echo "1️⃣ Status dos processos PM2:"
pm2 status
echo ""

echo "2️⃣ Processos rodando nas portas:"
echo "   Porta 3002 (backend):"
lsof -i :3002 2>/dev/null || echo "   ❌ Nenhum processo na porta 3002"
echo ""
echo "   Porta 4173 (frontend):"
lsof -i :4173 2>/dev/null || echo "   ❌ Nenhum processo na porta 4173"
echo ""

echo "3️⃣ Testando backend localmente:"
curl -s http://localhost:3002/api/health | head -3 || echo "   ❌ Backend não responde"
echo ""

echo "4️⃣ Testando frontend localmente:"
curl -s http://localhost:4173 | head -5 || echo "   ❌ Frontend não responde"
echo ""

echo "5️⃣ Verificando configuração Nginx:"
if [ -f /etc/nginx/sites-available/default ]; then
  echo "   Arquivo: /etc/nginx/sites-available/default"
  grep -A 10 "conversa.versatecnologia.com.br\|chatinho.versatecnologia.com.br" /etc/nginx/sites-available/default 2>/dev/null || echo "   Nenhuma configuração encontrada para esses domínios"
fi

if [ -f /etc/nginx/sites-enabled/default ]; then
  echo "   Arquivo: /etc/nginx/sites-enabled/default"
  grep -A 10 "conversa.versatecnologia.com.br\|chatinho.versatecnologia.com.br" /etc/nginx/sites-enabled/default 2>/dev/null || echo "   Nenhuma configuração encontrada"
fi

# Verifica todos os arquivos de configuração do Nginx
echo ""
echo "6️⃣ Procurando configurações do Nginx:"
find /etc/nginx -name "*.conf" -o -name "*versa*" -o -name "*chat*" 2>/dev/null | head -10
echo ""

echo "7️⃣ Status do Nginx:"
systemctl status nginx --no-pager | head -10 || echo "Nginx não está rodando"
echo ""

echo "8️⃣ Testando sintaxe do Nginx:"
nginx -t 2>&1 || echo "Erro na configuração do Nginx"
echo ""

echo "✅ Verificação concluída!"

