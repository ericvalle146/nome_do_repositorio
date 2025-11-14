# 🚀 Guia de Deploy - VERSIA

## Passo a Passo para Fazer Deploy no Servidor

### 1️⃣ Conectar no Servidor

```bash
ssh root@seu-servidor.com
# ou
ssh usuario@seu-servidor.com
```

### 2️⃣ Navegar até o Diretório do Projeto

```bash
cd ~/versia
# ou o caminho onde está o projeto
```

### 3️⃣ Atualizar o Código do GitHub

```bash
git pull origin main
```

Isso vai baixar todas as alterações mais recentes, incluindo:
- ✅ Controle de tamanho de fonte
- ✅ Botão Limpar histórico
- ✅ Botão de copiar mensagens
- ✅ Melhorias no foco automático
- ✅ Novas dependências (Radix UI)

### 4️⃣ Executar o Script de Deploy

```bash
chmod +x deploy.sh  # Se ainda não tiver permissão
./deploy.sh
```

O script vai:
1. ✅ Verificar Node.js e npm
2. ✅ Instalar PM2 se necessário
3. ✅ Verificar/criar arquivo `.env`
4. ✅ Instalar dependências (`npm ci`)
5. ✅ Carregar variáveis de ambiente
6. ✅ Limpar build anterior
7. ✅ Gerar novo build do frontend
8. ✅ Parar processos antigos do PM2
9. ✅ Iniciar backend e frontend com PM2

### 5️⃣ Verificar se Está Funcionando

```bash
# Ver status dos processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs apenas do frontend
pm2 logs versia-web

# Ver logs apenas do backend
pm2 logs versia-server
```

### 6️⃣ Testar no Navegador

Acesse o site e verifique:
- ✅ Controle de tamanho de fonte no header (ícone de texto)
- ✅ Botão "Limpar histórico" ao lado do botão de enviar
- ✅ Botão de copiar ao passar mouse sobre mensagens
- ✅ Foco automático na caixa de texto após enviar

---

## 🔄 Deploy Rápido (Atualização)

Se você já tem o projeto no servidor e só quer atualizar:

```bash
cd ~/versia
git pull origin main
./deploy.sh
```

---

## 🛠️ Comandos Úteis do PM2

```bash
# Ver status
pm2 status

# Reiniciar aplicação
pm2 restart versia-server
pm2 restart versia-web

# Parar aplicação
pm2 stop versia-server
pm2 stop versia-web

# Ver logs
pm2 logs

# Ver logs de um processo específico
pm2 logs versia-server
pm2 logs versia-web

# Monitorar recursos
pm2 monit

# Salvar configuração atual
pm2 save

# Habilitar PM2 no boot do sistema
pm2 startup
pm2 save
```

---

## ⚠️ Troubleshooting

### Erro: "Node.js >= 18 é necessário"

```bash
# Atualizar Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v  # Verificar versão
```

### Erro: "Cannot find package"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port already in use"

```bash
# Verificar o que está usando a porta
lsof -i :3002  # Backend
lsof -i :4173  # Frontend

# Parar processos PM2 antigos
pm2 delete all
pm2 kill
```

### Build não atualiza

```bash
# Limpar completamente e rebuildar
rm -rf dist node_modules/.vite .vite .vite-cache
npm run build
```

---

## 📝 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Código commitado e enviado para GitHub
- [ ] Arquivo `.env` configurado corretamente
- [ ] Node.js >= 18 instalado
- [ ] PM2 instalado
- [ ] Portas 3002 (backend) e 4173 (frontend) disponíveis
- [ ] Nginx configurado (se estiver usando)

---

## 🎯 Deploy Automatizado (Opcional)

Você pode criar um script simples para automatizar:

```bash
#!/bin/bash
# deploy-quick.sh
cd ~/versia
git pull origin main
./deploy.sh
```

Depois:

```bash
chmod +x deploy-quick.sh
./deploy-quick.sh
```

---

**Pronto! Agora é só executar os comandos acima no seu servidor.** 🚀

