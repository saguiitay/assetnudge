import type { Dictionary } from '@repo/internationalization';
import { Icon, User } from 'lucide-react';

import { Card, CardContent } from "@workspace/ui/components/card"
import { ChartLine, FileText, DollarSign, ChevronRight } from "lucide-react"

type FeaturesProps = {
  dictionary: Dictionary;
};

export default function FeatureCards({ dictionary }: FeaturesProps) {
  return (
    <div className="container mx-auto">
      <div className="w-full py-20 lg:py-20" id="features" >
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {dictionary.web.home.features.items.map((f, i) => (
            <div key={i} className="text-center p-6">
              <div className="flex flex-col items-center text-center">
                {f.icon === "ChartLine" && <ChartLine className="h-10 w-10 mb-4" />}
                {f.icon === "FileText" && <FileText className="h-10 w-10 mb-4" />}
                {f.icon === "DollarSign" && <DollarSign className="h-10 w-10 mb-4" />}

                <h2 className="max-w-xl font-regular text-2xl tracking-tighter md:text-3xl">
                  {f.title}
                </h2>
                <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
                  {f.description}
                </p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}


export const Features = ({ dictionary }: FeaturesProps) => (
  <div className="w-full py-20 lg:py-40" id="features" >
    <div className="container mx-auto">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col items-start gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="max-w-xl text-left font-regular text-3xl tracking-tighter md:text-5xl">
              {dictionary.web.home.features.title}
            </h2>
            <p className="max-w-xl text-left text-lg text-muted-foreground leading-relaxed tracking-tight lg:max-w-lg">
              {dictionary.web.home.features.description}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex aspect-square h-full flex-col justify-between rounded-md bg-muted p-6 lg:col-span-2 lg:aspect-auto">
            <User className="h-8 w-8 stroke-1" />
            <div className="flex flex-col">
              <h3 className="text-xl tracking-tight">
                {dictionary.web.home.features.items[0]?.title}
              </h3>
              <p className="max-w-xs text-base text-muted-foreground">
                {dictionary.web.home.features.items[0]?.description}
              </p>
            </div>
          </div>
          <div className="flex aspect-square flex-col justify-between rounded-md bg-muted p-6">
            <User className="h-8 w-8 stroke-1" />
            <div className="flex flex-col">
              <h3 className="text-xl tracking-tight">
                {dictionary.web.home.features.items[1]?.title}
              </h3>
              <p className="max-w-xs text-base text-muted-foreground">
                {dictionary.web.home.features.items[1]?.description}
              </p>
            </div>
          </div>

          <div className="flex aspect-square flex-col justify-between rounded-md bg-muted p-6">
            <User className="h-8 w-8 stroke-1" />
            <div className="flex flex-col">
              <h3 className="text-xl tracking-tight">
                {dictionary.web.home.features.items[2]?.title}
              </h3>
              <p className="max-w-xs text-base text-muted-foreground">
                {dictionary.web.home.features.items[2]?.description}
              </p>
            </div>
          </div>
          <div className="flex aspect-square h-full flex-col justify-between rounded-md bg-muted p-6 lg:col-span-2 lg:aspect-auto">
            <User className="h-8 w-8 stroke-1" />
            <div className="flex flex-col">
              <h3 className="text-xl tracking-tight">
                {dictionary.web.home.features.items[3]?.title}
              </h3>
              <p className="max-w-xs text-base text-muted-foreground">
                {dictionary.web.home.features.items[3]?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
