"use client"

import { Button } from "@workspace/ui/components/button"
import { Sparkles, RefreshCw } from "lucide-react"
import { Protect } from "@clerk/nextjs"
import { UpgradeButton } from "./upgrade-button"

interface SuggestButtonProps {
  onClick: () => void
  isLoading: boolean
  size?: "icon" | "default"
  variant?: "outline" | "default"
  className?: string
}

export function SuggestButton({
  onClick,
  isLoading,
  size = "default",
  variant = "outline",
  className = ""
}: SuggestButtonProps) {
  return (
    <Protect
      feature="unlimited_assets_optimization"
      fallback={
        <UpgradeButton
          size={size}
          variant={variant}
          className={className}
        />
      }
    >
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={isLoading}
        className={`gap-2 whitespace-nowrap shrink-0 ${className}`}
      >
        {isLoading ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        {size === 'default' && (isLoading ? "Suggesting..." : "Suggest")}
      </Button>
    </Protect>
  )
}
