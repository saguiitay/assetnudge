import { scrapeAssetWithGraphQL } from './src/scrappers/graphql-scraper.js';

async function test() {
  try {
    console.log('Testing scraper with URL: https://assetstore.unity.com/packages/3d/vehicles/land/modular-racing-cars-low-poly-3d-models-320892');
    const result = await scrapeAssetWithGraphQL('https://assetstore.unity.com/packages/3d/vehicles/land/modular-racing-cars-low-poly-3d-models-320892');
    console.log('\nAsset data:');
    console.log('Title:', result.title);
    console.log('Favorites:', result.favorites);
    console.log('Reviews count:', result.reviews_count);
    console.log('Rating details:', result.rating);
    console.log('Publisher:', result.publisher);
    console.log('Price:', result.price);
    console.log('Category:', result.category);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

test();