import { ExemplarAsset } from "../exemplars";
import { Asset, CategoryRules, CategoryVocabulary } from "../types";

/**
 * Tag suggestion interface
 */
export interface TagSuggestion {
  rationale?: string;
  tag: string;
}

/**
 * Title suggestion interface
 */
export interface TitleSuggestion {
  rationale?: string;
  text: string;
}

/**
 * Description suggestion interface
 */
export interface DescriptionSuggestion {
  rationale?: string;
  description: string;
}


/**
 * Category suggestion interface
 */
export interface CategorySuggestion {
  rationale?: string;
  category: string;
  confidence: number;
}


/**
 * Title suggestion response
 */
export interface TitleSuggestionResponse {
  suggestions: TitleSuggestion[];
}

/**
 * Tags suggestion response
 */
export interface TagsSuggestionResponse {
  suggestions: TagSuggestion[];
}

/**
 * Short description suggestion response
 */
export interface ShortDescriptionResponse {
    suggestions: DescriptionSuggestion[];
}

/**
 * Long description suggestion response
 */
export interface LongDescriptionResponse {
  suggestions: DescriptionSuggestion[];
}

/**
 * Complete suggestion response for suggestAll method
 */
export interface AllSuggestionsResponse {
  title: TitleSuggestionResponse;
  tags: TagsSuggestionResponse;
  short_description: ShortDescriptionResponse;
  long_description: LongDescriptionResponse;
}

/**
 * Simplified suggestion parameters for dedicated methods
 */
export interface DedicatedSuggestionParams {
  asset: Asset;
  exemplars?: ExemplarAsset[];
  categoryVocabulary?: CategoryVocabulary;
  gradingRules?: CategoryRules;
}