import { Asset } from '@repo/optimizer/src/types';

/**
 * Configuration for the API client
 */
export interface ApiClientConfig {
  /** Base URL for the API. Defaults to NEXT_PUBLIC_API_URL or http://localhost:3002 */
  baseUrl?: string;
  /** Function to retrieve authentication token */
  getToken?: () => Promise<string | null>;
  /** Enable debug mode */
  debug?: boolean;
}

/**
 * Response from the grade endpoint
 */
export interface GradeResponse {
  success: boolean;
  error?: string;
  grade?: {
    grade?: {
      score: number;
      letter: string;
      reasons?: string[];
      breakdown?: {
        content?: number;
        media?: number;
        trust?: number;
        findability?: number;
      };
      weights?: {
        content?: Record<string, number>;
        media?: Record<string, number>;
        trust?: Record<string, number>;
        find?: Record<string, number>;
      };
    };
    score?: number;
    letter?: string;
    reasons?: string[];
    breakdown?: {
      content?: number;
      media?: number;
      trust?: number;
      findability?: number;
    };
    weights?: {
      content?: Record<string, number>;
      media?: Record<string, number>;
      trust?: Record<string, number>;
      find?: Record<string, number>;
    };
  };
  graded_at?: string;
}

/**
 * Response from the optimize endpoint
 */
export interface OptimizeResponse {
  success: boolean;
  error?: string;
  optimizedAsset?: Partial<Asset>;
  generated?: Partial<Asset>;
  result?: any[]; // For field-specific optimizations that return suggestions
}

/**
 * Response from the scrape endpoint
 */
export interface ScrapeResponse {
  success: boolean;
  error?: string;
  data?: Partial<Asset>;
  scrapedData?: Partial<Asset>;
  asset?: Partial<Asset>;
  scraping_method?: string;
  scraped_at?: string;
}

/**
 * Options for the optimize endpoint
 */
export interface OptimizeOptions {
  assetData: Asset;
  generateFields?: string[];
  generateAll?: boolean;
  debug?: boolean;
}

/**
 * Options for the optimize field endpoint
 */
export interface OptimizeFieldOptions {
  assetData: Asset;
  useAI?: boolean;
  debug?: boolean;
}

/**
 * Options for the scrape endpoint
 */
export interface ScrapeOptions {
  url: string;
  method?: 'graphql' | 'html';
  debug?: boolean;
}

/**
 * Response from the prompts endpoint
 */
export interface PromptResponse {
  success: boolean;
  error?: string;
  prompt?: string;
}

/**
 * API Client for communicating with the backend API
 */
export class ApiClient {
  private baseUrl: string;
  private getToken?: () => Promise<string | null>;
  private debug: boolean;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || 
      (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 
      'http://localhost:3002';
    this.getToken = config.getToken;
    this.debug = config.debug ?? false;
  }

  /**
   * Internal method to make authenticated requests
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers from options
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.assign(headers, existingHeaders);
    }

    // Add authorization header if token is available
    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Grade an asset
   */
  async grade(assetData: Asset, debug?: boolean): Promise<GradeResponse> {
    return this.request<GradeResponse>('/grade', {
      method: 'POST',
      body: JSON.stringify({
        assetData,
        debug: debug ?? this.debug,
      }),
    });
  }

  /**
   * Optimize/generate asset fields
   */
  async optimize(options: OptimizeOptions): Promise<OptimizeResponse> {
    return this.request<OptimizeResponse>('/optimize', {
      method: 'POST',
      body: JSON.stringify({
        assetData: options.assetData,
        generateFields: options.generateFields,
        generateAll: options.generateAll ?? false,
        debug: options.debug ?? this.debug,
      }),
    });
  }

  /**
   * Optimize a specific field
   */
  async optimizeField(
    field: string,
    options: OptimizeFieldOptions
  ): Promise<OptimizeResponse> {
    return this.request<OptimizeResponse>(`/optimize?field=${field}`, {
      method: 'POST',
      body: JSON.stringify({
        options: {
          assetData: options.assetData,
          useAI: options.useAI ?? true,
        },
        debug: options.debug ?? this.debug,
      }),
    });
  }

  /**
   * Scrape asset data from a URL
   */
  async scrape(options: ScrapeOptions): Promise<ScrapeResponse> {
    return this.request<ScrapeResponse>('/scrape', {
      method: 'POST',
      body: JSON.stringify({
        url: options.url,
        method: options.method ?? 'graphql',
        debug: options.debug ?? this.debug,
      }),
    });
  }

  /**
   * Get AI prompt for a specific field type
   */
  async getPrompt(fieldType: string, asset: Asset): Promise<PromptResponse> {
    return this.request<PromptResponse>(`/prompts?type=${fieldType}`, {
      method: 'POST',
      body: JSON.stringify({
        asset,
      }),
    });
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(config: ApiClientConfig = {}): ApiClient {
  return new ApiClient(config);
}
