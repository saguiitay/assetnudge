/**
 * Calculate the number of days between a given date and now
 * @param d - Date string or Date object
 * @returns Number of days between the date and now, or null if invalid
 */
export const daysBetween = (d: string | Date | null | undefined): number | null => {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return Math.floor((Date.now() - dt.getTime()) / 86400000);
};

/**
 * Clamp a value between a minimum and maximum
 * @param x - Value to clamp
 * @param a - Minimum value
 * @param b - Maximum value
 * @returns Clamped value
 */
export const clamp = (x: number, a: number, b: number): number => Math.max(a, Math.min(b, x));

/**
 * Calculate the median of an array of numbers
 * @param arr - Array of numbers (may contain non-numbers which will be filtered)
 * @returns Median value or null if no valid numbers
 */
export const median = (arr: unknown[]): number | null => {
  const x = arr.filter((n): n is number => typeof n === 'number' && !isNaN(n)).sort((a, b) => a - b);
  if (!x.length) return null;
  const m = Math.floor(x.length / 2);
  return x.length % 2 ? x[m]! : (x[m - 1]! + x[m]!) / 2;
};

/**
 * Calculate mean and standard deviation of an array
 * @param arr - Array of numbers (may contain non-numbers which will be filtered)
 * @returns Object with mean and std properties, or nulls if no valid numbers
 */
export const meanStd = (arr: unknown[]): { mean: number | null; std: number | null } => {
  const x = arr.filter((n): n is number => typeof n === 'number' && !isNaN(n));
  const n = x.length;
  if (!n) return { mean: null, std: null };
  const mean = x.reduce((a, b) => a + b, 0) / n;
  const v = x.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(v) };
};

/**
 * Calculate z-score for a value
 * @param val - Value to calculate z-score for
 * @param mean - Mean of the distribution
 * @param std - Standard deviation of the distribution
 * @returns Z-score or 0 if invalid parameters
 */
export const zscore = (val: number | null, mean: number | null, std: number | null): number =>
  (mean == null || std == null || std === 0 || val == null) ? 0 : (val - mean) / std;

/**
 * Calculate Jaccard similarity between two arrays
 * @param a - First array
 * @param b - Second array
 * @returns Jaccard similarity coefficient (0-1)
 */
export const jaccard = (a: unknown[], b: unknown[]): number => {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) {
    if (B.has(x)) inter++;
  }
  const u = A.size + B.size - inter;
  return u ? inter / u : 0;
};

/**
 * Common stop words in English that should be filtered out during text processing
 * These words are typically too common to provide meaningful semantic value
 */
export const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 
  'to', 'was', 'will', 'with', 'you', 'your', 'have', 'had', 'this',
  'but', 'not', 'or', 'can', 'could', 'would', 'should', 'do', 'does',
  'did', 'get', 'got', 'go', 'going', 'gone', 'make', 'made', 'take',
  'taken', 'come', 'came', 'see', 'seen', 'know', 'known', 'well',
  'also', 'back', 'after', 'use', 'used', 'using', 'each', 'which',
  'their', 'said', 'if', 'up', 'out', 'many', 'then', 'them', 'these',
  'so', 'some', 'her', 'would', 'there', 'what', 'all', 'were', 'when',
  'who', 'oil', 'sit', 'now', 'find', 'down', 'way', 'may', 'water',
  'long', 'little', 'very', 'still', 'old', 'any', 'my', 'other', 'such',
  'through', 'our', 'good', 'much', 'before', 'right', 'too', 'means',
  'think', 'say', 'great', 'where', 'help', 'here', 'how', 'because',
  'between', 'both', 'during', 'only', 'over', 'same', 'those', 'under',
  'while', 'why', 'without', 'within', 'about', 'above', 'against',
  'below', 'into', 'near', 'off', 'since', 'than', 'until', 'upon'
]);

/**
 * Check if a word is a stop word
 * @param word - Word to check
 * @returns True if word is a stop word
 */
export const isStopWord = (word: string | null | undefined): boolean => 
  STOP_WORDS.has(word?.toLowerCase() ?? '');

/**
 * Filter stop words from an array of words
 * @param words - Array of words to filter
 * @param ignoreStopWords - Whether to filter stop words (default: true)
 * @returns Filtered array of words
 */
export const filterStopWords = (words: string[], ignoreStopWords: boolean = true): string[] => {
  if (!ignoreStopWords) return words;
  return words.filter(word => !isStopWord(word));
};

/**
 * Tokenization result containing unigrams and bigrams
 */
export interface TokenizeResult {
  uni: string[];
  bi: string[];
}

/**
 * Enhanced tokenization with optional stop word filtering
 * @param text - Text to tokenize
 * @param ignoreStopWords - Whether to filter stop words (default: true)
 * @returns Object with uni (unigrams) and bi (bigrams) arrays
 */
export function tokenize(text: string = '', ignoreStopWords: boolean = true): TokenizeResult {
  const tokens = (text || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  
  // Filter stop words if requested
  const filteredTokens = filterStopWords(tokens, ignoreStopWords);
  
  const uni = filteredTokens;
  const bi: string[] = [];
  
  // Create bigrams from filtered tokens
  for (let i = 0; i < filteredTokens.length - 1; i++) {
    bi.push(filteredTokens[i] + ' ' + filteredTokens[i + 1]);
  }
  
  return { uni, bi };
}

/**
 * Term frequency vector representation
 */
export type TFVector = Record<string, number>;

/**
 * Enhanced TF vector creation with optional stop word filtering
 * @param text - Text to create vector from
 * @param ignoreStopWords - Whether to filter stop words (default: true)
 * @returns TF vector object
 */
export const tfVector = (text: string, ignoreStopWords: boolean = true): TFVector => {
  const { uni, bi } = tokenize(text || '', ignoreStopWords);
  const v: TFVector = {};
  [...uni, ...bi].forEach(t => v[t] = (v[t] || 0) + 1);
  return v;
};

/**
 * Calculate cosine similarity between two TF vectors
 * @param a - First TF vector
 * @param b - Second TF vector
 * @returns Cosine similarity (0-1)
 */
export const cosine = (a: TFVector, b: TFVector): number => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  
  return (na && nb) ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
};

/**
 * Count bullet points in text supporting both HTML lists and markdown-style bullets
 * @param text - Text to count bullets in
 * @returns Number of bullet points found
 */
export const countBullets = (text: string): number => {
  if (!text) return 0;
  
  let count = 0;
  
  // Count HTML list items (<li> tags)
  const htmlListItems = text.match(/<li[^>]*>/gi) || [];
  count += htmlListItems.length;
  
  // Count markdown-style bullets with enhanced pattern matching
  // Look for common bullet characters at the start of lines or after whitespace
  // Enhanced to better capture the ● character and other Unicode bullets
  const bulletPattern = /(?:^|\n)\s*[●○•◦▪▫‣⁃◆◇■□▸▹►▻✓✔⚡*-]\s+/gm;
  const markdownBullets = text.match(bulletPattern) || [];
  count += markdownBullets.length;
  
  // Count HTML-style bullets: <p>- content</p> or similar patterns
  // This handles cases where bullets are in HTML paragraphs without newlines
  const htmlBulletPattern = /<(?:p|div)[^>]*>\s*[-●○•◦▪▫‣⁃◆◇■□▸▹►▻✓✔⚡*]\s+/gi;
  const htmlBullets = text.match(htmlBulletPattern) || [];
  count += htmlBullets.length;
  
  // Count HTML numbered bullets: <p>1. content</p>
  const htmlNumberedPattern = /<(?:p|div)[^>]*>\s*\d+\.\s+/gi;
  const htmlNumbered = text.match(htmlNumberedPattern) || [];
  count += htmlNumbered.length;
  
  // Specifically look for the ● character (U+25CF BLACK CIRCLE) which is commonly used
  const blackCircleBullets = text.match(/(?:^|\n)\s*●\s+/gm) || [];
  // Don't double count if already caught by the general pattern
  if (blackCircleBullets.length > 0 && markdownBullets.length === 0) {
    count += blackCircleBullets.length;
  }
  
  // Count numbered list items (1. 2. etc. at start of lines)
  const numberedItems = text.match(/(?:^|\n)\s*\d+\.\s+/gm) || [];
  count += numberedItems.length;
  
  // Additional pattern for spaced bullets like "• item" or "* item"
  const spacedBullets = text.match(/(?:^|\n)\s*[•*]\s+\S/gm) || [];
  // Only count these if not already captured by other patterns
  if (spacedBullets.length > markdownBullets.length) {
    count += (spacedBullets.length - markdownBullets.length);
  }
  
  return count;
};