#!/bin/bash

echo "🔍 Procurando redes Docker com 'n8n' no nome..."
docker network ls | grep n8n

echo ""
echo "📋 Detalhes das redes encontradas:"
docker network ls --format "{{.Name}}" | grep n8n | while read network; do
  echo ""
  echo "--- Rede: $network ---"
  docker network inspect $network --format '  Containers: {{range .Containers}}{{.Name}} {{end}}' 2>/dev/null
done

echo ""
echo "🔗 Conectando containers versia à primeira rede n8n encontrada..."
NETWORK=$(docker network ls --format "{{.Name}}" | grep n8n | head -1)

if [ -z "$NETWORK" ]; then
  echo "❌ Nenhuma rede com 'n8n' no nome encontrada!"
  exit 1
fi

echo "Rede selecionada: $NETWORK"
echo ""

docker network connect $NETWORK versia-backend 2>/dev/null && echo "✅ versia-backend conectado à rede $NETWORK" || echo "⚠️ versia-backend já estava conectado ou erro"
docker network connect $NETWORK versia-frontend 2>/dev/null && echo "✅ versia-frontend conectado à rede $NETWORK" || echo "⚠️ versia-frontend já estava conectado ou erro"

echo ""
echo "✅ Concluído! Agora você pode usar http://versia-backend:3001 no n8n"

