"use client"

import { useState, ReactElement, ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import { Card } from "@workspace/ui/components/card"
import { Sparkles, X, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { FieldLabel } from "./field"

interface SuggestionInputProps {
  label: string | ReactElement
  value: string | any
  onChange: (value: string | any) => void
  onSuggest: (currentValue: string | any) => Promise<{text: string, rationale: string | undefined}[]>
  placeholder?: string
  variant?: "input" | "textarea" | "custom"
  rows?: number
  className?: string
  buttonSize?: "icon" | "default"
  buttonVariant?: "outline" | "default"
  renderInput?: (props: {
    value: string | any
    onChange: (value: string | any) => void
    placeholder?: string
  }) => ReactNode
  customInput?: ReactElement
}

export function SuggestionInput({
  label,
  value,
  onChange,
  onSuggest,
  placeholder,
  variant = "input",
  rows = 4,
  className,
  buttonSize = "default",
  buttonVariant = "outline",
  renderInput,
  customInput,
}: SuggestionInputProps) {
  const [suggestions, setSuggestions] = useState<{text: string, rationale: string | undefined}[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleSuggest = async () => {
    setIsLoading(true)
    try {
      const result = await onSuggest(value)
      setSuggestions(result)
    } catch (error) {
      console.error("[v0] Error generating suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion)
  }

  const handleClearSuggestions = () => {
    setSuggestions([])
    setIsExpanded(true)
  }

  const renderLabel = () => {
    if (typeof label === 'string') {
      return <FieldLabel htmlFor="suggestion-input">{label}</FieldLabel>
    }
    return label
  }

  const renderInputElement = () => {
    if (variant === "custom") {
      if (renderInput) {
        return renderInput({ value, onChange, placeholder })
      }
      if (customInput) {
        return customInput
      }
      // Fallback to input if custom is specified but no render function or element provided
      return (
        <Input
          id="suggestion-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
      )
    }
    
    if (variant === "input") {
      return (
        <Input
          id="suggestion-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
      )
    }
    
    return (
      <Textarea
        id="suggestion-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="flex-1"
      />
    )
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {label && renderLabel()}
        <div className={variant === "custom" ? "space-y-2" : "flex gap-2"}>
          {variant === "custom" ? (
            <>
              {renderInputElement()}
              <div className="flex justify-end">
                <Button 
                  type="button"
                  variant={buttonVariant}
                  size={buttonSize}
                  onClick={handleSuggest} 
                  disabled={isLoading} 
                  className={`gap-2 whitespace-nowrap ${
                    buttonSize === 'icon' ? '' : 'shrink-0'
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {buttonSize === 'default' && (isLoading ? "Suggesting..." : "Suggest")}
                </Button>
              </div>
            </>
          ) : (
            <>
              {renderInputElement()}
              <Button 
                type="button"
                variant={buttonVariant}
                size={buttonSize}
                onClick={handleSuggest} 
                disabled={isLoading} 
                className={`gap-2 whitespace-nowrap ${
                  buttonSize === 'icon' ? '' : 'shrink-0'
                }`}
              >
                {isLoading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                {buttonSize === 'default' && (isLoading ? "Suggesting..." : "Suggest")}
              </Button>
            </>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <Card className="mt-4 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-sm font-medium hover:text-foreground/80 transition-colors"
            >
              <span>Suggestions ({suggestions.length})</span>
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            <Button variant="ghost" size="sm" onClick={handleClearSuggestions} className="h-6 px-2">
              <X className="h-3 w-3" />
            </Button>
          </div>
          {isExpanded && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion.text)}
                  className="w-full text-left p-3 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {suggestion.text}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
