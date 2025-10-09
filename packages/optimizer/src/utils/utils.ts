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
  
  // Track what we've already counted to avoid double-counting
  const countedRanges: Array<{start: number, end: number}> = [];
  
  // Helper function to check if a range overlaps with already counted ranges
  const isAlreadyCounted = (start: number, end: number): boolean => {
    return countedRanges.some(range => 
      (start >= range.start && start <= range.end) ||
      (end >= range.start && end <= range.end) ||
      (start <= range.start && end >= range.end)
    );
  };
  
  // Helper function to add a range to counted ranges
  const addCountedRange = (start: number, end: number) => {
    countedRanges.push({start, end});
  };
  
  // 1. Count complete HTML unordered lists first (highest priority)
  const ulPattern = /<ul[^>]*>[\s\S]*?<\/ul>/gi;
  let ulMatch;
  while ((ulMatch = ulPattern.exec(text)) !== null) {
    const ulContent = ulMatch[0];
    const liInUl = ulContent.match(/<li[^>]*>/gi) || [];
    count += liInUl.length;
    addCountedRange(ulMatch.index, ulMatch.index + ulMatch[0].length);
  }
  
  // 2. Count complete HTML ordered lists (highest priority)
  const olPattern = /<ol[^>]*>[\s\S]*?<\/ol>/gi;
  let olMatch;
  while ((olMatch = olPattern.exec(text)) !== null) {
    const olContent = olMatch[0];
    const liInOl = olContent.match(/<li[^>]*>/gi) || [];
    count += liInOl.length;
    addCountedRange(olMatch.index, olMatch.index + olMatch[0].length);
  }
  
  // 3. Count standalone HTML list items (<li> tags) not in <ul>/<ol>
  const liPattern = /<li[^>]*>/gi;
  let liMatch;
  while ((liMatch = liPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(liMatch.index, liMatch.index + liMatch[0].length)) {
      count++;
      addCountedRange(liMatch.index, liMatch.index + liMatch[0].length);
    }
  }
  
  // 4. Count HTML-style bullets: <p>- content</p> or similar patterns
  const htmlBulletPattern = /<(?:p|div)[^>]*>\s*[-●○•◦▪▫‣⁃◆◇■□▸▹►▻✓✔⚡*]\s+/gi;
  let htmlBulletMatch;
  while ((htmlBulletMatch = htmlBulletPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(htmlBulletMatch.index, htmlBulletMatch.index + htmlBulletMatch[0].length)) {
      count++;
      addCountedRange(htmlBulletMatch.index, htmlBulletMatch.index + htmlBulletMatch[0].length);
    }
  }
  
  // 5. Count HTML numbered bullets: <p>1. content</p>
  const htmlNumberedPattern = /<(?:p|div)[^>]*>\s*\d+\.\s+/gi;
  let htmlNumberedMatch;
  while ((htmlNumberedMatch = htmlNumberedPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(htmlNumberedMatch.index, htmlNumberedMatch.index + htmlNumberedMatch[0].length)) {
      count++;
      addCountedRange(htmlNumberedMatch.index, htmlNumberedMatch.index + htmlNumberedMatch[0].length);
    }
  }
  
  // 6. Count bullets in HTML emphasis tags: <strong>- content</strong> or <b>• item</b>
  const emphasisBulletPattern = /<(?:strong|b|em|i)[^>]*>\s*[-●○•◦▪▫‣⁃◆◇■□▸▹►▻✓✔⚡*]\s+/gi;
  let emphasisMatch;
  while ((emphasisMatch = emphasisBulletPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(emphasisMatch.index, emphasisMatch.index + emphasisMatch[0].length)) {
      count++;
      addCountedRange(emphasisMatch.index, emphasisMatch.index + emphasisMatch[0].length);
    }
  }
  
  // 7. Count bullets after HTML breaks: <br>- item or <br />• item
  const breakBulletPattern = /<br[^>]*>\s*[-●○•◦▪▫‣⁃◆◇■□▸▹►▻✓✔⚡*]\s+/gi;
  let breakMatch;
  while ((breakMatch = breakBulletPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(breakMatch.index, breakMatch.index + breakMatch[0].length)) {
      count++;
      addCountedRange(breakMatch.index, breakMatch.index + breakMatch[0].length);
    }
  }
  
  // 8. Count markdown-style bullets at line starts
  const bulletPattern = /(?:^|\n)\s*[●○•◦▪▫‣⁃◆◇■□▸▹►▻✓✔⚡*-]\s+/gm;
  let markdownMatch;
  while ((markdownMatch = bulletPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(markdownMatch.index, markdownMatch.index + markdownMatch[0].length)) {
      count++;
      addCountedRange(markdownMatch.index, markdownMatch.index + markdownMatch[0].length);
    }
  }
  
  // 9. Count numbered list items (1. 2. etc. at start of lines)
  const numberedPattern = /(?:^|\n)\s*\d+\.\s+/gm;
  let numberedMatch;
  while ((numberedMatch = numberedPattern.exec(text)) !== null) {
    if (!isAlreadyCounted(numberedMatch.index, numberedMatch.index + numberedMatch[0].length)) {
      count++;
      addCountedRange(numberedMatch.index, numberedMatch.index + numberedMatch[0].length);
    }
  }
  
  return count;
};