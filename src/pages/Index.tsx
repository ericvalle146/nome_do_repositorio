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
  const eventSourceRef = useRef<EventSource | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    const safeDuration =
      typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs > 0
        ? durationMs
        : 2000
    clearTypingTimeout()
    typingTimeoutRef.current = setTimeout(() => {
      setAssistantTyping(false)
      typingTimeoutRef.current = null
    }, safeDuration)
  }

  // Inicializa ou recupera o ID da sessão do usuário
  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) {
      setSessionId(stored)
    } else {
      const newId = createSessionId()
      window.localStorage.setItem(SESSION_STORAGE_KEY, newId)
      setSessionId(newId)
    }
  }, [])

  // Conecta ao Server-Sent Events quando o componente monta
  useEffect(() => {
    if (!sessionId) return
    const baseUrl = `${apiUrl}/api/events`
    const separator = baseUrl.includes("?") ? "&" : "?"
    const sseUrl = `${baseUrl}${separator}id=${encodeURIComponent(sessionId)}`
    console.log('🔌 Conectando ao SSE:', sseUrl)
    
    const eventSource = new EventSource(sseUrl)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('✅ Conexão SSE estabelecida')
    }

    eventSource.onmessage = (event) => {
      try {
        console.log('📨 Mensagem SSE recebida:', event.data)
        const data = JSON.parse(event.data)
        console.log('📦 Dados parseados:', data)

        if (data.id && sessionId && data.id !== sessionId) {
          console.log(`ℹ️ Evento destinado à sessão ${data.id}, ignorando para ${sessionId}`)
          return
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
        } else if (data.type === 'typing') {
          setAssistantTyping(true)
          const durationMs =
            typeof data.duration === "number"
              ? data.duration
              : typeof data.delay === "number"
                ? data.delay * 1000
                : typeof data.delay === "string"
                  ? parseFloat(data.delay) * 1000
                  : undefined
          scheduleTypingTimeout(durationMs)
        } else {
          console.log('ℹ️ Evento desconhecido:', data)
        }
      } catch (error) {
        console.error('❌ Erro ao processar mensagem SSE:', error, event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ Erro na conexão SSE:', error, eventSource.readyState)
      // Tenta reconectar após 3 segundos se a conexão foi fechada
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('🔄 Tentando reconectar em 3 segundos...')
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            console.log('🔄 Reconectando...')
            eventSourceRef.current = new EventSource(sseUrl)
          }
        }, 3000)
      }
    }

    // Limpa a conexão quando o componente desmonta
    return () => {
      console.log('🔌 Fechando conexão SSE')
      eventSource.close()
      clearTypingTimeout()
      setAssistantTyping(false)
    }
  }, [apiUrl, sessionId])

  const handleSendMessage = async (message: string) => {
    if (!sessionId) {
      console.warn("Sessão ainda não inicializada. Tente novamente em instantes.")
      return
    }
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
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          id: sessionId,
        }),
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

      const responseSessionId = responseData.id || responseData.sessionId || responseData.session_id
      if (responseSessionId && responseSessionId !== sessionId) {
        console.log(`ℹ️ Resposta destinada à sessão ${responseSessionId}, ignorando para ${sessionId}`)
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
          <div className="flex flex-col gap-2 sm:gap-2.5 pb-4">
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

