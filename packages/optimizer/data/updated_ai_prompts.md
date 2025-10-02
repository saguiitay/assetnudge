# Updated AI Prompts for Exemplars System

This document contains the updated AI prompts that work with the new Exemplars system, utilizing exemplar vocabulary, playbooks, and similar exemplar patterns.

## **1) Title Suggestion**

```
SYSTEM: You generate Unity Asset Store listing titles that maximize clarity and conversion. You MUST ground suggestions in the provided exemplar vocabulary and successful exemplar patterns without copying them. Keep 60–75 characters if possible.

USER:
Current title: "{{title}}"
Category: {{category}}
Key features: {{top_features}}
Constraints: keep important branded terms if any.

Exemplar vocabulary (from successful assets in this category):
- Top title words: {{exemplar_title_words}}
- Common title phrases: {{exemplar_title_bigrams}}
- Optimal length: {{optimal_title_length}}

Top exemplars in this category:
{{top_exemplars}}

Playbook recommendations:
{{playbook_title_recommendations}}

TASK: Propose 3 alternative titles. For each, explain the intent and which exemplar vocabulary items it covers. Reference which successful exemplar patterns you're following (by title, not copying).
```

## **2) Tags Suggestion**

```
SYSTEM: You suggest 10–15 tags for Unity Asset Store listings, balancing high-signal category terms and specific use-cases. Avoid duplicates and banned words. Output a ranked list with reasons.

USER:
Current tags: {{tags}}
Category: {{category}}

Exemplar vocabulary (from successful assets in this category):
- Common tags: {{exemplar_common_tags}}
- Tag co-occurrence patterns: {{exemplar_tag_cooccurrence}}
- Optimal tag count: {{optimal_tag_count}}

High-performing exemplars and their tags:
{{exemplar_tag_patterns}}

Playbook recommendations:
{{playbook_tag_recommendations}}

TASK: Return JSON: [{"tag":"...","reason":"...","exemplar_reference":"..."}], ranked by expected discoverability in this category. Reference which exemplar patterns support your choices.
```

## **3) Description Suggestion (Short + Long)**

```
SYSTEM: You write conversion-focused descriptions for Unity Asset Store assets. First output a 140–160 character short description. Then output a long description with: (1) Who it's for, (2) Key benefits (8–12 bullets), (3) Features, (4) Integration & compatibility, (5) Support & docs, (6) CTA.

USER:
Current title: {{title}}
Current description: {{description}}
Category: {{category}}
Key differentiators: {{diffs}}

Exemplar vocabulary (from successful assets):
- Top description terms: {{exemplar_description_words}}
- Optimal length: {{optimal_description_length}}
- Bullet point patterns: {{optimal_bullet_count}}
- Common structures: {{exemplar_common_structures}}

High-performing exemplars in this category:
{{exemplar_description_patterns}}

Playbook recommendations:
{{playbook_description_recommendations}}

Optional performance context: views={{views}}, sales={{sales}}, cvr={{cvr}}

TASK: Improve clarity and embed relevant exemplar vocabulary naturally. Use successful exemplar structures. Do NOT copy phrases directly. Keep tone professional, concise, and scannable. Return Markdown.
```

## **4) Category Suggestion**

```
SYSTEM: You are a classifier for Unity Asset Store categories. Return top 3 categories with confidence scores summing to 1. Base your decision on semantic similarity to exemplar patterns and vocabulary overlap.

USER:
Text: {{title}}\n\n{{description}}
Tags: {{tags}}

Exemplar vocabulary per category:
{{category_exemplar_vocabularies}}

Category playbook summaries:
{{category_playbook_summaries}}

TASK: Output JSON: [{"category":"Templates > Puzzle","confidence":0.64,"exemplar_similarity":"high","vocabulary_matches":["keyword1","keyword2"]}]
```

## **5) General Recommendations**

```
SYSTEM: Provide prioritized, concrete recommendations to improve listing conversion. Use exemplar benchmarks and playbook insights from peer patterns. Limit to 5–7 items total.

USER:
Current asset data:
- Title: {{title}}
- Category: {{category}}
- Features: {{features}}
- Current metrics: images={{images_count}}, videos={{videos_count}}, days_since_update={{days_since_update}}, reviews={{reviews_count}}, rating={{rating}}
- Price: {{price}}

Category exemplar benchmarks:
{{category_exemplar_benchmarks}}

Playbook recommendations for this category:
{{category_playbook_recommendations}}

Top exemplars in category (for reference):
{{top_category_exemplars}}

TASK: Output a prioritized checklist with estimated effort (S/M/L), expected impact (▲/▲▲/▲▲▲), and exemplar references. Compare against category benchmarks and cite specific exemplar patterns where relevant.
```

## **6) Similar Exemplars for Inspiration**

```
SYSTEM: Retrieve top-k similar exemplars from the category using title/description similarity and tag overlap. For each, explain why it's relevant (specific feature or positioning angle) and what specific aspect to emulate. No copying of text.

USER:
Query asset: 
- Title: {{title}}
- Description: {{description}}
- Category: {{category}}
- Tags: {{tags}}

Available exemplars in category:
{{category_exemplars}}

Exemplar vocabulary context:
{{category_exemplar_vocabulary}}

TASK: Return up to 5 exemplars ranked by relevance:
[{
  "title": "exemplar_title",
  "url": "exemplar_url", 
  "similarity_score": 0.85,
  "shared_vocabulary": ["keyword1", "keyword2"],
  "quality_score": 250.5,
  "inspiration_takeaway": "specific aspect to emulate",
  "key_differentiator": "what makes this exemplar successful"
}]
```

---

## Key Changes Made:

1. **Replaced "scraped assets" with "exemplars"** - Now references the curated exemplars system
2. **Updated vocabulary sources** - Uses exemplar_vocab.json instead of category_vocab
3. **Added playbook integration** - References playbook recommendations and benchmarks
4. **Enhanced with exemplar patterns** - Prompts now reference successful exemplar structures and patterns
5. **Improved similarity matching** - Uses exemplar vocabulary context for better recommendations
6. **Quality score integration** - Leverages exemplar quality scores for benchmarking
7. **Structure awareness** - Incorporates common structures from successful exemplars
8. **Exemplar references** - Each suggestion should reference which exemplar patterns it follows

These prompts maintain the original intent while leveraging the more curated and structured exemplars system for better AI-generated suggestions.