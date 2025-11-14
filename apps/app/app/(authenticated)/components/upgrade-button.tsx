'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog';
import { PricingTable } from '@clerk/nextjs';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';

interface UpgradeButtonProps {
  size?: 'icon' | 'default' | 'sm' | 'lg';
  variant?: 'outline' | 'default' | 'secondary' | 'ghost';
  className?: string;
}

export function UpgradeButton({
  size = 'default',
  variant = 'outline',
  className = ''
}: UpgradeButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={`gap-2 whitespace-nowrap ${className}`}
        >
          <Sparkles className="h-3 w-3" />
          {size !== 'icon' && 'Upgrade'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that works best for you
          </DialogDescription>
        </DialogHeader>
        <PricingTable />
      </DialogContent>
    </Dialog>
  );
}
