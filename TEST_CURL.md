# Guia de Testes com cURL - API VERSIA

## Configuração Base

```bash
# Defina a URL base da API (ajuste conforme seu ambiente)
API_URL="http://localhost:3002"  # Local
# API_URL="https://chatinho.versatecnologia.com.br"  # Produção
```

---

## 1. Health Check (Verificar se o servidor está rodando)

```bash
# Teste básico
curl http://localhost:3002/api/health

# Com formatação JSON
curl -s http://localhost:3002/api/health | jq

# Com headers detalhados
curl -v http://localhost:3002/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "clientsConnected": 0,
  "timestamp": "2025-01-13T10:30:00.000Z"
}
```

---

## 2. Informações do Servidor (Root)

```bash
curl http://localhost:3002/

# Com formatação
curl -s http://localhost:3002/ | jq
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "VERSIA API",
  "endpoints": {
    "health": "/api/health",
    "message": "/api/message (POST)",
    "image": "/api/image (POST)",
    "events": "/api/events (SSE)",
    "prompt": "/api/prompt (GET, POST)"
  },
  "clientsConnected": 0
}
```

---

## 3. Enviar Mensagem de Texto

### Mensagem simples (sem delay, sem sessionId - broadcast)

```bash
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Esta é uma mensagem de teste",
    "role": "assistant"
  }'
```

### Mensagem com delay (aparece "Digitando..." antes)

```bash
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Esta mensagem tem delay de 3 segundos",
    "role": "assistant",
    "delay": 3
  }'
```

### Mensagem para uma sessão específica

```bash
# Substitua SESSION_ID pelo ID real da sessão
SESSION_ID="abc123-def456-ghi789"

curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Mensagem para sessão específica\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 2
  }"
```

### Mensagem completa (todos os parâmetros)

```bash
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mensagem completa de teste",
    "role": "assistant",
    "id": "sessao-teste-123",
    "delay": 1.5
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Mensagem agendada e será enviada em breve",
  "clientsCount": 0,
  "data": {
    "type": "message",
    "role": "assistant",
    "content": "Mensagem completa de teste",
    "timestamp": "2025-01-13T10:30:00.000Z",
    "id": "sessao-teste-123"
  },
  "delay": 1.5,
  "id": "sessao-teste-123"
}
```

---

## 4. Enviar Imagem

### Imagem simples

```bash
curl -X POST http://localhost:3002/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/300",
    "imageAlt": "Imagem de teste",
    "role": "assistant"
  }'
```

### Imagem com delay e sessionId

```bash
curl -X POST http://localhost:3002/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/600",
    "imageAlt": "Imagem grande",
    "caption": "Legenda da imagem",
    "role": "assistant",
    "id": "sessao-teste-123",
    "delay": 2
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Imagem agendada e será enviada em breve",
  "clientsCount": 0,
  "data": {
    "type": "image",
    "role": "assistant",
    "imageUrl": "https://via.placeholder.com/600",
    "imageAlt": "Imagem grande",
    "content": "Legenda da imagem",
    "timestamp": "2025-01-13T10:30:00.000Z",
    "id": "sessao-teste-123"
  },
  "delay": 2,
  "id": "sessao-teste-123"
}
```

---

## 5. Server-Sent Events (SSE)

### Conectar ao SSE (sem sessionId - usa "default")

```bash
curl -N http://localhost:3002/api/events
```

### Conectar ao SSE com sessionId específico

```bash
SESSION_ID="sessao-teste-123"
curl -N "http://localhost:3002/api/events?id=$SESSION_ID"
```

### Conectar ao SSE e salvar eventos em arquivo

```bash
SESSION_ID="sessao-teste-123"
curl -N "http://localhost:3002/api/events?id=$SESSION_ID" > sse_events.log
```

**Nota:** O SSE mantém a conexão aberta e recebe eventos em tempo real. Para testar, deixe o comando rodando e envie mensagens usando outro terminal.

---

## 6. Gerenciar Prompt

### Obter prompt atual

```bash
curl http://localhost:3002/api/prompt

# Com formatação
curl -s http://localhost:3002/api/prompt | jq
```

**Resposta esperada:**
```json
{
  "success": true,
  "prompt": ""
}
```

### Salvar prompt

```bash
curl -X POST http://localhost:3002/api/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Você é um assistente especializado em e-SUS APS. Sempre seja prestativo e objetivo."
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Prompt salvo com sucesso",
  "prompt": "Você é um assistente especializado em e-SUS APS. Sempre seja prestativo e objetivo."
}
```

---

## 7. Testes de Integração Completa

### Teste 1: Enviar mensagem e verificar no SSE

**Terminal 1 - Conecta ao SSE:**
```bash
SESSION_ID="teste-integracao-$(date +%s)"
curl -N "http://localhost:3002/api/events?id=$SESSION_ID"
```

**Terminal 2 - Envia mensagem:**
```bash
SESSION_ID="teste-integracao-$(date +%s)"
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Teste de integração\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }"
```

### Teste 2: Sequência de mensagens com delays

```bash
SESSION_ID="sequencia-teste-$(date +%s)"

# Mensagem 1 (delay 2s)
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Primeira mensagem\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 2
  }"

# Mensagem 2 (delay 1s) - será enfileirada
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Segunda mensagem\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }"

# Mensagem 3 (sem delay) - será enfileirada
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Terceira mensagem\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\"
  }"
```

---

## 8. Testes de Erro

### Mensagem sem campo obrigatório

```bash
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant"
  }'
```

**Resposta esperada (400):**
```json
{
  "error": "Mensagem é obrigatória"
}
```

### Imagem sem URL

```bash
curl -X POST http://localhost:3002/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "role": "assistant"
  }'
```

**Resposta esperada (400):**
```json
{
  "error": "imageUrl é obrigatória"
}
```

---

## 9. Script de Teste Automatizado

Crie um arquivo `test-api.sh`:

```bash
#!/bin/bash

API_URL="${API_URL:-http://localhost:3002}"
SESSION_ID="test-$(date +%s)"

echo "🧪 Testando API VERSIA em $API_URL"
echo "📋 SessionId: $SESSION_ID"
echo ""

# 1. Health Check
echo "1️⃣ Health Check..."
curl -s "$API_URL/api/health" | jq
echo ""

# 2. Informações do servidor
echo "2️⃣ Informações do servidor..."
curl -s "$API_URL/" | jq
echo ""

# 3. Enviar mensagem
echo "3️⃣ Enviando mensagem..."
curl -s -X POST "$API_URL/api/message" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Mensagem de teste automatizado\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }" | jq
echo ""

# 4. Enviar imagem
echo "4️⃣ Enviando imagem..."
curl -s -X POST "$API_URL/api/image" \
  -H "Content-Type: application/json" \
  -d "{
    \"imageUrl\": \"https://via.placeholder.com/300\",
    \"imageAlt\": \"Teste automatizado\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }" | jq
echo ""

# 5. Salvar prompt
echo "5️⃣ Salvando prompt..."
curl -s -X POST "$API_URL/api/prompt" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Prompt de teste automatizado"
  }' | jq
echo ""

# 6. Obter prompt
echo "6️⃣ Obtendo prompt..."
curl -s "$API_URL/api/prompt" | jq
echo ""

echo "✅ Testes concluídos!"
```

**Uso:**
```bash
chmod +x test-api.sh
./test-api.sh

# Ou com URL customizada
API_URL="https://chatinho.versatecnologia.com.br" ./test-api.sh
```

---

## 10. Dicas e Truques

### Ver resposta completa (headers + body)

```bash
curl -v http://localhost:3002/api/health
```

### Salvar resposta em arquivo

```bash
curl -s http://localhost:3002/api/health > response.json
```

### Testar com timeout

```bash
curl --max-time 5 http://localhost:3002/api/health
```

### Testar com autenticação (se implementado)

```bash
curl -H "Authorization: Bearer TOKEN" http://localhost:3002/api/health
```

### Testar CORS (de outro domínio)

```bash
curl -H "Origin: https://outro-dominio.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://localhost:3002/api/message
```

---

## 11. Verificar Logs do Servidor

Enquanto testa, monitore os logs do PM2:

```bash
# Ver logs em tempo real
pm2 logs versia-server

# Ver últimas 50 linhas
pm2 logs versia-server --lines 50

# Ver apenas erros
pm2 logs versia-server --err
```

---

## Problemas Comuns

### Erro: Connection refused
- Verifique se o servidor está rodando: `pm2 status`
- Verifique a porta: `netstat -tuln | grep 3002`

### Erro: 404 Not Found
- Verifique se a URL está correta
- Verifique se o endpoint existe no servidor

### SSE não recebe eventos
- Verifique se há clientes conectados: `curl http://localhost:3002/api/health`
- Verifique os logs do servidor: `pm2 logs versia-server`

