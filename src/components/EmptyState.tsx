import {
  HelpCircle,
  BookOpen,
  Settings,
  FileText,
  Database,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const suggestions = [
  {
    icon: HelpCircle,
    title: "Como configurar o e-SUS APS?",
    description: "Aprenda os passos iniciais para configurar o sistema",
  },
  {
    icon: BookOpen,
    title: "Manual do Sistema",
    description: "Acesse a documentação completa do e-SUS APS",
  },
  {
    icon: Settings,
    title: "Configurações Avançadas",
    description: "Personalize o sistema conforme suas necessidades",
  },
  {
    icon: FileText,
    title: "Relatórios e Exportações",
    description: "Gere relatórios e exporte dados do sistema",
  },
  {
    icon: Database,
    title: "Backup e Restauração",
    description: "Proteja seus dados com backups regulares",
  },
  {
    icon: Users,
    title: "Gestão de Usuários",
    description: "Configure permissões e acessos dos usuários",
  },
]

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[45vh] sm:min-h-[55vh] px-2.5 sm:px-3.5 py-6 sm:py-9">
      <div className="mb-5 sm:mb-6 text-center px-2">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-1.5">
          Olá! Como posso ajudar?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Faça perguntas sobre o e-SUS APS ou escolha uma das opções abaixo
        </p>
      </div>

      <div className="grid gap-2.5 sm:gap-3.5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full max-w-3xl">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon
          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-2.5 sm:gap-3.5 rounded-lg sm:rounded-xl border bg-card p-2.5 sm:p-3.5",
                "transition-colors hover:bg-accent/50 cursor-default"
              )}
            >
              <div className="mt-0.5 sm:mt-0.5 shrink-0">
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[11px] sm:text-sm text-card-foreground mb-0.5 sm:mb-1 leading-tight">
                  {suggestion.title}
                </h3>
                <p className="text-[10px] xs:text-[11px] text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

