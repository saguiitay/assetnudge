# @repo/api-client

A centralized API client for communicating with the backend API endpoints. This package provides a type-safe, consistent interface for all API calls, eliminating duplicate code for authorization, headers, URL construction, and request handling.

## Features

- **Type-safe API calls** with TypeScript interfaces
- **Automatic authentication** via token injection
- **Centralized configuration** for base URL and debug settings
- **Consistent error handling** across all endpoints
- **Eliminates code duplication** for fetch calls

## Installation

This package is already included in the monorepo workspace. To use it in your app:

```json
{
  "dependencies": {
    "@repo/api-client": "*"
  }
}
```

## Usage

### Basic Setup

```typescript
import { createApiClient } from '@repo/api-client';

// Create a client instance
const apiClient = createApiClient({
  baseUrl: 'https://api.example.com', // Optional, defaults to NEXT_PUBLIC_API_URL
  getToken: async () => 'your-auth-token', // Optional, for authenticated requests
  debug: false // Optional, enable debug mode
});
```

### With Authentication (Next.js + Clerk)

```typescript
import { createApiClient } from '@repo/api-client';
import { useAuth } from '@repo/auth/client';

function MyComponent() {
  const { getToken } = useAuth();
  
  const apiClient = createApiClient({
    getToken,
  });
  
  // Use the client for API calls
}
```

## Available Methods

### Grade Asset

Grade an asset and get a score breakdown:

```typescript
const result = await apiClient.grade(assetData, debug);

// Response type: GradeResponse
// {
//   success: boolean;
//   error?: string;
//   grade?: { score, letter, reasons, breakdown, weights };
//   graded_at?: string;
// }
```

### Optimize Asset

Generate or optimize multiple asset fields:

```typescript
const result = await apiClient.optimize({
  assetData: myAsset,
  generateFields: ['title', 'tags', 'short_description'],
  generateAll: false,
  debug: true
});

// Response type: OptimizeResponse
// {
//   success: boolean;
//   error?: string;
//   optimizedAsset?: Partial<Asset>;
//   generated?: Partial<Asset>;
//   result?: any[]; // For suggestion arrays
// }
```

### Optimize Single Field

Optimize a specific field with AI:

```typescript
const result = await apiClient.optimizeField('title', {
  assetData: myAsset,
  useAI: true,
  debug: false
});
```

### Scrape Asset Data

Scrape asset data from a URL:

```typescript
const result = await apiClient.scrape({
  url: 'https://example.com/product/123',
  method: 'graphql', // or 'html'
  debug: true
});

// Response type: ScrapeResponse
// {
//   success: boolean;
//   error?: string;
//   data?: Partial<Asset>;
//   asset?: Partial<Asset>;
//   scraping_method?: string;
//   scraped_at?: string;
// }
```

## Configuration

### Environment Variables

The client uses the following environment variables:

- `NEXT_PUBLIC_API_URL` - Base URL for the API (default: `http://localhost:3002`)
- `NODE_ENV` - Determines debug behavior
- `NEXT_PUBLIC_DEBUG` - Override debug mode

## Type Definitions

All request and response types are exported from the package:

```typescript
import type {
  ApiClientConfig,
  GradeResponse,
  OptimizeResponse,
  OptimizeOptions,
  OptimizeFieldOptions,
  ScrapeResponse,
  ScrapeOptions,
} from '@repo/api-client';
```

## Migration Example

**Before (duplicate code):**

```typescript
const token = await getToken();
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const response = await fetch(`${apiUrl}/grade`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    assetData,
    debug: false
  }),
});
const result = await response.json();
```

**After (using API client):**

```typescript
const apiClient = createApiClient({ getToken });
const result = await apiClient.grade(assetData, false);
```

## Benefits

1. **DRY Principle** - No more duplicate fetch code
2. **Type Safety** - Full TypeScript support with proper types
3. **Maintainability** - Update API behavior in one place
4. **Consistency** - All API calls follow the same pattern
5. **Testability** - Easy to mock and test API interactions

## Development

To add a new endpoint:

1. Define the request/response types in `client.ts`
2. Add a method to the `ApiClient` class
3. Use the internal `request()` method for consistent handling
4. Export types and update documentation

## License

Private package for internal use only.
