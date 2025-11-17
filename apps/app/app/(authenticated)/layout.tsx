import { auth, currentUser } from '@repo/auth/server';
import { SidebarProvider } from '@workspace/ui/components/sidebar';
//import { secure } from '@repo/security';
import type { ReactNode } from 'react';
import { GlobalSidebar } from './components/sidebar';
import { SubscriptionProvider } from '@/lib/subscription-context';
import { getUserSubscription, hasActiveSubscription } from '@/lib/subscription';
import { GlobalPricingDialog } from '@/components/global-pricing-dialog';

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const AppLayout = async ({ children }: AppLayoutProperties) => {
  // if (env.ARCJET_KEY) {
  //   await secure(['CATEGORY:PREVIEW']);
  // }

  const user = await currentUser();
  const { redirectToSignIn } = await auth();

  if (!user) {
    return redirectToSignIn();
  }

  // Fetch subscription status
  const subscription = await getUserSubscription(user.id);
  const hasActiveSub = await hasActiveSubscription(user.id);

  // Fetch products for pricing dialog
  const productsResponse = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/products`,
    { cache: 'no-store' }
  );
  const products = productsResponse.ok ? await productsResponse.json() : [];

  return (
    <SubscriptionProvider
      subscription={subscription}
      hasActiveSubscription={hasActiveSub}
    >
      <SidebarProvider>
        <GlobalSidebar>
          {children}
        </GlobalSidebar>
      </SidebarProvider>
      <GlobalPricingDialog products={products} />
    </SubscriptionProvider>
  );
};

export default AppLayout;
