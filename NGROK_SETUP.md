# Configuração do Ngrok

## Problema

O erro 500 ocorre porque o ngrok está apontando para o **frontend (Vite)**, mas o endpoint `/api/message` está no **backend (Express na porta 3001)**.

## Solução

Você precisa configurar o ngrok para apontar para o **servidor Express** (porta 3001), não para o Vite.

### Opção 1: Ngrok apontando para o Backend (Recomendado)

```bash
# Inicie o servidor backend primeiro
npm run dev:server

# Em outro terminal, configure o ngrok para a porta 3001
ngrok http 3001
```

Isso criará uma URL como: `https://xxxxx.ngrok-free.app` que aponta diretamente para o servidor Express.

**No n8n, use esta URL:**
```
https://xxxxx.ngrok-free.app/api/message
```

Para enviar imagens, utilize:
```
https://xxxxx.ngrok-free.app/api/image
```

### Opção 2: Dois túneis ngrok (Frontend + Backend)

Se você precisar acessar tanto o frontend quanto o backend:

**Terminal 1 - Backend:**
```bash
npm run dev:server
ngrok http 3001
# Anote a URL: https://backend-xxxxx.ngrok-free.app
```

**Terminal 2 - Frontend:**
```bash
npm run dev
ngrok http 5173
# Anote a URL: https://frontend-xxxxx.ngrok-free.app
```

**No n8n, use a URL do backend:**
```
https://backend-xxxxx.ngrok-free.app/api/message
```

### Opção 3: Ngrok com múltiplos serviços (ngrok.yml)

Crie um arquivo `ngrok.yml` na raiz do projeto:

```yaml
version: "2"
authtoken: SEU_TOKEN_AQUI
tunnels:
  backend:
    addr: 3001
    proto: http
  frontend:
    addr: 5173
    proto: http
```

Execute:
```bash
ngrok start --all
```

## Verificação

Após configurar o ngrok, teste o endpoint:

```bash
curl -X POST https://SEU_NGROK_URL.ngrok-free.app/api/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Teste"}'
```

Deve retornar:
```json
{
  "success": true,
  "message": "Mensagem enviada para clientes conectados",
  "clientsCount": 0
}
```

## Importante

- O servidor backend (Express) deve estar rodando na porta 3001
- O ngrok deve apontar para a porta 3001 (não 5173 que é o Vite)
- Certifique-se de que o servidor está acessível externamente (já configurado para escutar em 0.0.0.0)


