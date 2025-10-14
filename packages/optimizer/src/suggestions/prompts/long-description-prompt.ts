/**
 * Long description-specific AI prompts for Unity Asset Store optimization
 */

import { ExemplarAsset } from 'src/exemplars';
import type { Asset, CategoryRules, CategoryVocabulary, VocabularyWord } from '../../types';

/**
 * Build system prompt for long description suggestions
 */
export function buildLongDescSystemPrompt(): string {
  return `You are an expert Unity Asset Store optimization specialist focused specifically on creating comprehensive, conversion-optimized long descriptions.

Your expertise includes:
- Unity Asset Store long description best practices and formatting
- Structured content organization for maximum impact
- Feature-benefit translation and value communication
- Technical documentation integration
- Call-to-action optimization and trust building

### TONE & STYLE

Write as if you are a senior Unity developer explaining your own asset to other developers.  
The tone should be:
- **Professional yet conversational**
- **Confident, not overhyped**
- **Natural and varied in sentence structure**
- **Focused on clarity and developer benefit**

Avoid robotic or overly “AI-clean” phrasing. Write as if it's handcrafted by a Unity pro.

---

### STRUCTURE

Follow a natural but consistent flow. Do **not** over-template it.

1. **HOOK (1-2 sentences)**  
   - Open with a developer pain point or problem statement  
   - Immediately follow with the main benefit or value proposition  
   - Example: *“Tired of writing dice logic from scratch? Dice Roller Pro gives you a production-ready rolling engine that just works.”*

2. **KEY FEATURES (3-5 bullets)**  
   - For each feature, describe both what it does and **why it helps developers**  
   - Example: *“Thread-safe architecture - perfect for async dice rolls in multiplayer or AI simulations.”*

3. **USE CASES (2-3 examples)**  
   - Show how real developers would apply this asset  
   - Example: *“Use it to handle character stat generation, procedural loot systems, or tabletop-inspired combat rolls.”*

4. **TECHNICAL DETAILS (1-2 paragraphs)**  
   - Include compatibility (Unity version, LTS support, etc.)  
   - Mention performance, source code, pipelines, or documentation  
   - Use occasional code-like examples or inline notation for realism (e.g. "2d6+3", "(1d6+2)*3")  

5. **CALL TO ACTION (1-2 sentences)**  
   - Strong, benefit-driven reason to purchase  
   - Example: *“Save hours of coding time and ship faster—download Dice Roller Pro today and bring professional dice logic to your next Unity game.”*

---

### SEO & OPTIMIZATION

- Integrate high-performing category keywords naturally.  
- Emphasize unique differentiators and developer benefits. 
- Include subtle **trust signals**, like:
  - “Compatible with Unity 2022.3 LTS and newer”
  - “Used by indie teams and studios worldwide”
  - “Includes full source code and examples”

---

### QUALITY & REALISM CHECK

Before finalizing:
- Vary sentence rhythm (mix short and long sentences)
- Use occasional transition phrases (“Moreover”, “Even better”, “In practice”)
- Avoid emoji overload — 0-1 per major section max
- Ensure the tone reads like *real human marketing copy*, not auto-generated text

---

### FORMATTING

Use HTML with only the following tags: <p>, <ul>, <ol>, <li>, <strong>, <em>, <br>. No other HTML tags are allowed.

Response must be valid JSON with the exact schema provided.`;
}

/**
 * Build user prompt for long description suggestions
 */
export function buildLongDescUserPrompt(
  asset: Asset,
  exemplars: ExemplarAsset[] = [],
  categoryVocabulary: CategoryVocabulary | undefined = undefined,
  categoryRules: CategoryRules | undefined = undefined 
): string {
  const currentShortDesc = asset.short_description || '';
  const currentLongDesc = asset.long_description || '';
  const wordCount = currentLongDesc.split(/\s+/).length;

  const topWords = ((categoryVocabulary?.title_words || [])
                  .concat(categoryVocabulary?.title_bigrams || [])
                  .concat(categoryVocabulary?.description_words || [])
                  ).sort((a, b) => (b.frequency - a.frequency))
                  .slice(0, 10)
                  .map(w => w.word)
                  .join(', ');

  const topTags = (categoryVocabulary?.common_tags || [])
                  .sort((a, b) => (b.frequency - a.frequency))
                  .slice(0, 10)
                  .map(w => w.word)
                  .join(', ');

  // show the long description of a few exemplars
  const exemplarLongDescs = exemplars.slice(0, 2).map(ex => 
      `Title: "${ex.title}"\nDescription:\n${ex.long_description}\n`
      ).join('\n--\n');


  return `### CURRENT ASSET DATA:

Title: "${asset.title}"
Category: ${asset.category}
Current Word Count: ${wordCount}
Price: $${asset.price}
Current Short Description (${currentShortDesc.length} chars): "${currentShortDesc}"
Current Long Description (if any):
\`\`\`
${currentLongDesc}
\`\`\`


### CATEGORY CONTEXT:

Average top-performing word count: ${categoryVocabulary?.word_count_long?.median || 300} words
Average bullet points: ${categoryVocabulary?.bullet_count?.median || 5}
Common terms to include for SEO: ${topWords || 'N/A'}
Common tags to include for SEO: ${topTags || 'N/A'}
Median price in category: ${categoryVocabulary?.price?.median ? `$${categoryVocabulary.price.median}` : 'N/A'}

Use this context to match or exceed category performance standards.

---

${exemplarLongDescs ? `### EXEMPLAR LONG DESCRIPTIONS:
${exemplarLongDescs}` : ''}

---

### RESULT

Before finalizing, rephrase any overly formal or repetitive sentences. The final text should read as if crafted by a skilled Unity developer writing their own store page.

Generate long description suggestions with reasoning for each recommendation.`;
}