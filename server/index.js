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

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
  next()
})

app.use(express.json())

// Armazena os clientes conectados via SSE por sessão
const clientsBySession = new Map()

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const addClientToSession = (sessionId, res) => {
  if (!clientsBySession.has(sessionId)) {
    clientsBySession.set(sessionId, new Set())
  }
  const set = clientsBySession.get(sessionId)
  set.add(res)
  console.log(`👥 Cliente conectado à sessão ${sessionId}. Total na sessão: ${set.size}`)
}

const removeClientFromSession = (sessionId, res) => {
  const set = clientsBySession.get(sessionId)
  if (!set) return
  set.delete(res)
  console.log(`👋 Cliente desconectado da sessão ${sessionId}. Restantes: ${set.size}`)
  if (set.size === 0) {
    clientsBySession.delete(sessionId)
    console.log(`🧹 Sessão ${sessionId} removida`)
  }
}

const getTotalClientCount = () =>
  Array.from(clientsBySession.values()).reduce((acc, set) => acc + set.size, 0)

const broadcastMessage = (messageData, targetSessionId) => {
  const payload = `data: ${JSON.stringify(messageData)}\n\n`
  let sentCount = 0

  const sendToSet = (set) => {
    set.forEach((client) => {
      try {
        client.write(payload)
        sentCount++
      } catch (error) {
        console.error('❌ Erro ao enviar para cliente:', error)
        set.delete(client)
        try {
          client.end()
        } catch (endError) {
          console.error('Erro ao encerrar conexão com cliente:', endError)
        }
      }
    })
  }

  if (targetSessionId) {
    const set = clientsBySession.get(targetSessionId)
    if (set && set.size > 0) {
      console.log(`📤 Enviando mensagem para sessão ${targetSessionId} (${set.size} cliente[s])`)
      console.log('📦 Dados da mensagem:', JSON.stringify(messageData, null, 2))
      sendToSet(set)
    } else {
      console.log(`⚠️ Nenhum cliente conectado para a sessão ${targetSessionId}`)
    }
  } else {
    console.log(`📤 Enviando broadcast para ${getTotalClientCount()} cliente(s)`)
    console.log('📦 Dados da mensagem:', JSON.stringify(messageData, null, 2))
    clientsBySession.forEach(sendToSet)
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
  const sessionId = getSessionIdFromRequest(req) || 'default'

  // Configura headers para SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  addClientToSession(sessionId, res)

  // Envia um evento de conexão
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Conectado ao servidor', id: sessionId })}\n\n`)

  // Remove o cliente quando a conexão é fechada
  req.on('close', () => {
    removeClientFromSession(sessionId, res)
  })
})

const parseDelay = (input) => {
  if (input === undefined || input === null) return 0
  const delayNumber = typeof input === 'string' ? parseFloat(input) : Number(input)
  if (Number.isNaN(delayNumber) || !Number.isFinite(delayNumber)) return 0
  return Math.max(delayNumber, 0)
}

// Rota para receber mensagens externas
app.post('/api/message', async (req, res) => {
  try {
    console.log('Body recebido:', JSON.stringify(req.body))
    const { message, role = 'assistant', delay, id: targetSessionIdRaw } = req.body

    if (!message) {
      console.error('Erro: Mensagem não fornecida')
      return res.status(400).json({ 
        error: 'Mensagem é obrigatória',
        received: req.body
      })
    }

    const targetSessionId = targetSessionIdRaw ? String(targetSessionIdRaw) : undefined
    const delaySeconds = parseDelay(delay)
    const delayMs = delaySeconds * 1000

    if (delayMs > 0) {
      console.log(`⌛ Aplicando delay de ${delaySeconds}s antes de enviar a mensagem`)
      broadcastMessage({
        type: 'typing',
        role,
        timestamp: new Date().toISOString(),
        duration: delayMs,
        id: targetSessionId,
      }, targetSessionId)
      await wait(delayMs)
    }

    const messageData = {
      type: 'message',
      role: role, // 'assistant' ou 'user'
      content: message,
      timestamp: new Date().toISOString(),
      id: targetSessionId,
    }

    const sentCount = broadcastMessage(messageData, targetSessionId)

    res.json({ 
      success: true, 
      message: 'Mensagem enviada para clientes conectados',
      clientsCount: sentCount,
      data: messageData,
      delay: delaySeconds,
      id: targetSessionId,
    })
  } catch (error) {
    console.error('❌ Erro ao processar mensagem:', error)
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// Rota para enviar imagens ao chat
app.post('/api/image', async (req, res) => {
  try {
    console.log('Body (imagem) recebido:', JSON.stringify(req.body))
    const { imageUrl, imageAlt, caption, content, role = 'assistant', delay, id: targetSessionIdRaw } = req.body || {}

    if (!imageUrl) {
      console.error('Erro: imageUrl não fornecida')
      return res.status(400).json({
        error: 'imageUrl é obrigatória',
        received: req.body
      })
    }

    const targetSessionId = targetSessionIdRaw ? String(targetSessionIdRaw) : undefined
    const delaySeconds = parseDelay(delay)
    const delayMs = delaySeconds * 1000

    if (delayMs > 0) {
      console.log(`⌛ Aplicando delay de ${delaySeconds}s antes de enviar a imagem`)
      broadcastMessage({
        type: 'typing',
        role,
        timestamp: new Date().toISOString(),
        duration: delayMs,
        id: targetSessionId,
      }, targetSessionId)
      await wait(delayMs)
    }

    const messageData = {
      type: 'image',
      role,
      imageUrl,
      imageAlt: imageAlt || caption || content || 'Imagem enviada',
      content: content || caption || '',
      timestamp: new Date().toISOString(),
      id: targetSessionId,
    }

    const sentCount = broadcastMessage(messageData, targetSessionId)

    res.json({
      success: true,
      message: 'Imagem enviada para clientes conectados',
      clientsCount: sentCount,
      data: messageData,
      delay: delaySeconds,
      id: targetSessionId,
    })
  } catch (error) {
    console.error('❌ Erro ao processar imagem:', error)
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      events: '/api/events (SSE)'
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

