import { useState } from "react"
import { Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useFontSize } from "@/context/font-size-context"

export function FontSizeControl() {
  const { fontSize, setFontSize } = useFontSize()
  const [isOpen, setIsOpen] = useState(false)

  const percentage = Math.round(fontSize * 100)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:h-9 sm:w-9"
          aria-label="Ajustar tamanho da fonte"
        >
          <Type className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Tamanho da Fonte</span>
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={(value) => setFontSize(value[0])}
            min={0.75}
            max={1.5}
            step={0.05}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>75%</span>
            <span>100%</span>
            <span>150%</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

