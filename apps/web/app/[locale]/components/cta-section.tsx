import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type CTASectionProps = {
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
  className?: string;
};

export const CTASection = ({ 
  title, 
  description, 
  linkText, 
  linkHref, 
  className = "" 
}: CTASectionProps) => {
  return (
    <div className={`p-8 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-lg border ${className}`}>
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-3">{title}</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          {description}
        </p>
        <Link href={linkHref} rel="nofollow" className="inline-flex items-center gap-2 text-primary font-semibold hover:underline">
          {linkText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};