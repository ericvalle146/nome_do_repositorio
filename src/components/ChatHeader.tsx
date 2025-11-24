import { useState, type FormEvent } from "react"
import { Bot, FileText, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/ThemeToggle"
import { PromptEditor } from "@/components/PromptEditor"
import { FontSizeControl } from "@/components/FontSizeControl"

const PROMPT_PASSWORD = "Versa@#345"

export function ChatHeader() {
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [passwordInput, setPasswordInput] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const handleRequestPromptEditor = () => {
    setPasswordInput("")
    setPasswordError("")
    setIsPasswordModalOpen(true)
  }

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (passwordInput === PROMPT_PASSWORD) {
      setIsPasswordModalOpen(false)
      setIsPromptEditorOpen(true)
      setPasswordInput("")
      setPasswordError("")
    } else {
      setPasswordError("Senha incorreta. Tente novamente.")
    }
  }

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
              onClick={handleRequestPromptEditor}
              className="h-8 w-8 sm:h-9 sm:w-9"
              aria-label="Abrir editor de prompt"
            >
              <FileText className="h-5 w-5" />
            </Button>
            <FontSizeControl />
            <ThemeToggle />
          </div>
        </div>
      </header>
      {isPasswordModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsPasswordModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-lg border bg-background shadow-lg">
              <div className="flex items-center gap-2 px-4 py-3 border-b">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-base font-semibold leading-none">Senha necessária</h2>
                  <p className="text-sm text-muted-foreground">Digite a senha para editar o prompt.</p>
                </div>
              </div>
              <form onSubmit={handlePasswordSubmit} className="px-4 py-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Senha
                  </label>
                  <Input
                    type="password"
                    value={passwordInput}
                    autoFocus
                    onChange={(e) => {
                      setPasswordInput(e.target.value)
                      if (passwordError) setPasswordError("")
                    }}
                    placeholder="Digite a senha"
                  />
                  {passwordError && (
                    <p className="text-sm text-destructive">{passwordError}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPasswordModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Liberar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      <PromptEditor
        open={isPromptEditorOpen}
        onClose={() => setIsPromptEditorOpen(false)}
      />
    </>
  )
}
