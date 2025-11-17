# Polar Integration

This document describes the Polar billing integration for Asset Nudge.

## Overview

The integration replaces Clerk's billing system with Polar, while storing subscription data in Clerk's user metadata.

## Features

- **Global Pricing Dialog**: Automatically shows to users without an active subscription
- **Polar Checkout**: Seamless checkout experience via Polar's hosted checkout
- **Clerk Metadata Storage**: Subscription details stored in Clerk user metadata for easy access
- **Webhook Integration**: Automatic subscription updates via Polar webhooks
- **Billing Management**: Users can view and manage their subscriptions

## Architecture

```
User → Pricing Dialog → Polar Checkout → Webhook → Update Clerk Metadata → App Access
```

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Polar Configuration
POLAR_ACCESS_TOKEN="polar_oat_YOUR_ACCESS_TOKEN"
POLAR_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
POLAR_ORGANIZATION_ID="your-polar-organization-id"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### 2. Polar Setup

1. Create a Polar account at https://polar.sh
2. Create products and pricing in Polar dashboard
3. Get your Access Token from Settings → API
4. Get your Organization ID from your Polar dashboard URL
5. Set up webhook endpoint: `https://your-domain.com/api/webhooks/polar`
6. Copy the webhook secret

### 3. Webhook Events

The integration handles these Polar webhook events:

- `checkout.created` / `checkout.updated` - Initial subscription creation
- `subscription.created` / `subscription.updated` - Subscription updates
- `subscription.canceled` / `subscription.revoked` - Subscription cancellations

## Files Structure

```
apps/app/
├── lib/
│   ├── polar.ts                    # Polar client & API methods
│   ├── subscription.ts              # Clerk metadata helpers
│   └── subscription-context.tsx     # React context for subscription state
├── components/
│   ├── polar-pricing-table.tsx      # Pricing table component
│   └── global-pricing-dialog.tsx    # Auto-popup pricing dialog
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts            # Create checkout session
│   │   ├── products/
│   │   │   └── route.ts            # Fetch Polar products
│   │   └── webhooks/
│   │       └── polar/
│   │           └── route.ts         # Webhook handler
│   └── (authenticated)/
│       ├── billing/
│       │   ├── page.tsx             # Billing management page
│       │   └── success/
│       │       └── page.tsx         # Success page after checkout
│       ├── layout.tsx               # Added SubscriptionProvider & dialog
│       └── components/
│           └── upgrade-button.tsx   # Updated to use Polar
```

## Usage

### Checking Subscription Status

```typescript
import { useSubscription } from '@/lib/subscription-context';

function MyComponent() {
  const { subscription, hasActiveSubscription } = useSubscription();
  
  if (!hasActiveSubscription) {
    return <div>Please subscribe to access this feature</div>;
  }
  
  return <div>Welcome, {subscription?.productName} member!</div>;
}
```

### Server-Side Subscription Check

```typescript
import { hasActiveSubscription, getUserSubscription } from '@/lib/subscription';
import { auth } from '@repo/auth/server';

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return redirect('/sign-in');
  }
  
  const isActive = await hasActiveSubscription(userId);
  
  if (!isActive) {
    return redirect('/billing');
  }
  
  // Rest of your page
}
```

## Subscription Data Structure

Stored in Clerk `publicMetadata.subscription`:

```typescript
{
  polarCustomerId: string;
  polarSubscriptionId: string;
  productId: string;
  productName: string;
  priceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: string; // ISO date
  priceAmount: number;
  currency: string;
}
```

## Testing

### Local Testing with Webhooks

1. Install ngrok: `npm install -g ngrok`
2. Start your app: `npm run dev`
3. Create tunnel: `ngrok http 3001`
4. Update Polar webhook URL to ngrok URL: `https://xxx.ngrok.io/api/webhooks/polar`
5. Test checkout flow

### Test Mode

Polar provides test mode for safe testing without real charges. Enable it in your Polar dashboard.

## Security

- Webhook signatures are verified using HMAC SHA256
- All subscription updates use server-side Clerk Admin API
- Sensitive tokens stored only in server environment variables
- Client-side components only receive necessary subscription data

## Troubleshooting

### Webhook Not Firing

- Verify webhook URL is publicly accessible
- Check webhook secret matches environment variable
- Check Polar webhook logs for errors

### Subscription Not Updating

- Verify webhook signature verification is passing
- Check server logs for webhook processing errors
- Ensure Clerk user ID is passed in checkout metadata

### Dialog Keeps Showing

- Check if subscription status is actually active
- Verify `currentPeriodEnd` hasn't expired
- Clear sessionStorage: `sessionStorage.removeItem('pricing-dialog-dismissed')`

## Migration from Clerk Billing

The integration replaces:
- `<PricingTable />` → `<PolarPricingTable />`
- Clerk subscriptions → Polar subscriptions
- Clerk billing webhooks → Polar webhooks

User metadata is migrated automatically through the checkout flow.
