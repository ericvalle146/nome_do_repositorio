#!/bin/bash

# Script para conectar containers versia à rede do n8n
# Execute na VPS

echo "🔍 Verificando redes Docker..."
docker network ls

echo ""
echo "📋 Verificando em qual rede o n8n está..."
docker inspect n8n_editor 2>/dev/null | grep -A 10 "Networks" || echo "Container n8n_editor não encontrado"
docker inspect n8n_webhooks 2>/dev/null | grep -A 10 "Networks" || echo "Container n8n_webhooks não encontrado"

echo ""
read -p "Digite o nome da rede do n8n (ex: n8n_default): " N8N_NETWORK

if [ -z "$N8N_NETWORK" ]; then
    echo "❌ Nome da rede não informado"
    exit 1
fi

echo ""
echo "🔗 Conectando containers versia à rede $N8N_NETWORK..."

# Conecta o backend
docker network connect $N8N_NETWORK versia-backend 2>/dev/null && echo "✅ versia-backend conectado à rede $N8N_NETWORK" || echo "⚠️ Erro ao conectar versia-backend (pode já estar conectado)"

# Conecta o frontend (opcional)
docker network connect $N8N_NETWORK versia-frontend 2>/dev/null && echo "✅ versia-frontend conectado à rede $N8N_NETWORK" || echo "⚠️ Erro ao conectar versia-frontend (pode já estar conectado)"

echo ""
echo "✅ Concluído! Agora você pode usar http://versia-backend:3001 no n8n"

