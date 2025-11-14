import { useState } from "react"
import { X, Copy, Check } from "lucide-react"
import { Bot, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFontSize } from "@/context/font-size-context"

export type MessageType = "text" | "image"

export interface Message {
  role: "user" | "assistant"
  type?: MessageType
  content?: string
  imageUrl?: string
  imageAlt?: string
  id?: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const isImage = Boolean(message.imageUrl)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { fontSize } = useFontSize()
  
  // Calcula o tamanho da fonte em rem baseado no multiplicador
  // text-sm = 0.875rem (mobile), text-base = 1rem (desktop)
  const baseTextSize = 0.875 // text-sm base
  const textSize = baseTextSize * fontSize

  const handleCopy = async () => {
    const textToCopy = message.content || message.imageUrl || ""
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erro ao copiar:", error)
      // Fallback para navegadores mais antigos
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      textArea.style.position = "fixed"
      textArea.style.opacity = "0"
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Erro ao copiar (fallback):", err)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <div
      className={cn(
        "flex gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0">
        <AvatarFallback className={cn(isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
          {isUser ? (
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          ) : (
            <Bot className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          )}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex gap-1.5 sm:gap-2 items-start max-w-[82%] xs:max-w-[78%] sm:max-w-[70%] md:max-w-[65%] group",
          isUser && "flex-row-reverse"
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-1 sm:gap-1.5 flex-1",
            isUser && "items-end"
          )}
        >
          <div
            className={cn(
              "rounded-xl sm:rounded-2xl overflow-hidden",
              isImage ? "p-0" : "px-2.5 py-1.5 sm:px-3 sm:py-2",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            )}
          >
            {isImage ? (
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <img
                    src={message.imageUrl}
                    alt={message.imageAlt || "Imagem enviada"}
                    className="h-auto w-full max-h-[200px] sm:max-h-[225px] object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.015]"
                    loading="lazy"
                  />
                </button>
                {message.content && (
                  <p 
                    className="px-2.5 py-1.5 leading-relaxed"
                    style={{ fontSize: `${textSize}rem` }}
                  >
                    {message.content}
                  </p>
                )}
              </div>
            ) : (
              <p 
                className="whitespace-pre-wrap break-words leading-relaxed"
                style={{ fontSize: `${textSize}rem` }}
              >
                {message.content}
              </p>
            )}
          </div>
        </div>
        {/* Botão de copiar - aparece em hover ao lado da mensagem */}
        {(message.content || message.imageUrl) && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              "h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
              "bg-background/90 hover:bg-background border border-border shadow-sm rounded-md",
              copied && "opacity-100"
            )}
            aria-label="Copiar mensagem"
          >
            {copied ? (
              <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </Button>
        )}
      </div>
      {isImage && isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-3xl flex-col items-center gap-3 rounded-2xl bg-background p-3.5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2.5 top-2.5"
              onClick={() => setIsPreviewOpen(false)}
              aria-label="Fechar visualização"
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={message.imageUrl}
              alt={message.imageAlt || "Imagem enviada"}
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
            <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              {message.content && (
                <p 
                  className="text-muted-foreground sm:max-w-[70%]"
                  style={{ fontSize: `${textSize}rem` }}
                >
                  {message.content}
                </p>
              )}
              <div className="flex items-center gap-2 sm:justify-end">
                <Button asChild variant="outline" className="h-8 px-3 text-xs sm:text-sm">
                  <a href={message.imageUrl} download target="_blank" rel="noreferrer">
                    Baixar imagem
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsPreviewOpen(false)}
                  className="h-8 px-3 text-xs sm:text-sm"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

