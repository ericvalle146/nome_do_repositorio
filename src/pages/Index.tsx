import { useState, useEffect, useRef } from "react"
import { ChatHeader } from "@/components/ChatHeader"
import { ChatInput } from "@/components/ChatInput"
import { ChatMessage, Message } from "@/components/ChatMessage"
import { EmptyState } from "@/components/EmptyState"
import { ScrollArea } from "@/components/ui/scroll-area"

const SESSION_STORAGE_KEY = "versia-session-id"
const createSessionId = () => {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [assistantTyping, setAssistantTyping] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  // useRef para garantir que sessionId não mude durante a vida do componente
  const sessionIdRef = useRef<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  // Em desenvolvimento, usa o proxy do Vite. Em produção, usa a URL completa
  const apiUrl = import.meta.env.DEV 
    ? '' // Proxy do Vite em desenvolvimento
    : (import.meta.env.VITE_API_URL || "http://localhost:3001")

  const shouldIgnoreMessage = (message: Message) => {
    const content = message.content?.trim().toLowerCase()
    if (!content) return false

    const phrasesToIgnore = [
      "workflow was started",
      "workflow was completed"
    ]

    return phrasesToIgnore.includes(content)
  }

  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
  }

  const scheduleTypingTimeout = (durationMs: number | undefined) => {
    // Limpa timeout anterior (se houver) antes de criar um novo
    clearTypingTimeout()
    
    // Valida e limita a duração
    const safeDuration =
      typeof durationMs === "number" && 
      Number.isFinite(durationMs) && 
      durationMs > 0 && 
      durationMs <= 60000
        ? Math.max(Math.round(durationMs), 500) // Mínimo 500ms, máximo 60s
        : 2000 // Fallback: 2 segundos
    
    // Agenda o timeout para desativar o typing
    typingTimeoutRef.current = setTimeout(() => {
      setAssistantTyping(false)
      typingTimeoutRef.current = null
    }, safeDuration)
  }

  // Inicializa ou recupera o ID da sessão do usuário (executa apenas uma vez)
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      let stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
      
      // Valida se o ID armazenado é válido (não vazio e tem formato válido)
      if (stored && stored.trim().length > 0) {
        const trimmedId = stored.trim()
        console.log('🔑 SessionID recuperado do localStorage:', trimmedId)
        sessionIdRef.current = trimmedId
        setSessionId(trimmedId)
        return
      }
      
      // Se não existe ou é inválido, cria um novo
      const newId = createSessionId()
      console.log('🆕 Novo SessionID criado:', newId)
      window.localStorage.setItem(SESSION_STORAGE_KEY, newId)
      sessionIdRef.current = newId
      setSessionId(newId)
    } catch (error) {
      // Se houver erro ao acessar localStorage, cria um ID temporário
      console.error('❌ Erro ao acessar localStorage:', error)
      const newId = createSessionId()
      console.log('🆕 SessionID temporário criado (localStorage não disponível):', newId)
      sessionIdRef.current = newId
      setSessionId(newId)
    }
  }, []) // Executa apenas uma vez na montagem do componente

  // Conecta ao Server-Sent Events quando sessionId estiver disponível
  useEffect(() => {
    // Usa o ref para garantir que sempre usa o sessionId correto
    const currentSessionId = sessionIdRef.current || sessionId
    
    if (!currentSessionId) {
      console.log('⏳ Aguardando sessionId para conectar ao SSE...')
      return
    }

    // Garante que sessionIdRef está sincronizado
    if (sessionId && sessionIdRef.current !== sessionId) {
      console.log('🔄 Sincronizando sessionIdRef com sessionId:', sessionId)
      sessionIdRef.current = sessionId
    }

    // Determina a URL base da API
    const getApiUrl = () => {
      if (import.meta.env.DEV) {
        return '' // Proxy do Vite em desenvolvimento
      }
      
      // Se VITE_API_URL está definido, verifica se é um nome de container Docker
      if (import.meta.env.VITE_API_URL) {
        const apiUrl = import.meta.env.VITE_API_URL
        // Se contém nome de container Docker (não tem http:// ou https:// com domínio válido)
        // e estamos no navegador, usa o hostname atual
        if (apiUrl.includes('versia-backend') && typeof window !== 'undefined') {
          // Usa o hostname do navegador com a porta do backend
          const port = apiUrl.match(/:(\d+)/)?.[1] || '3001'
          return `${window.location.protocol}//${window.location.hostname}:${port}`
        }
        return apiUrl
      }
      
      // Fallback: usa o hostname atual com porta 3001
      if (typeof window !== 'undefined') {
        return `${window.location.protocol}//${window.location.hostname}:3001`
      }
      return ''
    }

    const baseApiUrl = getApiUrl()
    const baseUrl = baseApiUrl ? `${baseApiUrl}/api/events` : '/api/events'
    const separator = baseUrl.includes("?") ? "&" : "?"
    // Usa sempre o sessionId do ref para garantir consistência
    const stableSessionId = sessionIdRef.current || currentSessionId
    const sseUrl = `${baseUrl}${separator}id=${encodeURIComponent(stableSessionId)}`
    
    console.log('🔌 Conectando ao SSE:', sseUrl)
    console.log('🔍 SessionId (state):', sessionId)
    console.log('🔍 SessionId (ref):', sessionIdRef.current)
    console.log('🔍 SessionId (usado):', stableSessionId)
    console.log('🔍 ApiUrl:', baseApiUrl)

    // Fecha conexão anterior se existir
    if (eventSourceRef.current) {
      console.log('🔌 Fechando conexão SSE anterior...')
      try {
        eventSourceRef.current.close()
      } catch (error) {
        console.error('Erro ao fechar conexão anterior:', error)
      }
      eventSourceRef.current = null
    }

    // Constantes para controle de reconexão
    const MAX_RECONNECT_ATTEMPTS = 10
    const RECONNECT_DELAY = 3000 // 3 segundos

    const connectSSE = () => {
      // Sempre usa o sessionId do ref para garantir consistência
      const stableSessionId = sessionIdRef.current
      
      if (!stableSessionId) {
        console.log('⏳ SessionId não disponível no ref, cancelando conexão SSE')
        // Tenta recuperar do localStorage
        try {
          const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
          if (stored && stored.trim().length > 0) {
            const trimmedId = stored.trim()
            console.log('🔑 Recuperando sessionId do localStorage na connectSSE:', trimmedId)
            sessionIdRef.current = trimmedId
            setSessionId(trimmedId)
            // Reconecta com o ID correto
            setTimeout(() => connectSSE(), 100)
          }
        } catch (error) {
          console.error('❌ Erro ao recuperar sessionId:', error)
        }
        return
      }

      // Verifica se o sessionId no localStorage ainda é o mesmo
      try {
        const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored && stored.trim() !== stableSessionId) {
          console.error('❌ SessionId mudou! localStorage:', stored.trim(), 'ref:', stableSessionId)
          // Restaura o sessionId do localStorage se estiver diferente
          sessionIdRef.current = stored.trim()
          setSessionId(stored.trim())
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessionId no localStorage:', error)
      }

      // Fecha conexão anterior se existir
      if (eventSourceRef.current) {
        console.log('🔌 Fechando conexão SSE anterior na função connectSSE...')
        try {
          eventSourceRef.current.close()
        } catch (error) {
          console.error('Erro ao fechar conexão anterior:', error)
        }
        eventSourceRef.current = null
      }

      // Reconstrói a URL com o sessionId atualizado do ref
      const currentSseUrl = `${baseUrl}${separator}id=${encodeURIComponent(stableSessionId)}`
      
      console.log('🔄 Criando nova conexão SSE com sessionId:', stableSessionId)
      console.log('🔗 URL SSE:', currentSseUrl)
      
      // Cria nova conexão SSE
      const eventSource = new EventSource(currentSseUrl, {
        withCredentials: false
      })
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('✅ Conexão SSE estabelecida com sessionId:', stableSessionId)
        reconnectAttemptsRef.current = 0 // Reset contador de tentativas
      }

      eventSource.onmessage = (event) => {
        try {
          console.log('📨 Mensagem SSE recebida:', event.data)
          const data = JSON.parse(event.data)
          console.log('📦 Dados parseados:', data)

          // Verifica se a mensagem é para esta sessão
          // IMPORTANTE: Usa o sessionId do ref para garantir consistência
          const currentSessionId = sessionIdRef.current
          const messageId = data.id ? String(data.id).trim() : null
          const sessionIdTrimmed = currentSessionId ? String(currentSessionId).trim() : null
          
          if (messageId && sessionIdTrimmed && messageId !== sessionIdTrimmed) {
            console.log(`ℹ️ Evento destinado à sessão ${messageId}, ignorando para ${sessionIdTrimmed}`)
            console.log(`🔍 Comparação detalhada: "${messageId}" (${messageId.length} chars) !== "${sessionIdTrimmed}" (${sessionIdTrimmed.length} chars)`)
            return
          }

          // Se não tem ID, é broadcast (aceita)
          // Se tem ID e corresponde, aceita
          if (messageId && sessionIdTrimmed && messageId === sessionIdTrimmed) {
            console.log(`✅ Mensagem correspondente à sessão atual: ${sessionIdTrimmed}`)
          } else if (!messageId) {
            console.log(`📢 Mensagem broadcast (sem ID específico)`)
          } else {
            console.log(`⚠️ Mensagem sem match claro - messageId: ${messageId}, sessionId: ${sessionIdTrimmed}`)
          }
          
          if (data.type === 'message' || data.type === 'text') {
            setAssistantTyping(false)
            clearTypingTimeout()
            // Adiciona mensagem recebida do servidor
            const newMessage: Message = {
              role: data.role || 'assistant',
              type: 'text',
              content: data.content || data.message || ''
            }
            if (shouldIgnoreMessage(newMessage)) {
              console.log('🚫 Mensagem ignorada (texto):', newMessage.content)
              return
            }
            console.log('➕ Adicionando mensagem ao chat:', newMessage)
            setMessages((prev) => {
              const updated = [...prev, newMessage]
              console.log('📋 Total de mensagens:', updated.length)
              return updated
            })
            setIsLoading(false)
          } else if (data.type === 'image') {
            setAssistantTyping(false)
            clearTypingTimeout()
            if (!data.imageUrl && !data.url) {
              console.warn('⚠️ Evento de imagem sem URL:', data)
              return
            }
            const newMessage: Message = {
              role: data.role || 'assistant',
              type: 'image',
              imageUrl: data.imageUrl || data.url,
              imageAlt: data.imageAlt || data.alt || data.caption || "Imagem enviada",
              content: data.content || data.caption || ''
            }
            if (shouldIgnoreMessage(newMessage)) {
              console.log('🚫 Mensagem ignorada (imagem):', newMessage.content)
              return
            }
            console.log('🖼️ Adicionando imagem ao chat:', newMessage)
            setMessages((prev) => {
              const updated = [...prev, newMessage]
              console.log('📋 Total de mensagens:', updated.length)
              return updated
            })
            setIsLoading(false)
          } else if (data.type === 'connected') {
            console.log('✅ Conectado ao servidor de eventos')
            console.log('🔑 SessionId confirmado:', data.id || sessionId)
          } else if (data.type === 'typing') {
            setAssistantTyping(true)
            // Usa duration se disponível, senão usa delay (convertido para ms)
            const durationMs =
              typeof data.duration === "number" && data.duration > 0
                ? data.duration
                : typeof data.delay === "number" && data.delay > 0
                  ? data.delay * 1000
                  : typeof data.delay === "string"
                    ? parseFloat(data.delay) * 1000
                    : 2000 // Fallback: 2 segundos
            // Limita a duração máxima a 60 segundos para evitar problemas
            const safeDuration = Math.min(Math.max(durationMs, 500), 60000)
            scheduleTypingTimeout(safeDuration)
          } else {
            console.log('ℹ️ Evento desconhecido:', data)
          }
        } catch (error) {
          console.error('❌ Erro ao processar mensagem SSE:', error, event.data)
        }
      }

      eventSource.onerror = (error) => {
        console.error('❌ Erro na conexão SSE:', error, eventSource.readyState)
        
        // Se a conexão foi fechada, tenta reconectar
        if (eventSource.readyState === EventSource.CLOSED) {
          reconnectAttemptsRef.current++
          
          if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ Máximo de tentativas de reconexão atingido')
            return
          }
          
          console.log(`🔄 Tentando reconectar (tentativa ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) em ${RECONNECT_DELAY/1000}s...`)
          console.log('🔑 SessionId na reconexão:', sessionId)
          
          // Limpa timeout anterior se existir
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
            reconnectTimeoutRef.current = null
          }
          
          // Fecha a conexão atual
          try {
            eventSource.close()
          } catch (closeError) {
            console.error('Erro ao fechar conexão:', closeError)
          }
          eventSourceRef.current = null
          
          // Agenda reconexão
          reconnectTimeoutRef.current = setTimeout(() => {
            // Verifica se o sessionId ainda é o mesmo antes de reconectar
            // SEMPRE usa o ref para garantir consistência
            const currentSessionId = sessionIdRef.current
            const storedSessionId = typeof window !== 'undefined' 
              ? window.localStorage.getItem(SESSION_STORAGE_KEY)
              : null
            
            if (!currentSessionId) {
              console.error('❌ SessionId não disponível no ref durante reconexão. Cancelando.')
              // Tenta recuperar do localStorage
              if (storedSessionId && storedSessionId.trim().length > 0) {
                console.log('🔑 Recuperando sessionId do localStorage durante reconexão:', storedSessionId)
                sessionIdRef.current = storedSessionId.trim()
                setSessionId(storedSessionId.trim())
                connectSSE()
              }
              return
            }
            
            // Valida que o sessionId não mudou
            if (storedSessionId && storedSessionId.trim() !== currentSessionId.trim()) {
              console.error('❌ SessionId mudou durante reconexão!')
              console.log('SessionId no ref:', currentSessionId)
              console.log('SessionId no localStorage:', storedSessionId.trim())
              // Restaura do localStorage se estiver diferente
              const correctId = storedSessionId.trim()
              sessionIdRef.current = correctId
              setSessionId(correctId)
              console.log('🔄 SessionId restaurado do localStorage:', correctId)
            }
            
            // Usa o sessionId do ref atualizado
            const stableSessionId = sessionIdRef.current
            
            if (!stableSessionId) {
              console.error('❌ SessionId ainda não disponível após validação. Cancelando reconexão.')
              return
            }
            
            if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
              console.log('🔄 Reconectando com sessionId:', stableSessionId)
              connectSSE()
            } else {
              console.log('✅ Conexão já estabelecida, não é necessário reconectar')
            }
          }, RECONNECT_DELAY)
        }
      }
    }

    // Inicia a conexão
    connectSSE()

    // Limpa a conexão quando o componente desmonta ou quando sessionId/apiUrl mudam
    return () => {
      console.log('🔌 Fechando conexão SSE (cleanup)')
      console.log('🔑 SessionId (state) no cleanup:', sessionId)
      console.log('🔑 SessionId (ref) no cleanup:', sessionIdRef.current)
      
      // Limpa timeout de reconexão
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      
      // Fecha conexão SSE
      if (eventSourceRef.current) {
        try {
          eventSourceRef.current.close()
        } catch (error) {
          console.error('Erro ao fechar conexão SSE no cleanup:', error)
        }
        eventSourceRef.current = null
      }
      
      clearTypingTimeout()
      setAssistantTyping(false)
      reconnectAttemptsRef.current = 0 // Reset contador
    }
  }, [apiUrl, sessionId]) // Dependências: apiUrl e sessionId

  const handleSendMessage = async (message: string) => {
    // SEMPRE usa o sessionId do ref para garantir consistência
    let currentSessionId = sessionIdRef.current || sessionId
    
    // Se não tem sessionId, tenta recuperar do localStorage
    if (!currentSessionId) {
      console.warn("⚠️ Sessão ainda não inicializada. Tentando recuperar do localStorage...")
      try {
        const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
        if (stored && stored.trim().length > 0) {
          const trimmedId = stored.trim()
          console.log('🔑 SessionId recuperado do localStorage no handleSendMessage:', trimmedId)
          sessionIdRef.current = trimmedId
          setSessionId(trimmedId)
          currentSessionId = trimmedId
        } else {
          alert('Erro: Sessão não inicializada. Por favor, recarregue a página.')
          return
        }
      } catch (error) {
        console.error('❌ Erro ao recuperar sessionId:', error)
        alert('Erro: Sessão não inicializada. Por favor, recarregue a página.')
        return
      }
    }

    // Valida que o sessionId não mudou
    try {
      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
      if (stored && stored.trim() !== currentSessionId) {
        console.warn('⚠️ SessionId no localStorage diferente do ref. Sincronizando...')
        const correctId = stored.trim()
        sessionIdRef.current = correctId
        setSessionId(correctId)
        currentSessionId = correctId
      }
    } catch (error) {
      console.error('❌ Erro ao validar sessionId:', error)
    }

    console.log('📤 Enviando mensagem com sessionId:', currentSessionId)
    console.log('🔑 SessionId (ref):', sessionIdRef.current)
    console.log('🔑 SessionId (state):', sessionId)
    // Adiciona mensagem do usuário
    const userMessage: Message = { role: "user", type: "text", content: message }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Envia mensagem para o webhook
      const webhookUrl = import.meta.env.VITE_WEBHOOK_URL
      
      if (!webhookUrl) {
        throw new Error("VITE_WEBHOOK_URL não está configurada. Configure no arquivo .env")
      }
      
      const payload = {
        message: message,
        timestamp: new Date().toISOString(),
        id: currentSessionId, // SEMPRE usa o sessionId do ref/validado
        source: 'user',  // Identifica que é do usuário
        messageType: 'text',  // Tipo da mensagem
      }
      
      console.log('📨 Payload enviado ao webhook:', payload)
      console.log('🔑 SessionId usado no payload:', currentSessionId)
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem: ${response.status}`)
      }

      // Tenta parsear a resposta como JSON
      let responseData: any
      const contentType = response.headers.get("content-type")
      
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json()
      } else {
        // Se não for JSON, tenta como texto
        const textResponse = await response.text()
        responseData = { response: textResponse }
      }

      // Valida sessionId na resposta do webhook
      const responseSessionId = responseData.id || responseData.sessionId || responseData.session_id
      const currentSessionIdForValidation = sessionIdRef.current || currentSessionId
      
      if (responseSessionId && responseSessionId !== currentSessionIdForValidation) {
        console.log(`ℹ️ Resposta destinada à sessão ${responseSessionId}, ignorando para ${currentSessionIdForValidation}`)
        console.log(`🔍 Comparação: "${responseSessionId}" !== "${currentSessionIdForValidation}"`)
        setIsLoading(false)
        return
      }

      // Extrai a resposta do webhook
      // Tenta diferentes formatos de resposta possíveis
      const assistantContent = 
        responseData.response || 
        responseData.message || 
        responseData.text || 
        responseData.content ||
        (typeof responseData === "string" ? responseData : JSON.stringify(responseData))

      const assistantMessage: Message = {
        role: "assistant",
        type: "text",
        content: assistantContent,
      }
      if (!shouldIgnoreMessage(assistantMessage)) {
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      
      const errorMessage: Message = {
        role: "assistant",
        type: "text",
        content: error instanceof Error 
          ? `Erro ao processar sua mensagem: ${error.message}` 
          : "Erro ao processar sua mensagem. Por favor, tente novamente.",
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Scroll automático quando novas mensagens chegam
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, assistantTyping])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <ChatHeader />
      <ScrollArea className="flex-1 min-h-0">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col">
            <EmptyState />
            {assistantTyping && (
              <div className="mt-auto flex gap-2 px-4 py-6">
                <div className="h-7 w-7 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <div className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="rounded-xl bg-muted px-3 py-2">
                  <p className="text-xs sm:text-sm text-muted-foreground">Digitando...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:gap-1.5 pb-4">
            {messages.map((msg, i) => {
              const keySuffix =
                typeof msg.content === "string"
                  ? msg.content.slice(0, 10)
                  : msg.imageUrl ?? "img"
              return <ChatMessage key={`msg-${i}-${keySuffix}`} message={msg} />
            })}
            {assistantTyping && (
              <div className="flex gap-2 sm:gap-3 px-3 sm:px-4 py-4 sm:py-6">
                <div className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                  <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="rounded-xl sm:rounded-2xl bg-muted px-3 py-2 sm:px-4 sm:py-3">
                  <p className="text-xs sm:text-sm text-muted-foreground">Digitando...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      <ChatInput onSendMessage={handleSendMessage} disabled={isLoading || !sessionId} />
    </div>
  )
}

