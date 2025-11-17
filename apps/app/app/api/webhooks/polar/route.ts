import { updateUserSubscription, clearUserSubscription } from '@/lib/subscription';
import { polar } from '@/lib/polar';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('webhook-signature') || '';
    const secret = process.env.POLAR_WEBHOOK_SECRET || '';
    
    const rawBody = await req.text();
    
    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    
    const eventType = event.type;

    switch (eventType) {
      case 'checkout.created':
      case 'checkout.updated':
        // Handle checkout completion
        if (event.data.status === 'succeeded') {
          const clerkUserId = event.data.metadata?.clerkUserId;
          const subscriptionId = event.data.subscription_id;
          
          if (clerkUserId && subscriptionId) {
            // Fetch full subscription details
            const subscription = await polar.subscriptions.get({
              id: subscriptionId,
            });

            if (subscription) {
              // Get first price from prices array
              const firstPrice = subscription.prices?.[0];
              const priceAmount = (firstPrice as any)?.priceAmount || 0;
              const priceCurrency = (firstPrice as any)?.priceCurrency || 'usd';
              
              await updateUserSubscription(clerkUserId, {
                polarCustomerId: subscription.customerId || '',
                polarSubscriptionId: subscription.id,
                productId: subscription.productId,
                productName: subscription.product?.name || 'Unknown',
                priceId: (firstPrice as any)?.id || '',
                status: subscription.status as any,
                currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || new Date().toISOString(),
                priceAmount,
                currency: priceCurrency,
              });
            }
          }
        }
        break;

      case 'subscription.created':
      case 'subscription.updated':
        // Update subscription status
        const clerkUserId = event.data.metadata?.clerkUserId;
        const subscription = event.data;
        
        if (clerkUserId) {
          await updateUserSubscription(clerkUserId, {
            polarCustomerId: subscription.customer_id || '',
            polarSubscriptionId: subscription.id,
            productId: subscription.product_id,
            productName: subscription.product?.name || 'Unknown',
            priceId: subscription.price_id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            priceAmount: subscription.price?.price_amount || 0,
            currency: subscription.price?.price_currency || 'usd',
          });
        }
        break;

      case 'subscription.canceled':
      case 'subscription.revoked':
        // Clear subscription
        const canceledClerkUserId = event.data.metadata?.clerkUserId;
        
        if (canceledClerkUserId) {
          await clearUserSubscription(canceledClerkUserId);
        }
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
