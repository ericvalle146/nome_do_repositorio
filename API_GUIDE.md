# 📚 Guia de Uso da API VERSIA

## 🌐 URLs da API

Com Docker rodando na VPS:
- **Backend API**: `http://192.168.252.50:3001` (interno) ou `http://seu-dominio:3001`
- **Frontend**: `http://192.168.252.50:4173` (interno) ou `http://seu-dominio:4173`

Se estiver usando ngrok:
- **Backend API**: `https://sua-url-ngrok.ngrok-free.app`

---

## 📨 1. Enviar Mensagem de Texto

### Endpoint
```
POST /api/message
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `message` | string | ✅ Sim | Texto da mensagem |
| `id` | string | ❌ Não | ID da sessão do usuário (para enviar para um usuário específico) |
| `delay` | number | ❌ Não | Delay em segundos antes de enviar (máximo 60s) |
| `role` | string | ❌ Não | Role da mensagem (padrão: `assistant`) |

### Exemplo com cURL

```bash
# Enviar mensagem para TODOS os usuários conectados
curl -X POST http://192.168.252.50:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Como posso ajudar?",
    "role": "assistant"
  }'

# Enviar mensagem para um usuário ESPECÍFICO (pelo ID da sessão)
curl -X POST http://192.168.252.50:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Esta mensagem é só para você!",
    "id": "abc123-session-id-aqui",
    "delay": 2
  }'
```

### Exemplo com JavaScript/Node.js

```javascript
// Enviar mensagem simples
async function enviarMensagem(mensagem, sessionId = null, delay = 0) {
  const response = await fetch('http://192.168.252.50:3001/api/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: mensagem,
      id: sessionId, // null = broadcast para todos
      delay: delay, // segundos
      role: 'assistant'
    })
  })
  
  const data = await response.json()
  console.log('Resposta:', data)
  return data
}

// Exemplo de uso
enviarMensagem('Olá! Como posso ajudar?')
enviarMensagem('Esta é só para você!', 'abc123-session-id', 3)
```

### Exemplo com Python

```python
import requests

def enviar_mensagem(mensagem, session_id=None, delay=0):
    url = 'http://192.168.252.50:3001/api/message'
    payload = {
        'message': mensagem,
        'role': 'assistant'
    }
    
    if session_id:
        payload['id'] = session_id
    
    if delay > 0:
        payload['delay'] = delay
    
    response = requests.post(url, json=payload)
    return response.json()

# Exemplo de uso
enviar_mensagem('Olá! Como posso ajudar?')
enviar_mensagem('Esta é só para você!', session_id='abc123', delay=3)
```

### Resposta da API

```json
{
  "success": true,
  "message": "Mensagem enviada para clientes conectados",
  "data": {
    "type": "message",
    "role": "assistant",
    "content": "Olá! Como posso ajudar?",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "id": "abc123"
  },
  "delay": 0,
  "id": "abc123"
}
```

---

## 🖼️ 2. Enviar Imagem

### Endpoint
```
POST /api/image
```

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `imageUrl` | string | ✅ Sim | URL da imagem |
| `imageAlt` | string | ❌ Não | Texto alternativo da imagem |
| `caption` | string | ❌ Não | Legenda da imagem |
| `content` | string | ❌ Não | Conteúdo/texto adicional |
| `id` | string | ❌ Não | ID da sessão do usuário |
| `delay` | number | ❌ Não | Delay em segundos (máximo 60s) |
| `role` | string | ❌ Não | Role da mensagem (padrão: `assistant`) |

### Exemplo com cURL

```bash
curl -X POST http://192.168.252.50:3001/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://exemplo.com/imagem.png",
    "caption": "Olha só esta imagem!",
    "id": "abc123-session-id",
    "delay": 3
  }'
```

### Exemplo com JavaScript

```javascript
async function enviarImagem(imageUrl, caption, sessionId = null, delay = 0) {
  const response = await fetch('http://192.168.252.50:3001/api/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageUrl: imageUrl,
      caption: caption || '',
      imageAlt: caption || 'Imagem enviada',
      id: sessionId,
      delay: delay,
      role: 'assistant'
    })
  })
  
  return await response.json()
}

// Exemplo de uso
enviarImagem(
  'https://exemplo.com/imagem.png',
  'Olha só esta imagem!',
  'abc123-session-id',
  3
)
```

---

## 🔍 3. Verificar Saúde da API

### Endpoint
```
GET /api/health
```

### Exemplo

```bash
curl http://192.168.252.50:3001/api/health
```

### Resposta

```json
{
  "status": "ok",
  "clientsConnected": 3,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📝 4. Gerenciar Prompt

### Obter Prompt
```
GET /api/prompt
```

```bash
curl http://192.168.252.50:3001/api/prompt
```

### Salvar Prompt
```
POST /api/prompt
```

```bash
curl -X POST http://192.168.252.50:3001/api/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Você é um assistente virtual especializado em saúde..."
  }'
```

---

## 🎯 5. Como Obter o Session ID do Usuário

O `sessionId` é gerado automaticamente pelo frontend e armazenado no `localStorage` com a chave `versia-session-id`.

### No Frontend (JavaScript do navegador)

```javascript
// Obter session ID atual
const sessionId = localStorage.getItem('versia-session-id')
console.log('Session ID:', sessionId)
```

### Como o Session ID chega no n8n

Quando o usuário envia uma mensagem no chat, o frontend envia para o webhook do n8n:

```json
{
  "message": "Olá, preciso de ajuda",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "id": "abc123-session-id-aqui",
  "source": "user",
  "messageType": "text"
}
```

No n8n, você pode usar `{{ $json.id }}` para pegar o `sessionId` e enviar a resposta de volta:

```javascript
// No n8n, use o ID recebido para enviar resposta
const sessionId = $json.id // vem do webhook
const resposta = "Aqui está a resposta!"

// Enviar resposta via API
await $http.request({
  method: 'POST',
  url: 'http://192.168.252.50:3001/api/message',
  body: {
    message: resposta,
    id: sessionId,
    delay: 2
  }
})
```

---

## 🔄 6. Fluxo Completo com n8n

### 1. Usuário envia mensagem no chat
→ Frontend envia para webhook do n8n com `sessionId`

### 2. n8n processa a mensagem
→ Pega o `sessionId` de `{{ $json.id }}`
→ Processa e gera resposta

### 3. n8n envia resposta via API
```javascript
// Nó HTTP Request no n8n
POST http://192.168.252.50:3001/api/message
Body: {
  "message": "{{ resposta }}",
  "id": "{{ $json.id }}",
  "delay": 2
}
```

### 4. Mensagem aparece no chat do usuário
→ API envia via SSE para o frontend do usuário específico

---

## ⚠️ 7. Importantes

### Delay
- **Opcional**: Se não informar, mensagem é enviada imediatamente
- **Máximo**: 60 segundos
- **Uso**: Mostra "Digitando..." antes de enviar a mensagem

### Session ID
- **Sem ID**: Mensagem é enviada para TODOS os usuários conectados (broadcast)
- **Com ID**: Mensagem é enviada apenas para aquele usuário específico

### Role
- **Padrão**: `assistant` (mensagens da assistente)
- **Não use**: `user` (o sistema ignora mensagens com `role: 'user'` para evitar loops)

### URLs

⚠️ **IMPORTANTE**: Se o n8n estiver em outro container Docker, você DEVE usar o IP da VPS, não o nome do container!

- **Local**: `http://localhost:3001`
- **VPS (Recomendado para n8n)**: `http://192.168.252.50:3001` (IP interno da VPS)
- **Ngrok**: `https://sua-url-ngrok.ngrok-free.app`
- **Docker (mesma rede)**: `http://versia-backend:3001` - APENAS se ambos containers estiverem na mesma rede Docker

---

## 🧪 8. Testando a API

### Teste rápido com cURL

```bash
# 1. Verificar se API está rodando
curl http://192.168.252.50:3001/api/health

# 2. Enviar mensagem de teste (broadcast - todos os usuários)
curl -X POST http://192.168.252.50:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste de mensagem!"}'

# 3. Enviar mensagem com delay
curl -X POST http://192.168.252.50:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Esta mensagem tem 3 segundos de delay!",
    "delay": 3
  }'

# 4. Enviar imagem
curl -X POST http://192.168.252.50:3001/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/300",
    "caption": "Imagem de teste"
  }'
```

---

## 📞 9. Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/health` | Verificar saúde da API |
| `GET` | `/api/events?id={sessionId}` | SSE - Conexão em tempo real (usado pelo frontend) |
| `POST` | `/api/message` | Enviar mensagem de texto |
| `POST` | `/api/image` | Enviar imagem |
| `GET` | `/api/prompt` | Obter prompt salvo |
| `POST` | `/api/prompt` | Salvar prompt |

---

## 🐛 10. Troubleshooting

### Mensagem não aparece no chat?
1. Verifique se o usuário está com o chat aberto
2. Verifique se o `sessionId` está correto
3. Verifique os logs do container: `docker logs versia-backend`
4. Teste o healthcheck: `curl http://192.168.252.50:3001/api/health`

### Erro de conexão?
1. Verifique se o container está rodando: `docker ps`
2. Verifique se a porta está aberta: `netstat -tuln | grep 3001`
3. Verifique os logs: `docker logs versia-backend`

### Delay não funciona?
- Verifique se o valor está entre 0 e 60 segundos
- Verifique os logs do container

