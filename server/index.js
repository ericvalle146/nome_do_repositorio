import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middleware para log de requisições (apenas em dev ou se habilitado)
const LOG_REQUESTS = process.env.LOG_REQUESTS === 'true'
app.use((req, res, next) => {
  if (LOG_REQUESTS) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  }
  next()
})

app.use(express.json())

// Armazena os clientes conectados via SSE por sessão
const clientsBySession = new Map()

// Fila de mensagens por sessão (para garantir ordem e evitar problemas com delay)
const messageQueues = new Map()

// Timeouts ativos por sessão (para poder cancelar se necessário)
const activeTimeouts = new Map()

const addClientToSession = (sessionId, res) => {
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    console.error('❌ Tentativa de adicionar cliente com sessionId inválido:', sessionId)
    return
  }
  
  const trimmedSessionId = sessionId.trim()
  
  if (!clientsBySession.has(trimmedSessionId)) {
    clientsBySession.set(trimmedSessionId, new Set())
    console.log(`🆕 Nova sessão criada: ${trimmedSessionId}`)
  }
  const set = clientsBySession.get(trimmedSessionId)
  set.add(res)
  console.log(`👥 Cliente conectado à sessão ${trimmedSessionId}. Total na sessão: ${set.size}`)
}

const removeClientFromSession = (sessionId, res) => {
  if (!sessionId || typeof sessionId !== 'string') {
    return
  }
  
  const trimmedSessionId = sessionId.trim()
  const set = clientsBySession.get(trimmedSessionId)
  if (!set) {
    console.warn(`⚠️ Tentativa de remover cliente de sessão inexistente: ${trimmedSessionId}`)
    return
  }
  
  set.delete(res)
  console.log(`👋 Cliente desconectado da sessão ${trimmedSessionId}. Restantes: ${set.size}`)
  
  if (set.size === 0) {
    clientsBySession.delete(trimmedSessionId)
    console.log(`🧹 Sessão ${trimmedSessionId} removida (sem clientes)`)
    
    // Limpa timeout e fila quando não há mais clientes
    const timeoutId = activeTimeouts.get(trimmedSessionId)
    if (timeoutId) {
      clearTimeout(timeoutId)
      activeTimeouts.delete(trimmedSessionId)
      console.log(`⏱️ Timeout cancelado para sessão ${trimmedSessionId}`)
    }
    
    if (messageQueues.has(trimmedSessionId)) {
      messageQueues.delete(trimmedSessionId)
      console.log(`🗑️ Fila de mensagens removida para sessão ${trimmedSessionId}`)
    }
  }
}

const getTotalClientCount = () =>
  Array.from(clientsBySession.values()).reduce((acc, set) => acc + set.size, 0)

const broadcastMessage = (messageData, targetSessionId) => {
  const payload = `data: ${JSON.stringify(messageData)}\n\n`
  let sentCount = 0

  const sendToSet = (set, sessionIdForLog) => {
    const clientsToRemove = []
    
    set.forEach((client) => {
      try {
        client.write(payload)
        sentCount++
      } catch (error) {
        // Cliente provavelmente desconectou - marca para remoção
        clientsToRemove.push(client)
        try {
          client.end()
        } catch (endError) {
          // Ignora erro ao encerrar
        }
      }
    })
    
    // Remove clientes desconectados
    clientsToRemove.forEach(client => {
      set.delete(client)
    })
    
    if (clientsToRemove.length > 0 && sessionIdForLog) {
      console.log(`🧹 ${clientsToRemove.length} cliente(s) desconectado(s) removido(s) da sessão ${sessionIdForLog}`)
    }
  }

  if (targetSessionId && typeof targetSessionId === 'string' && targetSessionId.trim().length > 0) {
    const trimmedSessionId = targetSessionId.trim()
    const set = clientsBySession.get(trimmedSessionId)
    if (set && set.size > 0) {
      console.log(`📤 Enviando mensagem para sessão ${trimmedSessionId} (${set.size} cliente[s])`)
      console.log(`📦 Tipo: ${messageData.type}, ID na mensagem: ${messageData.id || 'nenhum'}`)
      sendToSet(set, trimmedSessionId)
    } else {
      console.warn(`⚠️ Nenhum cliente conectado para a sessão ${trimmedSessionId}`)
      console.log(`📋 Sessões disponíveis: ${Array.from(clientsBySession.keys()).join(', ') || 'nenhuma'}`)
    }
  } else {
    // Broadcast para todas as sessões
    console.log(`📤 Enviando broadcast para ${getTotalClientCount()} cliente(s) em ${clientsBySession.size} sessão(ões)`)
    clientsBySession.forEach((set, sessionId) => {
      sendToSet(set, sessionId)
    })
  }

  return sentCount
}

const getSessionIdFromRequest = (req) => {
  const queryId = req.query.id
  const headerId = req.headers['x-session-id']
  const bodyId = req.body?.id
  const id = queryId || headerId || bodyId
  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : undefined
}

// Rota para Server-Sent Events (SSE)
app.get('/api/events', (req, res) => {
  let sessionId = getSessionIdFromRequest(req)
  
  // Valida sessionId
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    console.warn('⚠️ SessionId inválido ou ausente na requisição SSE. Usando "default"')
    sessionId = 'default'
  } else {
    sessionId = sessionId.trim()
  }

  console.log(`🔌 Nova conexão SSE solicitada para sessão: ${sessionId}`)
  console.log(`📋 Total de sessões ativas: ${clientsBySession.size}`)

  // Configura headers para SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('X-Accel-Buffering', 'no') // Desabilita buffering no Nginx se estiver usando

  // Adiciona cliente à sessão
  addClientToSession(sessionId, res)

  // Envia um evento de conexão
  const connectedMessage = {
    type: 'connected',
    message: 'Conectado ao servidor',
    id: sessionId,
    timestamp: new Date().toISOString()
  }
  res.write(`data: ${JSON.stringify(connectedMessage)}\n\n`)
  console.log(`✅ Evento de conexão enviado para sessão ${sessionId}`)

  // Mantém a conexão viva com heartbeat (opcional, mas ajuda a detectar conexões mortas)
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`)
    } catch (error) {
      // Se não conseguir escrever, a conexão provavelmente está fechada
      clearInterval(heartbeatInterval)
    }
  }, 30000) // A cada 30 segundos

  // Remove o cliente quando a conexão é fechada
  req.on('close', () => {
    console.log(`🔌 Conexão SSE fechada para sessão ${sessionId}`)
    clearInterval(heartbeatInterval)
    removeClientFromSession(sessionId, res)
  })
  
  req.on('error', (error) => {
    console.error(`❌ Erro na conexão SSE para sessão ${sessionId}:`, error)
    clearInterval(heartbeatInterval)
    removeClientFromSession(sessionId, res)
  })
})

const parseDelay = (input) => {
  if (input === undefined || input === null) return 0
  const delayNumber = typeof input === 'string' ? parseFloat(input) : Number(input)
  if (Number.isNaN(delayNumber) || !Number.isFinite(delayNumber)) return 0
  // Limita delay máximo a 60 segundos para evitar problemas
  return Math.min(Math.max(delayNumber, 0), 60)
}

// Processa a fila de mensagens de uma sessão (garante ordem sequencial)
const processMessageQueue = (sessionId) => {
  const queue = messageQueues.get(sessionId)
  if (!queue || queue.length === 0) {
    // Fila vazia: remove flag de processamento
    if (queue) {
      queue.processing = false
    }
    return
  }
  
  // Se já está processando, não faz nada (a mensagem atual processará a próxima)
  if (queue.processing) {
    return
  }
  
  // Marca como processando
  queue.processing = true
  const item = queue.shift()
  
  if (!item) {
    queue.processing = false
    // Tenta processar novamente (pode ter novas mensagens)
    if (queue.length > 0) {
      setImmediate(() => processMessageQueue(sessionId))
    }
    return
  }
  
  const { messageData, delayMs } = item
  
  if (delayMs > 0 && delayMs < 60000) {
    // Envia evento de typing
    broadcastMessage({
      type: 'typing',
      role: messageData.role,
      timestamp: new Date().toISOString(),
      duration: delayMs,
      id: sessionId,
    }, sessionId)
    
    // Cancela timeout anterior se existir (evita sobreposição)
    const existingTimeout = activeTimeouts.get(sessionId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }
    
    // Agenda o envio da mensagem
    const timeoutId = setTimeout(() => {
      activeTimeouts.delete(sessionId)
      broadcastMessage(messageData, sessionId)
      queue.processing = false
      
      // Processa próxima mensagem da fila após delay
      setImmediate(() => processMessageQueue(sessionId))
    }, delayMs)
    
    activeTimeouts.set(sessionId, timeoutId)
  } else {
    // Sem delay ou delay inválido: envia imediatamente
    if (delayMs === 0) {
      // Cancela typing se estava ativo
      const existingTimeout = activeTimeouts.get(sessionId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        activeTimeouts.delete(sessionId)
      }
    }
    
    broadcastMessage(messageData, sessionId)
    queue.processing = false
    
    // Processa próxima mensagem da fila imediatamente
    setImmediate(() => processMessageQueue(sessionId))
  }
}

// Adiciona mensagem à fila (garante ordem sequencial)
const queueMessage = (sessionId, messageData, delayMs) => {
  if (!sessionId) {
    // Sem sessionId: envia imediatamente (broadcast)
    broadcastMessage(messageData, undefined)
    return
  }
  
  // Garante que a fila existe
  if (!messageQueues.has(sessionId)) {
    messageQueues.set(sessionId, [])
  }
  
  const queue = messageQueues.get(sessionId)
  
  // Adiciona mensagem à fila
  queue.push({ messageData, delayMs: Math.max(0, Math.round(delayMs)) })
  
  // Se não está processando, inicia o processamento
  // Usa setImmediate para garantir que não bloqueie a resposta HTTP
  if (!queue.processing) {
    setImmediate(() => processMessageQueue(sessionId))
  }
}

// Rota para receber mensagens externas
app.post('/api/message', async (req, res) => {
  try {
    const { message, role = 'assistant', delay, id: targetSessionIdRaw, source, messageType } = req.body

    // Ignora mensagens que vêm do usuário (para evitar loop)
    if (role === 'user' || source === 'user' || messageType === 'user') {
      return res.json({ 
        success: false, 
        message: 'Mensagens do usuário não devem ser enviadas via API',
        ignored: true
      })
    }

    if (!message) {
      return res.status(400).json({ 
        error: 'Mensagem é obrigatória'
      })
    }

    const targetSessionId = targetSessionIdRaw ? String(targetSessionIdRaw) : undefined
    const delaySeconds = parseDelay(delay)
    const delayMs = Math.round(delaySeconds * 1000) // Converte para ms e arredonda

    // Prepara os dados da mensagem
    const messageData = {
      type: 'message',
      role: role,
      content: message,
      timestamp: new Date().toISOString(),
      id: targetSessionId,
    }

    // Adiciona à fila (garante ordem e processamento sequencial)
    // A função queueMessage já trata o caso de sem sessionId
    queueMessage(targetSessionId, messageData, delayMs)
    
    // Responde imediatamente (não espera o delay)
    res.json({ 
      success: true, 
      message: delayMs > 0 ? 'Mensagem agendada e será enviada em breve' : 'Mensagem enviada para clientes conectados',
      clientsCount: targetSessionId ? 0 : getTotalClientCount(), // Se tem sessionId, será enviado depois
      data: messageData,
      delay: delaySeconds,
      id: targetSessionId,
    })
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Rota para enviar imagens ao chat
app.post('/api/image', async (req, res) => {
  try {
    const { imageUrl, imageAlt, caption, content, role = 'assistant', delay, id: targetSessionIdRaw, source, messageType } = req.body || {}

    // Ignora imagens que vêm do usuário (para evitar loop)
    if (role === 'user' || source === 'user' || messageType === 'user') {
      return res.json({ 
        success: false, 
        message: 'Imagens do usuário não devem ser enviadas via API',
        ignored: true
      })
    }

    if (!imageUrl) {
      return res.status(400).json({
        error: 'imageUrl é obrigatória'
      })
    }

    const targetSessionId = targetSessionIdRaw ? String(targetSessionIdRaw) : undefined
    const delaySeconds = parseDelay(delay)
    const delayMs = Math.round(delaySeconds * 1000) // Converte para ms e arredonda

    // Prepara os dados da imagem
    const messageData = {
      type: 'image',
      role,
      imageUrl,
      imageAlt: imageAlt || caption || content || 'Imagem enviada',
      content: content || caption || '',
      timestamp: new Date().toISOString(),
      id: targetSessionId,
    }

    // Adiciona à fila (garante ordem e processamento sequencial)
    // A função queueMessage já trata o caso de sem sessionId
    queueMessage(targetSessionId, messageData, delayMs)
    
    // Responde imediatamente (não espera o delay)
    res.json({
      success: true,
      message: delayMs > 0 ? 'Imagem agendada e será enviada em breve' : 'Imagem enviada para clientes conectados',
      clientsCount: targetSessionId ? 0 : getTotalClientCount(), // Se tem sessionId, será enviado depois
      data: messageData,
      delay: delaySeconds,
      id: targetSessionId,
    })
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    })
  }
})

// Armazena o prompt (em memória - pode ser substituído por banco de dados)
let savedPrompt = ""

// Rota para obter o prompt
app.get('/api/prompt', (req, res) => {
  try {
    res.json({
      success: true,
      prompt: savedPrompt || ""
    })
  } catch (error) {
    console.error('❌ Erro ao obter prompt:', error)
    res.status(500).json({
      error: 'Erro ao obter prompt',
      message: error.message
    })
  }
})

// Rota para salvar o prompt
app.post('/api/prompt', (req, res) => {
  try {
    const { prompt } = req.body
    
    if (typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt deve ser uma string',
        received: typeof prompt
      })
    }
    
    // Salva o prompt
    savedPrompt = prompt || ""
    
    res.json({
      success: true,
      message: 'Prompt salvo com sucesso',
      prompt: savedPrompt
    })
  } catch (error) {
    console.error('❌ Erro ao salvar prompt:', error)
    res.status(500).json({
      error: 'Erro ao salvar prompt',
      message: error.message
    })
  }
})

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    clientsConnected: getTotalClientCount(),
    timestamp: new Date().toISOString()
  })
})

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err)
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  })
})

// Rota para verificar se o servidor está rodando
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'VERSIA API',
    endpoints: {
      health: '/api/health',
      message: '/api/message (POST)',
      image: '/api/image (POST)',
      events: '/api/events (SSE)',
      prompt: '/api/prompt (GET, POST)'
    },
    clientsConnected: getTotalClientCount()
  })
})

// Inicia o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
  console.log(`📡 SSE disponível em http://0.0.0.0:${PORT}/api/events`)
  console.log(`📨 Endpoint de mensagens em http://0.0.0.0:${PORT}/api/message`)
  console.log(`🌐 Acessível externamente em todas as interfaces`)
})

