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
import { PolarPricingTable } from '@/components/polar-pricing-table';
import { Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the plan that works best for you
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading plans...</div>
          </div>
        ) : (
          <PolarPricingTable
            products={products}
            onSelectPrice={handleSelectPrice}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
