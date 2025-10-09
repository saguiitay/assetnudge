import { Button } from '@workspace/ui/components/button';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Asset } from '@repo/optimizer/src/types';

interface GenerateButtonProps {
  fieldKey: keyof Asset;
  isGenerating: boolean;
  isDisabled: boolean;
  onGenerate: (fieldKey: keyof Asset) => void;
  size?: 'icon' | 'default';
  variant?: 'outline' | 'default';
  className?: string;
}

export function GenerateButton({
  fieldKey,
  isGenerating,
  isDisabled,
  onGenerate,
  size = 'default',
  variant = 'outline',
  className = ''
}: GenerateButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => onGenerate(fieldKey)}
      disabled={isDisabled}
      className={`gap-2 whitespace-nowrap ${className}`}
    >
      {isGenerating ? (
        <RefreshCw className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {size === 'default' && (isGenerating ? 'Generating...' : 'Generate')}
    </Button>
  );
}