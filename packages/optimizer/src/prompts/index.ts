/**
 * Prompts module - Centralized AI prompt management
 * Exports all prompt building functions for AI suggestions
 */

// Dedicated prompts for specific suggestion types
export { buildTitleSystemPrompt, buildTitleUserPrompt } from './title-prompt';
export { buildTagsSystemPrompt, buildTagsUserPrompt } from './tags-prompt';
export { buildShortDescSystemPrompt, buildShortDescUserPrompt } from './short-description-prompt';
export { buildLongDescSystemPrompt, buildLongDescUserPrompt } from './long-description-prompt';