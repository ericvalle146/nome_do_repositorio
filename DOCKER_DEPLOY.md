# Deploy com Docker

Este guia explica como fazer deploy da aplicação VERSIA usando Docker e Docker Compose.

## Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Acesso à VPS/servidor

## Estrutura

A aplicação é dividida em dois containers:
- **versia-backend**: API Node.js/Express (porta 3001)
- **versia-frontend**: Frontend React/Vite (porta 4173)

## Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Porta do backend
BACKEND_PORT=3001

# Porta do frontend
FRONTEND_PORT=4173

# URL da API (para o frontend)
# Em produção, use a URL pública (ngrok, domínio, etc)
# Para comunicação interna entre containers, use: http://versia-backend:3001
VITE_API_URL=http://versia-backend:3001

# URL do webhook do n8n
VITE_WEBHOOK_URL=https://n8n.versa.tec.br/webhook/versa_saude_teste

# Hosts permitidos
VITE_ALLOWED_HOSTS=chatinho.versatecnologia.com.br

# Logs de requisições (true/false)
LOG_REQUESTS=false
```

### 2. Build e Deploy

#### Opção 1: Docker Compose (Recomendado)

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Iniciar os containers
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar os containers
docker-compose -f docker-compose.prod.yml down

# Rebuild e reiniciar
docker-compose -f docker-compose.prod.yml up -d --build
```

#### Opção 2: Docker Manual

```bash
# Build das imagens
docker build -f Dockerfile.backend -t versia-backend .
docker build -f Dockerfile.frontend -t versia-frontend .

# Criar rede
docker network create versia-network

# Executar backend
docker run -d \
  --name versia-backend \
  --network versia-network \
  -p 3001:3001 \
  -e PORT=3001 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  versia-backend

# Executar frontend
docker run -d \
  --name versia-frontend \
  --network versia-network \
  -p 4173:4173 \
  -e VITE_API_URL=http://versia-backend:3001 \
  -e VITE_WEBHOOK_URL=https://n8n.versa.tec.br/webhook/versa_saude_teste \
  --restart unless-stopped \
  versia-frontend
```

## Comunicação entre Containers

Os containers se comunicam através da rede Docker `versia-network`. 

- **Frontend → Backend**: O frontend se conecta ao backend usando `http://versia-backend:3001` (nome do serviço Docker)
- **Backend → Frontend**: O backend não precisa se conectar ao frontend diretamente (SSE é iniciado pelo frontend)

## Conectando a Redes Existentes

Se você já tem outros containers Docker rodando e quer que eles se comuniquem:

### 1. Verificar redes existentes

```bash
docker network ls
docker network inspect <network-name>
```

### 2. Conectar containers a rede existente

Edite o `docker-compose.prod.yml` e adicione a rede existente:

```yaml
services:
  versia-backend:
    networks:
      - versia-network
      - existing-network-name  # Adicione aqui

  versia-frontend:
    networks:
      - versia-network
      - existing-network-name  # Adicione aqui

networks:
  versia-network:
    driver: bridge
  existing-network-name:  # Adicione aqui
    external: true
    name: existing-network-name
```

### 3. Ou use apenas a rede existente

```yaml
networks:
  existing-network:
    external: true
    name: existing-network-name
```

## Verificação

### Verificar containers rodando

```bash
docker ps
docker ps -a
```

### Verificar logs

```bash
# Todos os containers
docker-compose -f docker-compose.prod.yml logs -f

# Backend apenas
docker-compose -f docker-compose.prod.yml logs -f versia-backend

# Frontend apenas
docker-compose -f docker-compose.prod.yml logs -f versia-frontend
```

### Verificar saúde dos containers

```bash
# Backend
curl http://localhost:3001/api/health

# Frontend
curl http://localhost:4173
```

### Verificar rede

```bash
# Listar redes
docker network ls

# Inspecionar rede
docker network inspect versia-network

# Ver containers na rede
docker network inspect versia-network | grep -A 10 "Containers"
```

## Troubleshooting

### Container não inicia

```bash
# Ver logs
docker logs versia-backend
docker logs versia-frontend

# Verificar se porta está em uso
netstat -tuln | grep 3001
netstat -tuln | grep 4173
```

### Frontend não consegue conectar ao backend

1. Verifique se ambos estão na mesma rede:
   ```bash
   docker network inspect versia-network
   ```

2. Teste conexão entre containers:
   ```bash
   docker exec versia-frontend wget -O- http://versia-backend:3001/api/health
   ```

3. Verifique variáveis de ambiente:
   ```bash
   docker exec versia-frontend env | grep VITE_API_URL
   ```

### Rebuild necessário após mudanças

```bash
# Rebuild e reiniciar
docker-compose -f docker-compose.prod.yml up -d --build

# Ou rebuild forçado
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## Atualização

```bash
# Parar containers
docker-compose -f docker-compose.prod.yml down

# Atualizar código (git pull, etc)
git pull

# Rebuild e reiniciar
docker-compose -f docker-compose.prod.yml up -d --build
```

## Remoção

```bash
# Parar e remover containers
docker-compose -f docker-compose.prod.yml down

# Remover imagens
docker rmi versia-backend versia-frontend

# Remover rede (apenas se não estiver em uso)
docker network rm versia-network
```

## Notas

- O frontend precisa ser rebuildado se `VITE_*` variáveis mudarem (elas são embedadas no build)
- O backend pode usar variáveis de ambiente sem rebuild
- Para produção, considere usar um reverse proxy (Nginx) na frente dos containers
- Para HTTPS, use ngrok ou configure SSL no reverse proxy

