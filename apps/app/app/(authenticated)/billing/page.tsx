'use client';

import { useSubscription } from '@/lib/subscription-context';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Header } from '../components/header';
import Link from 'next/link';

export default function BillingPage() {
  const { subscription, hasActiveSubscription } = useSubscription();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: 'Active' },
      trialing: { variant: 'secondary', label: 'Trial' },
      canceled: { variant: 'destructive', label: 'Canceled' },
      past_due: { variant: 'destructive', label: 'Past Due' },
      incomplete: { variant: 'outline', label: 'Incomplete' },
    };

    const statusInfo = statusMap[status] || { variant: 'outline', label: status };

    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header pages={['Settings']} page="Billing" />

      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        {hasActiveSubscription && subscription ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Plan</CardTitle>
                {getStatusBadge(subscription.status)}
              </div>
              <CardDescription>
                Your subscription details and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Plan
                  </p>
                  <p className="text-lg font-semibold">
                    {subscription.productName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Price
                  </p>
                  <p className="text-lg font-semibold">
                    {formatPrice(subscription.priceAmount, subscription.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Current Period Ends
                  </p>
                  <p className="text-lg font-semibold">
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <p className="text-lg font-semibold capitalize">
                    {subscription.status}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button asChild>
                  <a
                    href={`https://polar.sh/subscriptions/${subscription.polarSubscriptionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manage Subscription
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                You don't have an active subscription yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/optimize">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
