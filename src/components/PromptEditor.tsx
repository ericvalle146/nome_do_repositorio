import { useState, useEffect } from "react"
import { X, Save, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface PromptEditorProps {
  open: boolean
  onClose: () => void
}

export function PromptEditor({ open, onClose }: PromptEditorProps) {
  const [prompt, setPrompt] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Carrega o prompt quando o componente abre
  useEffect(() => {
    if (open) {
      loadPrompt()
    }
  }, [open])

  // Carrega o prompt da API
  const loadPrompt = async () => {
    setIsLoading(true)
    try {
      // Determina a URL da API (mesma lógica do Index.tsx)
      const getApiUrl = () => {
        if (import.meta.env.DEV) {
          return '' // Proxy do Vite em desenvolvimento
        }
        
        // Se VITE_API_URL está definido, verifica se é um nome de container Docker
        if (import.meta.env.VITE_API_URL) {
          const apiUrl = import.meta.env.VITE_API_URL
          // Se contém nome de container Docker e estamos no navegador, usa o hostname atual
          if (apiUrl.includes('versia-backend') && typeof window !== 'undefined') {
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
      
      const apiUrl = getApiUrl()
      const promptUrl = apiUrl ? `${apiUrl}/api/prompt` : '/api/prompt'
      
      const response = await fetch(promptUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPrompt(data.prompt || "")
      } else {
        // Se não existir (404) ou erro, inicia vazio
        if (response.status === 404) {
          setPrompt("")
        } else {
          console.error('Erro ao carregar prompt:', response.status, await response.text())
          setPrompt("")
        }
      }
    } catch (error) {
      console.error('Erro ao carregar prompt:', error)
      // Em caso de erro de conexão, tenta continuar com prompt vazio
      setPrompt("")
    } finally {
      setIsLoading(false)
    }
  }

  // Salva o prompt na API
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Determina a URL da API (mesma lógica do Index.tsx)
      const getApiUrl = () => {
        if (import.meta.env.DEV) {
          return '' // Proxy do Vite em desenvolvimento
        }
        
        // Se VITE_API_URL está definido, verifica se é um nome de container Docker
        if (import.meta.env.VITE_API_URL) {
          const apiUrl = import.meta.env.VITE_API_URL
          // Se contém nome de container Docker e estamos no navegador, usa o hostname atual
          if (apiUrl.includes('versia-backend') && typeof window !== 'undefined') {
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
      
      const apiUrl = getApiUrl()
      const promptUrl = apiUrl ? `${apiUrl}/api/prompt` : '/api/prompt'
      
      const response = await fetch(promptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (response.ok) {
        const data = await response.json()
        // Sucesso ao salvar
        console.log('✅ Prompt salvo com sucesso:', data)
        // Mostra feedback visual de sucesso (opcional: pode adicionar um toast aqui)
      } else {
        const errorText = await response.text()
        let errorMessage = 'Erro ao salvar prompt. Tente novamente.'
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        console.error('❌ Erro ao salvar prompt:', errorText)
        alert(errorMessage)
      }
    } catch (error) {
      console.error('❌ Erro ao salvar prompt:', error)
      alert(`Erro ao salvar prompt: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Previne fechamento ao clicar dentro do drawer
  const handleDrawerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[40%] bg-background border-l shadow-lg z-50 flex flex-col",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        onClick={handleDrawerClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Prompt</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Digite seu prompt aqui..."
                className="h-full resize-none text-sm"
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

