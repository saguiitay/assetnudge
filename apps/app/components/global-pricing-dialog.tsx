'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { PolarPricingTable } from './polar-pricing-table';
import { useSubscription } from '@/lib/subscription-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PolarProduct {
  id: string;
  name: string;
  description: string | null;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    recurringInterval: 'month' | 'year';
  }>;
  features?: string[];
  popular?: boolean;
}

interface GlobalPricingDialogProps {
  products: PolarProduct[];
}

export function GlobalPricingDialog({ products }: GlobalPricingDialogProps) {
  const { hasActiveSubscription } = useSubscription();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show dialog if user doesn't have active subscription
    // Check localStorage to avoid showing on every navigation in same session
    const dismissed = sessionStorage.getItem('pricing-dialog-dismissed');
    
    if (!hasActiveSubscription && !dismissed) {
      setOpen(true);
    }
  }, [hasActiveSubscription]);

  const handleSelectPrice = async (priceId: string) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        // Redirect to Polar checkout
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !hasActiveSubscription) {
      // Allow temporary dismissal but mark it
      sessionStorage.setItem('pricing-dialog-dismissed', 'true');
      setOpen(false);
    } else {
      setOpen(newOpen);
    }
  };

  // Don't render if user has subscription
  if (hasActiveSubscription) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select a plan to start using Asset Nudge
          </DialogDescription>
        </DialogHeader>
        <PolarPricingTable
          products={products}
          onSelectPrice={handleSelectPrice}
        />
      </DialogContent>
    </Dialog>
  );
}
