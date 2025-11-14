# 📨 API de Mensagens - VERSIA

## Base URL
```
https://chatinho.versatecnologia.com.br
```

## Endpoints

### 1. Enviar Mensagem de Texto

**POST** `/api/message`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "message": "Texto da mensagem",
  "role": "assistant",
  "id": "session-id-do-usuario",
  "delay": 0
}
```

**Parâmetros:**
- `message` (obrigatório): Texto da mensagem a ser enviada
- `role` (opcional): Papel da mensagem (`assistant` ou `user`). Padrão: `assistant`
- `id` (opcional): Session ID do usuário. Se não informado, envia para todos os clientes conectados
- `delay` (opcional): Delay em segundos antes de enviar a mensagem. Padrão: 0

**Exemplo:**
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Como posso ajudar?",
    "role": "assistant",
    "id": "abc123-def456-ghi789",
    "delay": 0
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada para clientes conectados",
  "clientsCount": 1,
  "data": {
    "type": "message",
    "role": "assistant",
    "content": "Olá! Como posso ajudar?",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "id": "abc123-def456-ghi789"
  },
  "delay": 0,
  "id": "abc123-def456-ghi789"
}
```

---

### 2. Enviar Imagem

**POST** `/api/image`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "imageUrl": "https://exemplo.com/imagem.jpg",
  "imageAlt": "Descrição da imagem",
  "caption": "Legenda da imagem",
  "content": "Texto adicional (opcional)",
  "role": "assistant",
  "id": "session-id-do-usuario",
  "delay": 0
}
```

**Parâmetros:**
- `imageUrl` (obrigatório): URL da imagem
- `imageAlt` (opcional): Texto alternativo da imagem
- `caption` (opcional): Legenda da imagem
- `content` (opcional): Conteúdo adicional de texto
- `role` (opcional): Papel da mensagem. Padrão: `assistant`
- `id` (opcional): Session ID do usuário
- `delay` (opcional): Delay em segundos. Padrão: 0

**Exemplo:**
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/400x300",
    "imageAlt": "Imagem de exemplo",
    "caption": "Esta é uma imagem de teste",
    "role": "assistant",
    "id": "abc123-def456-ghi789",
    "delay": 1
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Imagem enviada para clientes conectados",
  "clientsCount": 1,
  "data": {
    "type": "image",
    "role": "assistant",
    "imageUrl": "https://via.placeholder.com/400x300",
    "imageAlt": "Imagem de exemplo",
    "content": "Esta é uma imagem de teste",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "id": "abc123-def456-ghi789"
  },
  "delay": 0,
  "id": "abc123-def456-ghi789"
}
```

---

### 3. Health Check

**GET** `/api/health`

Verifica se a API está funcionando.

**Exemplo:**
```bash
curl https://chatinho.versatecnologia.com.br/api/health
```

**Resposta:**
```json
{
  "status": "ok",
  "clientsConnected": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Exemplos Práticos

### 1. Enviar mensagem simples
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Bem-vindo ao chat!",
    "role": "assistant",
    "id": "SESSION_ID_AQUI"
  }'
```

### 2. Enviar mensagem com delay (simula digitação)
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Esta mensagem aparecerá em 3 segundos...",
    "role": "assistant",
    "id": "SESSION_ID_AQUI",
    "delay": 3
  }'
```

### 3. Enviar múltiplas mensagens em sequência
```bash
# Mensagem 1
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Primeira mensagem",
    "role": "assistant",
    "id": "SESSION_ID_AQUI",
    "delay": 0
  }'

# Mensagem 2 (com delay)
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Segunda mensagem",
    "role": "assistant",
    "id": "SESSION_ID_AQUI",
    "delay": 2
  }'
```

### 4. Enviar imagem com legenda
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://exemplo.com/imagem.jpg",
    "imageAlt": "Descrição",
    "caption": "Legenda da imagem",
    "role": "assistant",
    "id": "SESSION_ID_AQUI",
    "delay": 1
  }'
```

---

## Como Obter o Session ID

O Session ID é gerado automaticamente pelo frontend e salvo no `localStorage` do navegador.

**No navegador (Console):**
```javascript
localStorage.getItem('versia-session-id')
```

**Ou via JavaScript no console:**
```javascript
// Abre o chat e executa no console:
console.log('Session ID:', localStorage.getItem('versia-session-id'))
```

---

## Notas Importantes

1. **Session ID**: Se não informar o `id`, a mensagem será enviada para TODOS os clientes conectados (broadcast)

2. **Delay**: O delay é em segundos. Máximo permitido: 60 segundos

3. **Role**: Mensagens com `role: "user"` são ignoradas pela API (para evitar loops)

4. **Ordem**: Mensagens são processadas em fila, garantindo ordem sequencial mesmo com delays

5. **Conexão SSE**: O cliente precisa estar conectado via SSE (`/api/events`) para receber as mensagens

---

## Códigos de Status HTTP

- `200 OK`: Mensagem enviada com sucesso
- `400 Bad Request`: Parâmetros inválidos (ex: mensagem vazia)
- `500 Internal Server Error`: Erro interno do servidor

---

## Teste Rápido

```bash
# 1. Verifica se API está funcionando
curl https://chatinho.versatecnologia.com.br/api/health

# 2. Envia mensagem de teste (substitua SESSION_ID)
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste de API!",
    "role": "assistant",
    "id": "SESSION_ID",
    "delay": 0
  }'
```

