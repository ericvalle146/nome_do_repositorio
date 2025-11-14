# 🚀 Comandos cURL Prontos - Backend VERSIA

## 🌐 Domínio: `https://chatinho.versatecnologia.com.br`

---

## 1️⃣ Health Check (Verificar se está rodando)

```bash
curl https://chatinho.versatecnologia.com.br/api/health
```

**Com formatação JSON:**
```bash
curl -s https://chatinho.versatecnologia.com.br/api/health | jq
```

---

## 2️⃣ Informações do Servidor

```bash
curl https://chatinho.versatecnologia.com.br/
```

**Com formatação:**
```bash
curl -s https://chatinho.versatecnologia.com.br/ | jq
```

---

## 3️⃣ Enviar Mensagem de Texto

### Mensagem simples (sem delay, broadcast para todos)

```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Esta é uma mensagem de teste",
    "role": "assistant"
  }'
```

### Mensagem com delay de 3 segundos

```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Esta mensagem tem delay de 3 segundos",
    "role": "assistant",
    "delay": 3
  }'
```

### Mensagem para sessão específica (substitua SESSION_ID)

```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mensagem para uma sessão específica",
    "role": "assistant",
    "id": "SEU_SESSION_ID_AQUI",
    "delay": 2
  }'
```

**Exemplo com sessionId real:**
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste de mensagem",
    "role": "assistant",
    "id": "abc123-def456-ghi789",
    "delay": 1.5
  }'
```

---

## 4️⃣ Enviar Imagem

### Imagem simples

```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/300",
    "imageAlt": "Imagem de teste",
    "role": "assistant"
  }'
```

### Imagem com delay e sessionId

```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/600",
    "imageAlt": "Imagem grande de teste",
    "caption": "Legenda da imagem",
    "role": "assistant",
    "id": "SEU_SESSION_ID_AQUI",
    "delay": 2
  }'
```

---

## 5️⃣ Server-Sent Events (SSE) - Conectar ao chat em tempo real

### Conectar sem sessionId (usa "default")

```bash
curl -N https://chatinho.versatecnologia.com.br/api/events
```

### Conectar com sessionId específico

```bash
curl -N "https://chatinho.versatecnologia.com.br/api/events?id=SEU_SESSION_ID_AQUI"
```

**Exemplo:**
```bash
curl -N "https://chatinho.versatecnologia.com.br/api/events?id=abc123-def456-ghi789"
```

**💡 Dica:** Deixe esse comando rodando em um terminal e envie mensagens em outro terminal para ver os eventos chegando em tempo real!

---

## 6️⃣ Gerenciar Prompt

### Obter prompt atual

```bash
curl https://chatinho.versatecnologia.com.br/api/prompt
```

**Com formatação:**
```bash
curl -s https://chatinho.versatecnologia.com.br/api/prompt | jq
```

### Salvar prompt

```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Você é um assistente especializado em e-SUS APS. Sempre seja prestativo e objetivo."
  }'
```

---

## 🧪 Teste Completo - Sequência de Mensagens

```bash
# Defina um sessionId para o teste
SESSION_ID="test-$(date +%s)"

# Mensagem 1 (delay 2s)
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Primeira mensagem do teste\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 2
  }"

# Mensagem 2 (delay 1s)
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Segunda mensagem do teste\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 1
  }"

# Mensagem 3 (sem delay)
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Terceira mensagem do teste\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\"
  }"
```

---

## 🔍 Verificar Resposta Completa (com headers)

```bash
curl -v https://chatinho.versatecnologia.com.br/api/health
```

---

## 📝 Exemplos Prontos para Copiar e Colar

### Teste Rápido - Health Check
```bash
curl https://chatinho.versatecnologia.com.br/api/health
```

### Teste Rápido - Enviar Mensagem
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste rápido", "role": "assistant"}'
```

### Teste Rápido - Enviar Imagem
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/image \
  -H "Content-Type: application/json" \
  -d '{"imageUrl": "https://via.placeholder.com/300", "imageAlt": "Teste", "role": "assistant"}'
```

---

## 🐛 Troubleshooting

### Se der erro de SSL/certificado:
```bash
curl -k https://chatinho.versatecnologia.com.br/api/health
```

### Se der timeout:
```bash
curl --max-time 10 https://chatinho.versatecnologia.com.br/api/health
```

### Ver resposta completa (headers + body):
```bash
curl -i https://chatinho.versatecnologia.com.br/api/health
```

---

## 📊 Monitorar Logs Enquanto Testa

Em outro terminal, rode:
```bash
pm2 logs versia-server --lines 50
```

