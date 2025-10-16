"use client"

import { useState, ReactElement, ReactNode } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Label } from "@workspace/ui/components/label"
import { Card } from "@workspace/ui/components/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { Badge } from "@workspace/ui/components/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip"
import { Sparkles, X, ChevronDown, ChevronUp, RefreshCw, Info } from "lucide-react"
import { FieldLabel } from "./field"

type SuggestionLayoutVariant = "list" | "grid" | "tabs" | "compact"

interface SuggestionInputProps {
  label: string | ReactElement
  value: string | any
  onChange: (value: string | any) => void
  onSuggest: (currentValue: string | any) => Promise<{text: string, rationale: string | undefined}[]>
  onSuggestionSelect?: (suggestion: string) => void
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
  // New suggestion layout customization props
  suggestionLayout?: SuggestionLayoutVariant
  suggestionGridCols?: number
  renderSuggestion?: (suggestion: {text: string, rationale: string | undefined}, index: number) => ReactNode
  // New prop for HTML content support
  enableHtmlContent?: boolean
}

export function SuggestionInput({
  label,
  value,
  onChange,
  onSuggest,
  onSuggestionSelect,
  placeholder,
  variant = "input",
  rows = 4,
  className,
  buttonSize = "default",
  buttonVariant = "outline",
  renderInput,
  customInput,
  suggestionLayout = "list",
  suggestionGridCols = 2,
  renderSuggestion,
  enableHtmlContent = false,
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
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion)
    } else {
      onChange(suggestion)
    }
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

  const renderSuggestionContent = () => {
    if (suggestionLayout === "grid") {
      const gridColsClass = suggestionGridCols === 3 ? "grid-cols-3" : 
                          suggestionGridCols === 4 ? "grid-cols-4" : 
                          "grid-cols-2";
      
      return (
        <div className={`grid gap-2 mt-4 ${gridColsClass}`}>
          {suggestions.map((suggestion, index) => (
            renderSuggestion ? renderSuggestion(suggestion, index) : (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion.text)}
                className="text-left p-2 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors text-sm"
              >
                {enableHtmlContent ? (
                  <div dangerouslySetInnerHTML={{ __html: suggestion.text }} />
                ) : (
                  suggestion.text
                )}
              </button>
            )
          ))}
        </div>
      )
    }

    if (suggestionLayout === "compact") {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
          {suggestions.map((suggestion, index) => (
            renderSuggestion ? renderSuggestion(suggestion, index) : (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => handleSelectSuggestion(suggestion.text)}
              >
                {enableHtmlContent ? (
                  <span dangerouslySetInnerHTML={{ __html: suggestion.text }} />
                ) : (
                  suggestion.text
                )}
              </Badge>
            )
          ))}
        </div>
      )
    }

    if (suggestionLayout === "tabs") {
      // Auto-generate numbered tab categories
      const tabCategories = suggestions.map((_, index) => `Suggestion ${index + 1}`);
      
      // Each suggestion gets its own tab
      const groupedSuggestions = tabCategories.reduce((acc, category, categoryIndex) => {
        acc[category] = suggestions[categoryIndex] ? [suggestions[categoryIndex]] : [];
        return acc;
      }, {} as Record<string, typeof suggestions>)

      return (
        <Tabs defaultValue={tabCategories[0]} className="mt-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabCategories.length}, 1fr)` }}>
            {tabCategories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabCategories.map((category) => (
            <TabsContent key={category} value={category} className="space-y-2 mt-4">
              {groupedSuggestions[category]?.map((suggestion, index) => (
                renderSuggestion ? renderSuggestion(suggestion, index) : (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion.text)}
                    className="w-full text-left p-3 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="font-medium">
                      {enableHtmlContent ? (
                        <div dangerouslySetInnerHTML={{ __html: suggestion.text }} />
                      ) : (
                        suggestion.text
                      )}
                    </div>
                    {suggestion.rationale && (
                      <div className="text-sm text-muted-foreground mt-1">{suggestion.rationale}</div>
                    )}
                  </button>
                )
              ))}
            </TabsContent>
          ))}
        </Tabs>
      )
    }

    // Default list layout
    return (
      <div className="space-y-2 mt-4">
        {suggestions.map((suggestion, index) => (
          renderSuggestion ? renderSuggestion(suggestion, index) : (
            <button
              key={index}
              onClick={() => handleSelectSuggestion(suggestion.text)}
              className="w-full text-left p-3 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium flex-1">
                  {enableHtmlContent ? (
                    <div dangerouslySetInnerHTML={{ __html: suggestion.text }} />
                  ) : (
                    suggestion.text
                  )}
                </div>
                {suggestion.rationale && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="h-3 w-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{suggestion.rationale}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </button>
          )
        ))}
      </div>
    )
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
        <div className="flex gap-2 items-start">
          <div className="flex-1">
            {renderInputElement()}
          </div>
          <Button 
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            onClick={handleSuggest} 
            disabled={isLoading} 
            className={`gap-2 whitespace-nowrap shrink-0 ${variant === "custom" ? "mt-0" : ""}`}
          >
            {isLoading ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {buttonSize === 'default' && (isLoading ? "Suggesting..." : "Suggest")}
          </Button>
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
          {isExpanded && renderSuggestionContent()}
        </Card>
      )}
    </div>
  )
}
