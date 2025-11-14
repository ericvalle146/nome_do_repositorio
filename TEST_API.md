# 🧪 Como Testar a API VERSIA

## Método 1: Script Automatizado (Recomendado)

```bash
cd ~/nome_do_repositorio
git pull origin main
./test-api.sh
```

Para testar com um session ID específico:
```bash
./test-api.sh seu-session-id-aqui
```

## Método 2: Comandos cURL Manuais

### 1. Health Check
```bash
curl https://chatinho.versatecnologia.com.br/api/health
```

### 2. Enviar Mensagem de Texto
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Esta é uma mensagem de teste.",
    "role": "assistant",
    "id": "seu-session-id-aqui",
    "delay": 0
  }'
```

### 3. Enviar Mensagem com Delay
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Esta mensagem tem delay de 2 segundos.",
    "role": "assistant",
    "id": "seu-session-id-aqui",
    "delay": 2
  }'
```

### 4. Enviar Imagem
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/image \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://via.placeholder.com/400x300?text=Imagem+de+Teste",
    "imageAlt": "Imagem de teste",
    "caption": "Esta é uma imagem de teste",
    "role": "assistant",
    "id": "seu-session-id-aqui",
    "delay": 1
  }'
```

### 5. Obter Prompt Salvo
```bash
curl https://chatinho.versatecnologia.com.br/api/prompt
```

### 6. Salvar Prompt
```bash
curl -X POST https://chatinho.versatecnologia.com.br/api/prompt \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Você é um assistente útil e amigável."
  }'
```

## Testando Localmente

Se quiser testar no servidor localmente (sem passar pelo Nginx):

```bash
# Testa backend diretamente
curl http://localhost:3002/api/health

# Envia mensagem localmente
curl -X POST http://localhost:3002/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste local",
    "role": "assistant",
    "id": "test-local",
    "delay": 0
  }'
```

## Como Obter o Session ID

O session ID é gerado automaticamente pelo frontend e salvo no `localStorage` do navegador. Para testar:

1. Abra o chat no navegador
2. Abra o Console do Desenvolvedor (F12)
3. Execute: `localStorage.getItem('versia-session-id')`
4. Use esse ID nos comandos curl acima

## Exemplo Completo de Teste

```bash
# 1. Gera um session ID de teste
SESSION_ID="test-$(date +%s)"

# 2. Envia mensagem
curl -X POST https://chatinho.versatecnologia.com.br/api/message \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Olá! Esta é uma mensagem de teste.\",
    \"role\": \"assistant\",
    \"id\": \"$SESSION_ID\",
    \"delay\": 0
  }"

# 3. Verifica se a mensagem foi enviada (deve aparecer no chat se estiver conectado)
```

## Troubleshooting

Se não receber as mensagens no chat:

1. Verifique se o chat está aberto e conectado (SSE)
2. Verifique se está usando o mesmo `session-id` do chat
3. Verifique os logs do PM2: `pm2 logs versia-server`
4. Verifique se o backend está rodando: `pm2 status`

