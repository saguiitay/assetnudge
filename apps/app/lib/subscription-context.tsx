'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { SubscriptionData } from './subscription';

interface SubscriptionContextValue {
  subscription: SubscriptionData | null;
  hasActiveSubscription: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(
  undefined
);

interface SubscriptionProviderProps {
  children: ReactNode;
  subscription: SubscriptionData | null;
  hasActiveSubscription: boolean;
}

export function SubscriptionProvider({
  children,
  subscription,
  hasActiveSubscription,
}: SubscriptionProviderProps) {
  return (
    <SubscriptionContext.Provider
      value={{ subscription, hasActiveSubscription }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
}
