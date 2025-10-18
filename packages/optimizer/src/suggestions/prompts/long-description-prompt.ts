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
- Asset grading system requirements for maximum scores

CRITICAL LONG DESCRIPTION OPTIMIZATION GUIDELINES:

1. WORD COUNT (EXCLUDING HTML TAGS):
   - Write at least the category median word count (will be provided in user prompt)
   - Ensure at least 60% content density (actual text vs HTML markup)
   - Count only actual text content, not HTML tags or formatting

2. REQUIRED CONTENT ELEMENTS:
   - Include at least the minimum bullet points for the category
   - Add clear Call-to-Action with action words: "buy", "get", "download", "try", "start", "upgrade", "contact", "discord", "documentation"
   - Include quality support links (Discord, GitHub, documentation, tutorials, guides, YouTube demos)
   - Ensure strong opening value proposition

3. VALUE PROPOSITION LANGUAGE:
   - Purpose words: "for", "to", "help", "enable", "allows", "create", "build"
   - Tool descriptors: "pack", "set", "asset", "package", "collection", "kit", "system", "tool"
   - Quality descriptors: "best", "perfect", "ultimate", "complete", "professional", "advanced", "powerful"
   - Feature words: "includes", "contains", "features", "offers", "provides"
   - Benefit words: "save", "improve", "boost", "enhance", "optimize"
   - Game development terms: "game", "unity", "project", "developer", "development"

4. TRUST SIGNALS:
   - Include documentation or support links
   - Mention version information and updates
   - Add compatibility information (Unity versions, LTS support)
   - Include performance details, source code availability

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
   - Strong, benefit-driven reason to purchase with action words
   - Include support links (Discord, documentation, GitHub)
   - Example: *"Save hours of coding time and ship faster—download Dice Roller Pro today and join our Discord community for support."*

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
- Use occasional transition phrases ("Moreover", "Even better", "In practice")
- Avoid emoji overload — 0-1 per major section max
- Ensure the tone reads like *real human marketing copy*, not auto-generated text
- Verify word count meets category requirements (excluding HTML tags)
- Ensure all required grading elements are included

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
  // Count words excluding HTML tags
  const textContent = currentLongDesc.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;

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

  const topUnigrams = categoryVocabulary?.top_unigrams?.slice(0, 8).map((w: any) => w.t).join(', ') || '';
  const topBigrams = categoryVocabulary?.top_bigrams?.slice(0, 5).map((w: any) => w.t).join(', ') || '';
  const commonStructures = categoryVocabulary?.common_structures?.slice(0, 3).join(', ') || '';

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


### CATEGORY CONTEXT & GRADING REQUIREMENTS:

WORD COUNT (EXCLUDING HTML TAGS):
- Current word count: ${wordCount} words (HTML tags excluded)
- Target word count: ${categoryVocabulary?.word_count_long?.median || 300}+ words
- Minimum for good scores: ${categoryVocabulary?.word_count_long?.min || 150} words
- Content density requirement: 60%+ (actual text vs HTML markup)

CONTENT REQUIREMENTS:
- Minimum bullet points: ${categoryVocabulary?.bullet_count?.median || 5}
- Must include clear Call-to-Action with action words
- Must include quality support links (Discord, GitHub, documentation, tutorials)
- Must have strong opening value proposition

CATEGORY VOCABULARY FOR SEO:
- High-value description words: ${topWords || 'N/A'}
- Top category unigrams: ${topUnigrams || 'N/A'}
- Top category bigrams: ${topBigrams || 'N/A'}
- Common tags to include: ${topTags || 'N/A'}
- Common structures: ${commonStructures || 'N/A'}

CATEGORY BENCHMARKS:
- Median price: ${categoryVocabulary?.price?.median ? `$${categoryVocabulary.price.median}` : 'N/A'}
- Images count: ${categoryVocabulary?.med_images || 'N/A'}
- Videos count: ${categoryVocabulary?.med_videos || 'N/A'}
- Video presence: ${categoryVocabulary?.has_video_percentage ? `${categoryVocabulary.has_video_percentage}%` : 'N/A'}

Use this context to match or exceed category performance standards and optimize for grading scores.

---

${exemplarLongDescs ? `### EXEMPLAR LONG DESCRIPTIONS:
${exemplarLongDescs}` : ''}

---

### GRADING OPTIMIZATION FOCUS

Generate long description suggestions that maximize asset grading scores:

1. CONTENT QUALITY:
   - Meet or exceed category word count requirements (excluding HTML tags)
   - Include required bullet points and Call-to-Action elements
   - Ensure 60%+ content density (text vs markup ratio)
   - Use strong value proposition language throughout

2. TRUST SIGNALS:
   - Include quality support links (Discord, GitHub, documentation, tutorials, YouTube)
   - Mention version information, compatibility, and updates
   - Add technical details that build credibility

3. KEYWORD OPTIMIZATION:
   - Naturally incorporate high-value category vocabulary
   - Use relevant unigrams, bigrams, and game development terms
   - Follow proven structural patterns from exemplars

4. PROFESSIONAL PRESENTATION:
   - Maintain natural, developer-focused tone
   - Vary sentence structure and use transition phrases
   - Balance technical details with clear benefits

Before finalizing, rephrase any overly formal or repetitive sentences. The final text should read as if crafted by a skilled Unity developer writing their own store page while optimizing for maximum grading scores.

For each suggestion, provide detailed reasoning explaining how it improves the grading score across content quality, trust signals, findability, and professional presentation dimensions.`;
}