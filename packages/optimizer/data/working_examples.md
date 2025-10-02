# Working Examples of Updated AI Prompts

This document shows how the updated prompts would work with actual data from the exemplars system.

## Example 1: Title Suggestion for a 3D Asset

### Prompt with Actual Data:
```
SYSTEM: You generate Unity Asset Store listing titles that maximize clarity and conversion. You MUST ground suggestions in the provided exemplar vocabulary and successful exemplar patterns without copying them. Keep 60–75 characters if possible.

USER:
Current title: "Medieval House Pack"
Category: 3d
Key features: ["modular buildings", "PBR textures", "game ready", "medieval architecture"]
Constraints: keep important branded terms if any.

Exemplar vocabulary (from successful assets in this category):
- Top title words: ["city", "polygon", "low", "poly", "art", "synty", "kit"]
- Common title phrases: ["low poly", "poly art", "art synty", "game ready", "asset kit"]
- Optimal length: 22 characters (range: 16-45)

Top exemplars in this category:
1. "Bed game ready 3d model" (Quality Score: 344.1)
2. "POLYGON Apocalypse - Low Poly 3D Art by Synty" (Quality Score: 299.7)
3. "Stylized Forest Asset Kit" (Quality Score: 220.1)

Playbook recommendations:
- Use "kit" or "pack" terms (appear in top exemplars)
- Include "game ready" for quality signaling
- Consider "asset" for searchability

TASK: Propose 3 alternative titles. For each, explain the intent and which exemplar vocabulary items it covers. Reference which successful exemplar patterns you're following (by title, not copying).
```

### Expected AI Response:
```
1. **"Medieval Buildings Asset Kit"** (28 characters)
   - Intent: Follows the "Stylized Forest Asset Kit" pattern while incorporating "buildings" specificity
   - Vocabulary coverage: "asset", "kit" (from top title words)
   - Pattern reference: Mimics the successful "Asset Kit" structure from high-scoring exemplars

2. **"Game Ready Medieval Architecture Pack"** (35 characters)
   - Intent: Leads with quality signal "Game Ready" like "Bed game ready 3d model" exemplar
   - Vocabulary coverage: "game ready", "pack" (both from exemplar patterns)
   - Pattern reference: Follows the "Game Ready" prefix pattern from top-scoring exemplar

3. **"Modular Medieval City Builder Kit"** (32 characters)
   - Intent: Combines "city" (top word) with "modular" feature and "kit" structure
   - Vocabulary coverage: "city", "kit" (from top title words and successful patterns)
   - Pattern reference: Uses "city" prominence and "kit" ending like successful exemplars
```

## Example 2: Tags Suggestion for Audio Asset

### Prompt with Actual Data:
```
SYSTEM: You suggest 10–15 tags for Unity Asset Store listings, balancing high-signal category terms and specific use-cases. Avoid duplicates and banned words. Output a ranked list with reasons.

USER:
Current tags: ["ambient", "fantasy"]
Category: Audio

Exemplar vocabulary (from successful assets in this category):
- Common tags: ["nature sound", "horror ambience", "rpg games", "persona", "lake", "music"]
- Tag co-occurrence patterns: []
- Optimal tag count: 1

High-performing exemplars and their tags:
1. "Nature Sound FX" (Score: 210.3) - Tags: ["Nature Sound"]
2. "Tactical RPG - Audio pack" (Score: 88.9) - Tags: ["RPG GAMES"]
3. "Detective Adventure Urban RPG Music Pack" (Score: 88.4) - Tags: ["persona"]

Playbook recommendations:
- Single, focused tag performs best in this category
- "music" and "rpg" related tags show good performance
- Specific genre tags (horror, nature) outperform generic ones

TASK: Return JSON: [{"tag":"...","reason":"...","exemplar_reference":"..."}], ranked by expected discoverability in this category. Reference which exemplar patterns support your choices.
```

### Expected AI Response:
```json
[
  {
    "tag": "fantasy music",
    "reason": "Combines current 'fantasy' focus with 'music' from top exemplar vocabulary",
    "exemplar_reference": "Detective Adventure Urban RPG Music Pack shows music-focused tags perform well"
  },
  {
    "tag": "rpg ambient",
    "reason": "Merges 'ambient' with 'rpg' which appears in successful exemplars",
    "exemplar_reference": "Tactical RPG - Audio pack demonstrates RPG-focused tags achieve high scores"
  },
  {
    "tag": "fantasy soundtrack",
    "reason": "Builds on fantasy theme with soundtrack specificity",
    "exemplar_reference": "Top exemplars show genre-specific audio terms get better discovery"
  }
]
```

## Example 3: General Recommendations

### Prompt with Actual Data:
```
SYSTEM: Provide prioritized, concrete recommendations to improve listing conversion. Use exemplar benchmarks and playbook insights from peer patterns. Limit to 5–7 items total.

USER:
Current asset data:
- Title: "Basic Magic Effects"
- Category: Vfx
- Features: ["particle effects", "fire", "lightning"]
- Current metrics: images=3, videos=0, days_since_update=45, reviews=2, rating=4.0
- Price: $25.00

Category exemplar benchmarks:
- Average images: 8 (range: 1-15)
- Average quality score: 157.1
- Optimal pricing: $18.00 (range: $4.99-$39.99)
- 0% include videos

Playbook recommendations for this category:
- Use shader/effects terminology in title
- Include bullet points (~3 average)
- Show technical specifications
- Price in $15-29.99 sweet spot

Top exemplars in category (for reference):
1. "Gest LUT Pack" (Score: 284.7) - 122 reviews, 5.0 rating
2. "Amplify Shader Pack" (Score: 252.6) - 14 reviews, 5.0 rating

TASK: Output a prioritized checklist with estimated effort (S/M/L), expected impact (▲/▲▲/▲▲▲), and exemplar references. Compare against category benchmarks and cite specific exemplar patterns where relevant.
```

### Expected AI Response:
```
Priority Recommendations:

1. **Increase media coverage to 8+ images** (Effort: M, Impact: ▲▲▲)
   - Current: 3 images vs category average of 8
   - Reference: "Amplify Shader Pack" uses 10 images effectively
   - Action: Add effect showcases, before/after comparisons, technical breakdowns

2. **Revise title to include "Shader" or "Effects"** (Effort: S, Impact: ▲▲)
   - Current: "Basic Magic Effects" vs exemplar pattern "X Shader Pack"
   - Reference: Top exemplars use "Shader Pack" or "Effects" terminology
   - Action: Consider "Magic Shader Effects Pack" or "VFX Magic Pack"

3. **Add structured bullet points to description** (Effort: M, Impact: ▲▲)
   - Current: Likely unstructured vs ~3 bullet average in category
   - Reference: Successful exemplars show clear feature breakdowns
   - Action: List technical specs, compatibility, included effects count

4. **Optimize pricing to category sweet spot** (Effort: S, Impact: ▲)
   - Current: $25.00 vs optimal range $15-29.99 (you're at high end)
   - Reference: Category median is $18.00
   - Action: Consider $18-22 range for better conversion

5. **Build review momentum** (Effort: L, Impact: ▲▲▲)
   - Current: 2 reviews vs top exemplar with 122 reviews
   - Reference: "Gest LUT Pack" quality score correlates with review count
   - Action: Outreach to developers, improve quality based on feedback
```

## Key Improvements in These Examples:

1. **Data-Driven**: Uses actual exemplar statistics and vocabulary
2. **Specific References**: Cites actual exemplar titles and scores
3. **Benchmarking**: Compares against category-specific metrics
4. **Actionable**: Provides concrete steps with effort/impact ratings
5. **Pattern Recognition**: Shows how successful exemplars achieve their results
6. **Contextual**: Considers category-specific best practices from playbooks

These examples demonstrate how the updated prompts provide more targeted, data-backed suggestions compared to generic advice.