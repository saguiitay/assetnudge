import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import type { Dictionary } from '@repo/internationalization';
import logo from '@repo/design-system/images/logo.webp';

type HeroProps = {
  dictionary: Dictionary;
};

export const Hero = async ({ dictionary }: HeroProps) => (
  <div className="w-full  py-20 lg:py-40">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-8 items-center lg:grid-cols-2">
        <div className="flex gap-4 flex-col">
          <div>
            <Badge variant="outline">We&apos;re live!</Badge>
          </div>
          <div className="flex gap-4 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-lg tracking-tighter text-left font-regular">
              Sell More Assets. Get a Data-Driven Listing Optimization in Minutes.
            </h1>
            <p className="text-xl leading-relaxed tracking-tight text-muted-foreground max-w-md text-left">
              Turn your Unity Asset Store listing into a sales magnet — analyze keywords, pricing, and copy with one click.
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <Button size="lg" className="gap-4  bg-primary hover:bg-primary/80" variant="default">
              Optimize My Asset
            </Button>
            <Button size="lg" className="gap-4 bg-secondary hover:bg-secondary/80" variant="default">
              Learn More
            </Button>
          </div>
        </div>
        <div className="bg-muted rounded-md aspect-square">
          <img src={logo.src} alt="Asset Nudge Logo" className="object-contain w-full h-full p-10" />

        </div>
      </div>
    </div>
  </div>
);
