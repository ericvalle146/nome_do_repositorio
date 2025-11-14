#!/bin/bash

# ============================================
# Script de Teste - API VERSIA Backend
# Domínio: chatinho.versatecnologia.com.br
# ============================================

API_URL="https://chatinho.versatecnologia.com.br"
SESSION_ID="test-$(date +%s)"

echo "🧪 Testando Backend VERSIA"
echo "🌐 URL: $API_URL"
echo "📋 SessionId: $SESSION_ID"
echo ""

# 1. Health Check
echo "1️⃣ Health Check..."
echo "curl $API_URL/api/health"
curl -s "$API_URL/api/health" | jq || curl -s "$API_URL/api/health"
echo ""
echo ""

# 2. Informações do servidor
echo "2️⃣ Informações do servidor..."
echo "curl $API_URL/"
curl -s "$API_URL/" | jq || curl -s "$API_URL/"
echo ""
echo ""

# 3. Enviar mensagem simples
echo "3️⃣ Enviando mensagem simples..."
echo "curl -X POST $API_URL/api/message -H 'Content-Type: application/json' -d '{...}'"
curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Olá! Esta é uma mensagem de teste do curl\",
    \"role\": \"assistant\"
  }" | jq || curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Olá! Esta é uma mensagem de teste do curl\",
    \"role\": \"assistant\"
  }"
echo ""
echo ""

# 4. Enviar mensagem com delay e sessionId
echo "4️⃣ Enviando mensagem com delay (2s) e sessionId..."
echo "curl -X POST $API_URL/api/message -H 'Content-Type: application/json' -d '{...}'"
curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Mensagem com delay de 2 segundos\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 2
  }" | jq || curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Mensagem com delay de 2 segundos\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 2
  }"
echo ""
echo ""

# 5. Enviar imagem
echo "5️⃣ Enviando imagem..."
echo "curl -X POST $API_URL/api/image -H 'Content-Type: application/json' -d '{...}'"
curl -s -X POST "$API_URL/api/image" \
  -H "Content-Type: application/json" \
  -d "{
    \"imageUrl\": \"https://via.placeholder.com/300\",
    \"imageAlt\": \"Imagem de teste\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }" | jq || curl -s -X POST "$API_URL/api/image" \
  -H "Content-Type: application/json" \
  -d "{
    \"imageUrl\": \"https://via.placeholder.com/300\",
    \"imageAlt\": \"Imagem de teste\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }"
echo ""
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "💡 Para testar SSE (Server-Sent Events), use:"
echo "   curl -N \"$API_URL/api/events?id=$SESSION_ID\""
echo ""
echo "💡 Para ver logs do servidor:"
echo "   pm2 logs versia-server"

