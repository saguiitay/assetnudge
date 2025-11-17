'use client';

import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface PolarPrice {
  id: string;
  amount: number;
  currency: string;
  recurringInterval: 'month' | 'year';
}

interface PolarProduct {
  id: string;
  name: string;
  description: string | null;
  prices: PolarPrice[];
  features?: string[];
  popular?: boolean;
}

interface PolarPricingTableProps {
  products: PolarProduct[];
  onSelectPrice: (priceId: string) => Promise<void>;
}

export function PolarPricingTable({
  products,
  onSelectPrice,
}: PolarPricingTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (priceId: string) => {
    setLoading(priceId);
    try {
      await onSelectPrice(priceId);
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <Card
          key={product.id}
          className={product.popular ? 'border-primary shadow-lg' : ''}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{product.name}</CardTitle>
              {product.popular && (
                <Badge variant="default">Popular</Badge>
              )}
            </div>
            {product.description && (
              <CardDescription>{product.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {product.prices.map((price) => (
              <div key={price.id} className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    {formatPrice(price.amount, price.currency)}
                  </span>
                  <span className="text-muted-foreground">
                    /{price.recurringInterval}
                  </span>
                </div>
              </div>
            ))}
            {product.features && product.features.length > 0 && (
              <ul className="mt-4 space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter>
            {product.prices.map((price) => (
              <Button
                key={price.id}
                className="w-full"
                variant={product.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(price.id)}
                disabled={loading !== null}
              >
                {loading === price.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            ))}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
