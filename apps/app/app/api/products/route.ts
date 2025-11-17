import { getProducts } from '@/lib/polar';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const products = await getProducts();

    // Add features manually for now (can be stored in DB or Polar metadata later)
    const productsWithFeatures = products.map((product) => {
      let features: string[] = [];
      let popular = false;

      // Customize features based on product name
      if (product.name.toLowerCase().includes('pro')) {
        features = [
          'Unlimited asset optimization',
          'AI-powered suggestions',
          'Priority support',
          'Advanced analytics',
        ];
        popular = true;
      } else if (product.name.toLowerCase().includes('basic')) {
        features = [
          '100 asset optimizations/month',
          'Basic AI suggestions',
          'Email support',
        ];
      } else if (product.name.toLowerCase().includes('enterprise')) {
        features = [
          'Unlimited everything',
          'Dedicated support',
          'Custom integrations',
          'SLA guarantee',
        ];
      }

      return {
        ...product,
        features,
        popular,
      };
    });

    return NextResponse.json(productsWithFeatures);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
