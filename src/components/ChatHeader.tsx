import { useState } from "react"
import { Bot, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PromptEditor } from "@/components/PromptEditor"

export function ChatHeader() {
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-12 sm:h-14 items-center justify-between px-2.5 sm:px-3.5">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-foreground truncate">VERSIA</h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Assistente e-SUS APS</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPromptEditorOpen(true)}
              className="h-8 w-8 sm:h-9 sm:w-9"
              aria-label="Abrir editor de prompt"
            >
              <FileText className="h-5 w-5" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <PromptEditor
        open={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
      />
    </>
  )
}

