# AI Prompts

This folder contains all AI prompt templates used by the AssetNudge optimizer's AI suggestion engine.

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
} from './prompts/index.js';

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