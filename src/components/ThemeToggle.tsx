import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/context/theme-context"

export function ThemeToggle() {
  const { effectiveTheme, toggleTheme } = useTheme()
  const isDark = effectiveTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar tema"
      onClick={toggleTheme}
      className="h-8 w-8 sm:h-9 sm:w-9"
    >
      {isDark ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  )
}

