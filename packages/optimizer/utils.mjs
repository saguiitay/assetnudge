export const daysBetween = (d) => { if (!d) return null; const dt = new Date(d); if (isNaN(dt)) return null; return Math.floor((Date.now()-dt)/86400000); };
export const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
export const median = (arr)=>{ const x=arr.filter(n=>typeof n==='number'&&!isNaN(n)).sort((a,b)=>a-b); if(!x.length) return null; const m=Math.floor(x.length/2); return x.length%2?x[m]:(x[m-1]+x[m])/2; };
export const meanStd = (arr)=>{ const x=arr.filter(n=>typeof n==='number'&&!isNaN(n)); const n=x.length; if(!n) return {mean:null,std:null}; const mean=x.reduce((a,b)=>a+b,0)/n; const v=x.reduce((a,b)=>a+(b-mean)**2,0)/n; return {mean,std:Math.sqrt(v)}; };
export const zscore=(val,mean,std)=> (mean==null||std==null||std===0||val==null)?0:(val-mean)/std;
export const jaccard=(a,b)=>{ const A=new Set(a), B=new Set(b); let inter=0; for(const x of A) if(B.has(x)) inter++; const u=A.size+B.size-inter; return u?inter/u:0; };

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
 * @param {string} word - Word to check
 * @returns {boolean} True if word is a stop word
 */
export const isStopWord = (word) => STOP_WORDS.has(word?.toLowerCase());

/**
 * Filter stop words from an array of words
 * @param {string[]} words - Array of words to filter
 * @param {boolean} ignoreStopWords - Whether to filter stop words (default: true)
 * @returns {string[]} Filtered array of words
 */
export const filterStopWords = (words, ignoreStopWords = true) => {
  if (!ignoreStopWords) return words;
  return words.filter(word => !isStopWord(word));
};

/**
 * Enhanced tokenization with optional stop word filtering
 * @param {string} text - Text to tokenize
 * @param {boolean} ignoreStopWords - Whether to filter stop words (default: true)
 * @returns {Object} Object with uni (unigrams) and bi (bigrams) arrays
 */
export function tokenize(text = '', ignoreStopWords = true) { 
  const tokens = (text || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  
  // Filter stop words if requested
  const filteredTokens = filterStopWords(tokens, ignoreStopWords);
  
  const uni = filteredTokens;
  const bi = [];
  
  // Create bigrams from filtered tokens
  for (let i = 0; i < filteredTokens.length - 1; i++) {
    bi.push(filteredTokens[i] + ' ' + filteredTokens[i + 1]);
  }
  
  return { uni, bi };
}

/**
 * Enhanced TF vector creation with optional stop word filtering
 * @param {string} text - Text to create vector from
 * @param {boolean} ignoreStopWords - Whether to filter stop words (default: true)
 * @returns {Object} TF vector object
 */
export const tfVector = (text, ignoreStopWords = true) => { 
  const { uni, bi } = tokenize(text || '', ignoreStopWords); 
  const v = {}; 
  [...uni, ...bi].forEach(t => v[t] = (v[t] || 0) + 1); 
  return v; 
};

export const cosine=(a,b)=>{ let dot=0,na=0,nb=0; const keys=new Set([...Object.keys(a),...Object.keys(b)]); for(const k of keys){ const va=a[k]||0, vb=b[k]||0; dot+=va*vb; na+=va*va; nb+=vb*vb; } return (na&&nb)? dot/(Math.sqrt(na)*Math.sqrt(nb)) : 0; };
