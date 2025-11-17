import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Subscription Successful!</CardTitle>
          <CardDescription>
            Thank you for subscribing to Asset Nudge
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Your subscription is now active. You can start using all the
            features of Asset Nudge.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/optimize">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/billing">View Billing</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
