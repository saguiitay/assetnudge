async function testSimpleQuery() {
  try {
    const assetId = '320892';
    console.log(`Testing simple GraphQL query for asset ${assetId}`);

    // Generate CSRF token
    const csrfToken = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    // Try a very simple query first
    const query = {
      query: `query GetProduct($id: ID!) {
        product(id: $id) {
          id
          name
          rating {
            count
          }
          reviewCount
        }
      }`,
      variables: {
        id: assetId
      },
      operationName: "GetProduct"
    };

    const response = await fetch('https://assetstore.unity.com/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://assetstore.unity.com/packages/3d/vehicles/land/modular-racing-cars-low-poly-3d-models-320892'
      },
      body: JSON.stringify(query)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleQuery();