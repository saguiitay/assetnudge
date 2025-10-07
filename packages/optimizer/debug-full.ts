import { scrapeAssetWithGraphQL } from './src/scrappers/graphql-scraper.js';

async function debugFullResponse() {
  try {
    const assetId = '320892';
    console.log(`Debugging full GraphQL response for asset ${assetId}`);

    // Generate CSRF token
    const csrfToken = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    const cookies = [
      `_csrf=${csrfToken}`,
      'NEXT_LOCALE=en-US',
      'AC_CURR=USD',
      '_sessionStart=true',
      'DS=e64179f5-a73b-4a82-a3d4-846729e72e39',
      'scrollerWidth=15'
    ];
    
    const cookieHeader = cookies.join('; ');

    // Try a broader query to see what fields are available
    const queries = [
      {
        query: `query ProductReview($id: ID!, $rows: Int, $page: Int, $sort_by: String, $reviewId: String, $rating: String) {
          product(id: $id) {
            id
            name
            rating {
              average
              count
              __typename
            }
            reviewCount
            reviews(rows: $rows, page: $page, sortBy: $sort_by, reviewId: $reviewId, rating: $rating) {
              count
              totalEntries
              __typename
            }
            __typename
          }
        }`,
        variables: {
          id: assetId,
          rows: 10,
          page: 1,
          sort_by: "recent",
          rating: null
        },
        operationName: "ProductReview"
      }
    ];

    const response = await fetch('https://assetstore.unity.com/api/graphql/batch', {
      method: 'POST',
      headers: {
        'authority': 'assetstore.unity.com',
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json;charset=UTF-8',
        'x-csrf-token': csrfToken,
        'x-requested-with': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': cookieHeader,
        'referer': 'https://assetstore.unity.com/packages/3d/vehicles/land/modular-racing-cars-low-poly-3d-models-320892'
      },
      body: JSON.stringify(queries)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    
    console.log('\nFull GraphQL response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data[0]?.data?.product) {
      const product = data[0].data.product;
      console.log('\nKey fields:');
      console.log('Name:', product.name);
      console.log('Rating count:', product.rating?.count);
      console.log('Review count:', product.reviewCount);
      console.log('Reviews.count:', product.reviews?.count);
      console.log('Reviews.totalEntries:', product.reviews?.totalEntries);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugFullResponse();