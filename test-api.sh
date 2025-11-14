#!/bin/bash

# Script para testar a API do VERSIA

API_URL="${VITE_API_URL:-https://chatinho.versatecnologia.com.br}"
SESSION_ID="${1:-test-session-$(date +%s)}"

echo "🧪 TESTANDO API VERSIA"
echo "====================="
echo ""
echo "API URL: $API_URL"
echo "Session ID: $SESSION_ID"
echo ""

# 1. Health Check
echo "1️⃣ Testando Health Check..."
curl -s "$API_URL/api/health" | jq '.' || curl -s "$API_URL/api/health"
echo ""
echo ""

# 2. Enviar mensagem de texto
echo "2️⃣ Enviando mensagem de texto..."
RESPONSE=$(curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Olá! Esta é uma mensagem de teste.\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 0
  }")

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""
echo ""

# 3. Enviar mensagem com delay
echo "3️⃣ Enviando mensagem com delay de 2 segundos..."
RESPONSE=$(curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Esta mensagem tem delay de 2 segundos.\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 2
  }")

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""
echo ""

# 4. Enviar imagem
echo "4️⃣ Enviando imagem..."
RESPONSE=$(curl -s -X POST "$API_URL/api/image" \
  -H "Content-Type: application/json" \
  -d "{
    \"imageUrl\": \"https://via.placeholder.com/400x300?text=Imagem+de+Teste\",
    \"imageAlt\": \"Imagem de teste\",
    \"caption\": \"Esta é uma imagem de teste\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }")

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""
echo ""

# 5. Obter prompt
echo "5️⃣ Obtendo prompt salvo..."
curl -s "$API_URL/api/prompt" | jq '.' || curl -s "$API_URL/api/prompt"
echo ""
echo ""

# 6. Salvar prompt
echo "6️⃣ Salvando prompt..."
RESPONSE=$(curl -s -X POST "$API_URL/api/prompt" \
  -H "Content-Type: application/json" \
  -d "{
    \"prompt\": \"Você é um assistente útil e amigável.\"
  }")

echo "$RESPONSE" | jq '.' || echo "$RESPONSE"
echo ""
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "💡 Para testar com um session ID específico:"
echo "   ./test-api.sh seu-session-id-aqui"
echo ""
echo "💡 Para testar localmente:"
echo "   VITE_API_URL=http://localhost:3002 ./test-api.sh"

