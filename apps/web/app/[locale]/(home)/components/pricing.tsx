import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion';
import { Button } from '@workspace/ui/components/button';
import type { Dictionary } from '@repo/internationalization';
import { PhoneCall } from 'lucide-react';
import Link from 'next/link';
import { PricingTable } from '@clerk/nextjs'

type PricingProps = {
  dictionary: Dictionary;
};

export const Pricing = ({ dictionary }: PricingProps) => (
  <div className="w-full py-20">
    <div className="container mx-auto">
      <div className="flex flex-col gap-10 p-6">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
                {dictionary.web.pricing.title}
              </h4>
              <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                {dictionary.web.pricing.description}
              </p>
            </div>
          </div>
        </div>

        <PricingTable />
      </div>
    </div>
  </div>
);
