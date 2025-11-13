import { useState, KeyboardEvent } from "react"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSendMessage(message.trim())
      setMessage("")
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (message.trim() && !disabled) {
        onSendMessage(message.trim())
        setMessage("")
      }
    }
  }

  return (
    <div className="border-t bg-background safe-area-inset-bottom">
      <div className="container mx-auto px-2.5 sm:px-3.5 py-2.5 sm:py-3.5">
        <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-1.5">
          <div className="relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua dúvida sobre o e-SUS APS..."
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="min-h-[48px] sm:min-h-[52px] pr-10 sm:pr-11 resize-none text-sm sm:text-base"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!message.trim() || disabled}
              className={cn(
                "absolute right-1 sm:right-1.5 bottom-1 sm:bottom-1.5 h-7 w-7 sm:h-8 sm:w-8",
                !message.trim() && "opacity-50"
              )}
            >
              <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
          <p className="text-[10px] xs:text-[11px] text-muted-foreground text-center px-2">
            Desenvolvido por Versa Tecnologia
          </p>
        </form>
      </div>
    </div>
  )
}

