# AI Prompts

# AI Prompts Module

This module contains all AI prompt templates for the Unity Asset Store optimization engine. Each prompt is carefully crafted to generate specific types of suggestions with optimal results.

## Structure

### Dedicated Prompts
- `title-prompt.ts` - Specialized prompts for title optimization
- `tags-prompt.ts` - Specialized prompts for tag suggestions
- `short-description-prompt.ts` - Specialized prompts for short descriptions
- `long-description-prompt.ts` - Specialized prompts for long descriptions

**Note**: Legacy prompts are kept for reference but are no longer used in the active codebase.

## Current Usage

The module now uses dedicated, specialized prompts for each suggestion type:

```typescript
import { AISuggestionEngine } from '../ai-suggestions';
import type { DedicatedSuggestionParams } from '../ai-suggestions';

const engine = new AISuggestionEngine(config);

// Generate title suggestions
const titleResult = await engine.suggestTitle({
  asset: myAsset,
  exemplars: categoryExemplars,
  vocab: categoryVocabulary
});

// Generate tag suggestions
const tagsResult = await engine.suggestTags({
  asset: myAsset,
  exemplars: categoryExemplars,
  vocab: categoryVocabulary
});

// Generate all suggestions at once (most efficient)
const allResults = await engine.suggestAll({
  asset: myAsset,
  exemplars: categoryExemplars,
  vocab: categoryVocabulary
});
```

## API Integration

The `/api/prompts` endpoint now uses the dedicated prompts:

- `GET /api/prompts?type=title` - Returns title-specific prompts
- `GET /api/prompts?type=tags` - Returns tag-specific prompts
- `GET /api/prompts?type=short_description` - Returns short description prompts
- `GET /api/prompts?type=long_description` - Returns long description prompts
- `GET /api/prompts` - Returns all prompt types

## Prompt Design Principles

1. **Specificity**: Each prompt is tailored for a specific suggestion type
2. **Context Awareness**: Prompts include relevant exemplar data and vocabulary
3. **Best Practices**: Embedded Unity Asset Store optimization guidelines
4. **Structured Output**: Designed for consistent JSON schema responses
5. **Category Adaptation**: Prompts adapt to category-specific patterns

## Response Schemas

Each dedicated prompt returns a specific schema:

- **Title**: Array of title suggestions with intent and character counts
- **Tags**: Array of tag suggestions with discoverability scores
- **Short Description**: Single optimized short description with rationale
- **Long Description**: Structured markdown long description
- **All**: Combined response with all suggestion types

## Migration Complete

✅ **Legacy Methods Removed**: `generateSuggestions()` and `generateFocusedSuggestions()`  
✅ **API Updated**: Routes now use dedicated prompts  
✅ **Optimizer Updated**: Uses new `suggestAll()` method  
✅ **Type Safety**: Full TypeScript support with dedicated interfaces  

The module now provides a clean, focused API optimized for performance and maintainability.

## Files

### `system-prompt.js`
Contains the main system prompt that establishes the AI's role as a Unity Asset Store optimization consultant. Defines key principles, category constraints, and areas of expertise.

### `detailed-user-prompt.js`
Contains the comprehensive user prompt template used for full asset optimization. Includes asset details, exemplar vocabulary, benchmarks, and detailed task instructions.

### `focused-system-prompt.js`
Contains specialized system prompts for focused optimization tasks (tags, title, description, category, recommendations).

### `focused-user-prompt.js`
Contains user prompt templates for focused optimization tasks and the base asset context builder.

### `index.js`
Central export file for all prompt functions.

## Usage

```javascript
import { 
  buildSystemPrompt, 
  buildDetailedUserPrompt, 
  buildFocusedSystemPrompt, 
  buildFocusedUserPrompt 
} from './prompts/index';

// Use the functions to generate prompts with dynamic data
const systemPrompt = buildSystemPrompt(validCategories);
const userPrompt = buildDetailedUserPrompt(asset, exemplars, vocab, playbook, validCategories);
```

## Prompt Structure

All prompts are designed to:
- Ground suggestions in exemplar data and patterns
- Maintain professional, conversion-focused tone
- Return structured JSON responses
- Reference specific Unity Asset Store constraints
- Provide actionable, benchmarked recommendations

## Maintenance

When updating prompts:
1. Test with various asset types and categories
2. Ensure JSON schema compatibility 
3. Validate category constraints
4. Check exemplar pattern references