# VERSIA - Assistente e-SUS APS

Uma aplicação de chat minimalista construída para fornecer suporte técnico sobre o sistema e-SUS APS.

## 🚀 Tecnologias

- **React 18.3.1** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI base
- **Lucide React** - Ícones
- **React Router DOM** - Roteamento

## 📦 Instalação

```bash
npm install
```

## 🏃 Executar em Desenvolvimento

```bash
npm run dev
```

## 🏗️ Build para Produção

```bash
npm run build
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes shadcn/ui base
│   ├── ChatHeader.tsx  # Cabeçalho do chat
│   ├── ChatInput.tsx   # Input de mensagens
│   ├── ChatMessage.tsx # Bolhas de mensagem
│   └── EmptyState.tsx  # Estado inicial
├── pages/              # Páginas da aplicação
│   ├── Index.tsx       # Página principal
│   └── NotFound.tsx    # Página 404
├── lib/                # Utilitários
├── index.css           # Estilos globais e design system
├── main.tsx           # Entry point
└── App.tsx            # Componente raiz
```

## 🎨 Design System

O projeto usa tokens semânticos no formato HSL definidos em `src/index.css`. Nunca use cores diretas como `text-white` ou `bg-black`. Use sempre os tokens semânticos:

- `bg-background` ao invés de `bg-white`
- `text-foreground` ao invés de `text-black`
- `border-border` ao invés de `border-gray-300`

## 🔌 Configuração

### Variáveis de Ambiente

1. **Copie o arquivo de exemplo:**
   ```bash
   cp env.example .env
   ```

2. **Edite o arquivo `.env` e configure:**
   ```bash
   # URL do webhook do n8n
   VITE_WEBHOOK_URL=https://n8n.versa.tec.br/webhook-test/versa_saude_teste
   
   # URL da API local (opcional, padrão: http://localhost:3001)
   VITE_API_URL=http://localhost:3001
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

## 🚀 Como Executar

### Desenvolvimento Completo (Frontend + Backend)

Execute ambos os servidores simultaneamente:
```bash
npm run dev:all
```

### Apenas Frontend
```bash
npm run dev
```

### Apenas Backend (API)
```bash
npm run dev:server
```

## 📡 API de Mensagens

O projeto inclui uma API backend que permite enviar mensagens para o chat em tempo real.

### Endpoints Disponíveis

#### 1. Enviar Mensagem para o Chat
```http
POST http://localhost:3001/api/message
Content-Type: application/json

{
  "message": "Olá, esta é uma mensagem do assistente",
  "role": "assistant",  // opcional, padrão: "assistant"
  "delay": 3,           // opcional, em segundos (mostra "Digitando...")
  "id": "sessao-usuario"// obrigatório para direcionar a mensagem a um usuário específico
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Mensagem enviada para clientes conectados",
  "clientsCount": 1
}
```

#### 2. Enviar Imagem para o Chat
```http
POST http://localhost:3001/api/image
Content-Type: application/json

{
  "imageUrl": "https://exemplo.com/imagem.png",
  "caption": "Descrição opcional da imagem",
  "role": "assistant",  // opcional, padrão: "assistant"
  "delay": 2,           // opcional, em segundos (mostra "Digitando...")
  "id": "sessao-usuario"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Imagem enviada para clientes conectados",
  "clientsCount": 1
}
```

#### 3. Health Check
```http
GET http://localhost:3001/api/health
```

**Resposta:**
```json
{
  "status": "ok",
  "clientsConnected": 1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Como Usar a API

**Exemplo com cURL:**
```bash
curl -X POST http://localhost:3001/api/message \
  -H "Content-Type: application/json" \
  -d '{
        "message": "Olá! Como posso ajudar?",
        "id": "sessao-usuario",
        "delay": 2
      }'
```

**Exemplo com JavaScript:**
```javascript
fetch('http://localhost:3001/api/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'Esta mensagem aparecerá no chat!',
    role: 'assistant',
    delay: 4, // segundos
    id: 'sessao-usuario'
  })
})
```

**Exemplo enviando imagem:**
```javascript
fetch('http://localhost:3001/api/image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageUrl: 'https://exemplo.com/imagem.png',
    caption: 'Olha só esta imagem!',
    role: 'assistant',
    delay: 3, // segundos
    id: 'sessao-usuario'
  })
})
```

> O parâmetro `delay` é opcional (valor em segundos). Enquanto o atraso estiver ativo, o chat exibe o indicador “Digitando...” antes de mostrar a mensagem ou imagem recebida.

### IDs de sessão

- Cada navegador/usuário recebe um `id` único gerado automaticamente pelo frontend (`versia-session-id` armazenado em `localStorage`).
- Esse `id` é enviado junto com as mensagens para o webhook. Use-o para encaminhar a resposta à API (`/api/message` ou `/api/image`) com o mesmo `id`, garantindo que apenas aquela pessoa receba o retorno.
- Os eventos SSE (`/api/events`) também recebem o parâmetro `id`, isolando os fluxos por usuário.

### Server-Sent Events (SSE)

O frontend se conecta automaticamente ao endpoint `/api/events` via SSE para receber mensagens em tempo real. Quando você envia uma mensagem via API, ela aparece instantaneamente no chat do usuário.

### Configuração com Ngrok

Se você estiver usando ngrok para expor a API externamente:

1. **Configure o ngrok para apontar para a porta 3001 (backend):**
   ```bash
   ngrok http 3001
   ```

2. **Use a URL do ngrok no n8n:**
   ```
   https://seu-ngrok-url.ngrok-free.app/api/message
   ```

⚠️ **Importante:** O ngrok deve apontar para a porta **3001** (servidor Express), não para a porta do Vite (5173).

Para mais detalhes, consulte o arquivo `NGROK_SETUP.md`.

### Importante

- O arquivo `.env` não é versionado (está no `.gitignore`)
- Nunca commite o arquivo `.env` com credenciais ou URLs sensíveis
- A API roda na porta 3001 por padrão (configurável via variável `PORT`)
- O servidor está configurado para escutar em `0.0.0.0` (todas as interfaces)

## 📝 Licença

Este projeto é privado.

