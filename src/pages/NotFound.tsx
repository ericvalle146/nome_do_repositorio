import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center px-4 py-8">
      <div className="text-center space-y-3 sm:space-y-4 max-w-md">
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <Button asChild className="mt-4 sm:mt-6 w-full sm:w-auto">
          <Link to="/" className="flex items-center justify-center">
            <Home className="mr-2 h-4 w-4" />
            Voltar para o início
          </Link>
        </Button>
      </div>
    </div>
  )
}

