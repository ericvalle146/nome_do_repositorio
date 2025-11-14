import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from "react"

interface FontSizeContextValue {
  fontSize: number
  setFontSize: (size: number) => void
}

const FontSizeContext = createContext<FontSizeContextValue | undefined>(undefined)

const FONT_SIZE_STORAGE_KEY = "versia-font-size"
const MIN_FONT_SIZE = 0.75 // 75% do tamanho base
const MAX_FONT_SIZE = 1.5 // 150% do tamanho base
const DEFAULT_FONT_SIZE = 1.0 // 100% (tamanho base)

function getInitialFontSize(): number {
  if (typeof window === "undefined") return DEFAULT_FONT_SIZE

  const stored = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY)
  if (stored) {
    const parsed = parseFloat(stored)
    if (!isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
      return parsed
    }
  }

  return DEFAULT_FONT_SIZE
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<number>(getInitialFontSize)

  useEffect(() => {
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize.toString())
  }, [fontSize])

  const setFontSize = (size: number) => {
    const clampedSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, size))
    setFontSizeState(clampedSize)
  }

  const value = useMemo(
    () => ({
      fontSize,
      setFontSize,
    }),
    [fontSize]
  )

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>
}

export function useFontSize() {
  const context = useContext(FontSizeContext)
  if (!context) {
    throw new Error("useFontSize must be used within a FontSizeProvider")
  }
  return context
}

