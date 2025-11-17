import { Polar } from '@polar-sh/sdk';

const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? '',
});

export interface PolarProduct {
  id: string;
  name: string;
  description: string | null;
  prices: Array<{
    id: string;
    amount: number;
    currency: string;
    recurringInterval: 'month' | 'year';
  }>;
}

export async function getProducts(): Promise<PolarProduct[]> {
  try {
    const response = await polar.products.list({
      organizationId: process.env.POLAR_ORGANIZATION_ID,
    });
    
    return response.result?.items.map((product: any) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      prices: product.prices || [],
    })) || [];
  } catch (error) {
    console.error('Error fetching Polar products:', error);
    return [];
  }
}

export async function createCheckoutSession(priceId: string, userId: string) {
  try {
    // Note: Polar's checkout expects product IDs, not price IDs
    // The price is selected within the product
    const checkout = await polar.checkouts.create({
      products: [priceId], // Assuming priceId is actually a product ID
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      metadata: {
        clerkUserId: userId,
      },
    });

    return checkout;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await polar.subscriptions.get({
      id: subscriptionId,
    });
    
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

export { polar };
