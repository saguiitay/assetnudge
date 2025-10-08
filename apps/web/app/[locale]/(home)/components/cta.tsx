import { Button } from '@workspace/ui/components/button';
import type { Dictionary } from '@repo/internationalization';
import { MoveRight, PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@workspace/ui/components/badge';
import { env } from '@/env';

type CTAProps = {
  dictionary: Dictionary;
};

export const CTA = ({ dictionary }: CTAProps) => (
  <div className="w-full py-20 bg-muted">
    <div className="container mx-auto">
      <div className="flex flex-col text-center py-14 gap-4 items-center">
        <div>
          <Badge>Get started</Badge>
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
            {dictionary.web.home.cta.title}
          </h3>
          <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
            {dictionary.web.home.cta.description}
          </p>
        </div>
        <div className="flex flex-row gap-4">
          <Button className="gap-4" variant="outline" asChild>
            <Link href={env.NEXT_PUBLIC_APP_URL || '#'}>
              {dictionary.web.global.primaryCta}{' '}
              <MoveRight className="h-4 w-4" />
            </Link>
          </Button>
          {dictionary.web.global.secondaryCta && (
            <Button className="gap-4" asChild>
              <Link href="#">
                {dictionary.web.global.secondaryCta}{' '}
                <MoveRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
);
