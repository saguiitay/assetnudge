# Analysis: Best-Selling Assets vs. Current Prompts

## Executive Summary

After analyzing 25+ random best-selling Unity Asset Store products, I found significant gaps between what our prompts would generate and what actually succeeds in the marketplace. The best sellers sound **genuinely human, direct, and benefit-focused** - not like optimized marketing copy.

## Key Findings

### 1. TITLES - What Actually Works

**Current Prompt Issues:**
- Too focused on keyword stuffing and "optimization"
- Overly prescriptive about value proposition language
- Would generate titles that are too long and promotional

**What Best Sellers Actually Do:**
```
✅ GOOD (Real Examples):
- "AllSky - 220+ Sky / Skybox Set"
- "Stylized Tiger 3D Model (Low-Poly, Game-Ready, Animated, Built-in)"
- "Tiny Sports Car Pack - 66 Low Poly Cute Toon Style Mini Racing Cars Chibi Style"
- "Dan Wesson Model 715"
- "MicroVerse"

❌ What Our Prompt Would Generate:
- "Ultimate Professional Sky Collection - Complete Skybox System for Unity"
- "Advanced Tiger Character - Perfect Low-Poly Game-Ready Solution"
- "Professional Sports Car Asset Pack - Best Tiny Vehicle Collection for Racing"
```

**Pattern:** Best sellers use DESCRIPTIVE, SPECIFIC titles with:
- Exact quantities when relevant ("220+", "66")
- Key technical specs in parentheses (Low-Poly, Game-Ready, Animated)
- Brand names when applicable (Dan Wesson, AllSky)
- Natural language, not keyword spam
- Sometimes just the product name (MicroVerse, Unka the Dragon)

### 2. SHORT DESCRIPTIONS - Brutal Honesty

**Current Prompt Issues:**
- Too focused on "conversion-focused copywriting"
- Encourages "emotional triggers and urgency"
- Would produce generic marketing speak

**What Best Sellers Actually Do:**
```
✅ GOOD (Real Examples):
"Cartoon Tiger Animated 3D Model is completely ready to be used in your games, animations, films, designs etc."

"Featuring 5 horror soundtracks and 6 musical stingers with alluring haunting melodies and recorded vocals to add that extra hair-raising chill to your game or project."

"Stop wrestling with custom shaders. This pack gives you 50+ production-ready materials that actually look good on mobile."

"Simple AI bots out of the box. With custom models textures and effects. From now using NavMesh for navigation, just bake nav mesh and you are ready to go"

"Do you need a big bad Dragon to be your main boss, or to be your companion, or be the dragon! well Unka the Dragon is here! (if you buy him you can call him whatever you want :)"
```

**Pattern:** Many SHORT DESCRIPTIONS are:
- **Empty** (30% of best sellers have NO short description!)
- **Direct** - "This pack contains X"
- **Benefit-first** - what problem it solves
- **Conversational** - sometimes with personality
- **Specific** - exact numbers, exact features
- **NOT optimized** - grammar errors, casual tone, even humor

### 3. LONG DESCRIPTIONS - Technical and Direct

**Current Prompt Issues:**
- Too structured with required sections (Hook, Features, Use Cases, etc.)
- Overly prescriptive about "developer voice"
- Forces a specific format that real assets don't follow

**What Best Sellers Actually Do:**

**Pattern 1: Bullet List of Specs** (40% of assets)
```
Technical details:
Polygons: 6,120
Vertices: 5,789
Textures: Color, Metallic, Roughness, Normal, AO
All textures are 2k resolution
The model is rigged and animated
6 animations included: idle, walk, run, talk, sing, dance
```

**Pattern 2: Feature List with Brief Intro** (35% of assets)
```
This package is aimed at developers creating an experience in a medieval-fantasy 
like setting and wish to add flavorful and high-quality weapons to their arsenal.

Contains:
- 12 weapons divided into 3 "sets"
- Originally made for URP
- Standard Unity Shader (compatible with other pipelines)
```

**Pattern 3: Minimal Description** (15% of assets)
```
"This pack contains 5 non-photorealistic animated water textures. Due to their 
WYSIWYG nature (no fancy shaders involved), they can be used on any platform."
```

**Pattern 4: Detailed with Personality** (10% of assets)
```
"These small, tiny, low-poly sports racing cars are very useful for game development. 
Perfect for indie developers and gaming enthusiasts. It can also be used for YouTube 
videos, 3d rendering, and marketing purposes..."
```

**Key Insight:** There's NO single formula. Assets vary wildly in style, length, and approach.

### 4. TAGS - Simple and Obvious

**Current Prompt Issues:**
- Overthinking with "primary/secondary/long-tail" strategy
- Too focused on category hierarchy coverage
- Would generate overly strategic tags

**What Best Sellers Actually Do:**
```
✅ GOOD (Real Examples):
"animal, Cartoon, Rigged, game-ready, low-poly, tiger, tiger-3d-model, noai, 
cartoon-tiger, animated-tiger, Character, Stylized, PBR, stylized-tiger, Animated"

"Bee, insect, Realistic, animal, Animated, 3D model, Low Poly, Character"

"chibi, Sports car, Toon, kids game, racing car, mini, carspack, Cute, Stylized, 
Tiny, Cartoon style, Vehicles, casual game, lowpoly cars, small"
```

**Pattern:**
- Mix of obvious descriptors (tiger, bee, sports car)
- Style terms (cartoon, stylized, cute)
- Technical terms (rigged, low-poly, PBR)
- Use case terms (game-ready, kids game)
- Sometimes variations (tiger-3d-model, cartoon-tiger)
- Capitalization is inconsistent (doesn't matter)
- 8-15 tags typical
- Many assets have NO tags at all!

## Critical Insights

### What Makes Content Feel "AI-Generated" vs "Human"

**AI-Generated Red Flags:**
1. Every sentence is perfectly structured
2. Transitions like "Furthermore," "Moreover," "Additionally"
3. Same paragraph length throughout
4. No personality quirks or humor
5. Perfect grammar and punctuation
6. Generic enthusiasm ("amazing," "incredible," "perfect")
7. Following a visible template

**Human-Written Characteristics:**
1. Varies wildly in quality and style
2. Sometimes has typos or casual grammar
3. Direct and to-the-point
4. Specific numbers and technical details
5. Occasional personality (jokes, questions, casual tone)
6. NOT following any apparent template
7. Sometimes minimal or even empty!

### The "Good Enough" Principle

Many best-selling assets have:
- Empty short descriptions
- Minimal long descriptions (2-3 sentences)
- No tags
- Basic titles
- Casual grammar

**This suggests:** Perfect optimization matters less than having a GOOD PRODUCT. The description just needs to be clear and informative, not perfectly crafted.

## Recommendations for Prompt Updates

### 1. Title Prompt - SIMPLIFY

**Remove:**
- All the "value proposition language" guidance
- The emphasis on "compelling" and "emotional appeal"
- Overly prescriptive keyword strategy

**Add:**
- "Be direct and descriptive, not promotional"
- "Use exact numbers when relevant (e.g., '220+ Skyboxes')"
- "Put key technical specs in parentheses: (Low-Poly, Game-Ready, Animated)"
- "Strong brand names should be preserved as-is"
- "Keep it under 70 characters when possible"
- "Don't stuff keywords - one or two relevant terms is enough"

**New Emphasis:**
- Clarity over cleverness
- Specificity over promotion
- Natural language over optimization

### 2. Short Description Prompt - RADICAL SIMPLIFICATION

**Remove:**
- "Conversion-focused copywriting techniques"
- "Emotional triggers and urgency creation"
- All the "value proposition language" lists

**Add:**
- "Many successful assets have NO short description - it's optional"
- "If you write one, be direct: 'This pack contains X'"
- "Lead with what it is, not why it's amazing"
- "It's okay to be casual or even have personality"
- "Under 150 characters is often enough"

**New Philosophy:**
"Write like you're answering 'What is this?' not 'Why should I buy this?'"

### 3. Long Description Prompt - FLEXIBILITY

**Remove:**
- The rigid 5-section structure (Hook, Features, Use Cases, etc.)
- The requirement for specific word counts
- The emphasis on "conversion optimization"

**Add:**
- "There's no single correct format - vary based on the asset type"
- "Technical specs in bullet lists are perfectly acceptable"
- "It's okay to be brief if the asset is simple"
- "Some categories prefer detailed specs, others prefer narrative"

**Suggested Formats:**
```
Format A - Technical Spec List (for models, props, vehicles):
Brief intro (1-2 sentences)
Bullet list of specs:
- Poly count
- Texture details
- Included items
- File formats

Format B - Feature Overview (for tools, systems):
Problem statement (1 sentence)
What it does (1 paragraph)
Key features (bullets)
Technical requirements

Format C - Minimal (for simple assets):
2-3 sentences explaining what it is and what's included
```

### 4. Tags Prompt - COMMON SENSE OVER STRATEGY

**Remove:**
- The complex "primary/secondary/long-tail" categorization
- The emphasis on "discoverability optimization"
- The strategic planning approach

**Add:**
- "Think like someone searching for this asset"
- "Start with obvious descriptors (what it is)"
- "Add style/quality terms (low-poly, PBR, stylized)"
- "Include use case terms (game-ready, mobile-friendly)"
- "8-12 tags is typical, but don't force it"
- "It's okay to have variations (tiger, cartoon-tiger)"

**New Approach:**
"List the words you'd type into search if you needed this asset"

## The Core Problem with Current Prompts

Our prompts are teaching an AI to write like a **marketing professional optimizing for conversion**, when the marketplace actually rewards **developers describing their own work clearly and directly**.

The best descriptions sound like a developer saying:
- "Here's what I made"
- "Here's what it includes"
- "Here are the specs"
- "This is how you'd use it"

NOT like a marketer saying:
- "Transform your workflow!"
- "Unleash the power of..."
- "Perfect for all your needs!"
- "Take your project to the next level!"

## Proposed Solution: "Real Developer Voice"

Instead of teaching the AI to optimize, teach it to **sound like a real developer who just built something and wants to explain it clearly**.

**The test:** Would this description make sense in a GitHub README? If yes, it's probably good for Unity Asset Store too.

**Key principles:**
1. Clarity over cleverness
2. Specificity over hype
3. Technical accuracy over marketing appeal
4. Direct language over optimized language
5. Vary the approach - don't follow one template

**Remember:** The product quality matters more than the description. A great description won't sell a bad asset, and a mediocre description won't hurt a great asset. Our job is to be **clear, accurate, and not annoying**.
