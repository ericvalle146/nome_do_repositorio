import { useState, useRef, KeyboardEvent, useEffect, useCallback } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const shouldFocusRef = useRef(false)

  // Função auxiliar para focar o textarea de forma mais agressiva
  const focusTextarea = useCallback(() => {
    if (disabled) return
    
    // Tenta múltiplas abordagens para garantir o foco
    const focusElement = () => {
      const element = textareaRef.current
      if (element && !element.disabled) {
        try {
          element.focus()
          // Seleciona o cursor no final do texto
          const length = element.value.length
          element.setSelectionRange(length, length)
        } catch (error) {
          // Ignora erros de foco (pode acontecer em alguns casos)
          console.debug('Erro ao focar textarea:', error)
        }
      }
    }

    // Tenta focar imediatamente
    focusElement()
    
    // Tenta novamente após um frame
    requestAnimationFrame(() => {
      focusElement()
      // E mais uma vez após um pequeno delay para garantir
      setTimeout(focusElement, 50)
    })
  }, [disabled])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      const messageToSend = message.trim()
      onSendMessage(messageToSend)
      setMessage("")
      shouldFocusRef.current = true
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && !disabled) {
        const messageToSend = message.trim()
        onSendMessage(messageToSend)
        setMessage("")
        shouldFocusRef.current = true
      }
    }
  }

  const handleClearClick = () => {
    if (disabled) return
    // Envia "Limpar histórico" automaticamente
    onSendMessage("Limpar histórico")
    setMessage("")
    shouldFocusRef.current = true
  }

  // Foca o textarea quando a mensagem é limpa após envio
  useEffect(() => {
    if (shouldFocusRef.current && message === "" && !disabled) {
      shouldFocusRef.current = false
      // Usa um pequeno delay para garantir que o estado foi atualizado
      const timer = setTimeout(() => {
        focusTextarea()
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [message, disabled, focusTextarea])

  // Foca o textarea quando o componente monta pela primeira vez
  useEffect(() => {
    if (!disabled) {
      const timer = setTimeout(() => {
        focusTextarea()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [disabled, focusTextarea])

  return (
    <div className="border-t bg-background safe-area-inset-bottom">
      <div className="container mx-auto px-2.5 sm:px-3.5 py-2.5 sm:py-3.5">
        <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-1.5">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua dúvida sobre o e-SUS APS..."
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="min-h-[48px] sm:min-h-[52px] pr-32 sm:pr-36 resize-none text-sm sm:text-base"
              rows={1}
            />
            <div className="absolute right-1 sm:right-1.5 bottom-1 sm:bottom-1.5 flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={handleClearClick}
                className={cn(
                  "h-7 px-2.5 sm:h-8 sm:px-3 rounded-full text-xs sm:text-sm font-medium",
                  "border-border bg-background hover:bg-muted",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                onMouseDown={(e) => {
                  e.preventDefault()
                }}
              >
                Limpar histórico
              </Button>
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || disabled}
                className={cn(
                  "h-7 w-7 sm:h-8 sm:w-8",
                  !message.trim() && "opacity-50"
                )}
                onMouseDown={(e) => {
                  // Previne que o botão roube o foco do textarea
                  e.preventDefault()
                }}
                onClick={(e) => {
                  // Garante que o foco volte para o textarea após clicar
                  e.preventDefault()
                  if (message.trim() && !disabled) {
                    handleSubmit(e as any)
                  }
                }}
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center px-2">
            Desenvolvido por Versa Tecnologia
          </p>
        </form>
      </div>
    </div>
  )
}



