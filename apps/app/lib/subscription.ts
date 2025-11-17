import { clerkClient } from '@repo/auth/server';

export interface SubscriptionData {
  polarCustomerId: string;
  polarSubscriptionId: string;
  productId: string;
  productName: string;
  priceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: string;
  priceAmount: number;
  currency: string;
}

export async function getUserSubscription(
  userId: string
): Promise<SubscriptionData | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const subscription = user.publicMetadata?.subscription as SubscriptionData;

    if (!subscription) {
      return null;
    }

    return subscription;
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: SubscriptionData | null
): Promise<void> {
  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        subscription: subscriptionData,
      },
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return false;
  }

  // Check if subscription is active or trialing
  if (subscription.status !== 'active' && subscription.status !== 'trialing') {
    return false;
  }

  // Check if subscription hasn't expired
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
  const now = new Date();

  return currentPeriodEnd > now;
}

export async function clearUserSubscription(userId: string): Promise<void> {
  await updateUserSubscription(userId, null);
}
