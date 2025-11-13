import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  effectiveTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const THEME_STORAGE_KEY = "versia-theme"

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored
  }

  return "dark"
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const finalTheme = theme === "system" ? getSystemTheme() : theme

  root.classList.remove("light", "dark")
  root.classList.add(finalTheme)

  const colorScheme = finalTheme === "dark" ? "dark" : "light"
  root.style.colorScheme = colorScheme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(getSystemTheme)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (event: MediaQueryListEvent) => {
      const nextSystemTheme = event.matches ? "dark" : "light"
      setSystemTheme(nextSystemTheme)
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
    } else {
      // Safari < 14
      mediaQuery.addListener(handler)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler)
      } else {
        mediaQuery.removeListener(handler)
      }
    }
  }, [])

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme, systemTheme])

  const effectiveTheme = useMemo<"light" | "dark">(() => {
    if (theme === "system") return systemTheme
    return theme
  }, [theme, systemTheme])

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme)
  }

  const toggleTheme = () => {
    setThemeState((prev) => {
      const current = prev === "system" ? systemTheme : prev
      if (current === "dark") return "light"
      return "dark"
    })
  }

  const value = useMemo(
    () => ({
      theme,
      effectiveTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, effectiveTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

