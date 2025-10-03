/**
 * Test the GraphQL scraper through the API endpoint
 */

const apiUrl = 'http://localhost:3002';
const testUrl = 'https://assetstore.unity.com/packages/tools/game-toolkits/simple-memory-game-template-192384';

console.log('Testing GraphQL scraper through API endpoint...');

try {
  const response = await fetch(`${apiUrl}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      url: testUrl,
      method: 'graphql',
      debug: true
    }),
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Success! Asset scraped via GraphQL API:');
    console.log(`Title: ${result.asset.title}`);
    console.log(`Category: ${result.asset.category}`);
    console.log(`Price: $${result.asset.price}`);
    console.log(`Tags: ${result.asset.tags.join(', ')}`);
    console.log(`Scraping method: ${result.scraping_method}`);
    console.log(`Scraped at: ${result.scraped_at}`);
  } else {
    console.error('❌ Error:', result.error);
  }
} catch (error) {
  console.error('❌ Fetch error:', error.message);
}