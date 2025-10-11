export interface CategoryData {
  slug: string
  name: string
  description: string
  overview: {
    marketSize: string
    competition: string
    averagePrice: string
  }
  recommendations: {
    title: {
      optimalLength: string
      tips: string[]
      examples: {
        good: string[]
        bad: string[]
      }
    }
    description: {
      optimalLength: string
      structure: string[]
      tips: string[]
      example: string
    }
    images: {
      optimalCount: string
      requirements: string[]
      tips: string[]
    }
    tags: {
      optimalCount: string
      commonTags: string[]
      tips: string[]
    }
    keywords: {
      primary: string[]
      secondary: string[]
      tips: string[]
    }
    pricing: {
      range: string
      strategy: string[]
    }
  }
  realExamples: {
    name: string
    publisher: string
    whyItWorks: string[]
    metrics: {
      titleLength: number
      descriptionLength: number
      imageCount: number
      tagCount: number
    }
  }[]
  commonMistakes: {
    mistake: string
    impact: string
    solution: string
  }[]
}

export const categoryData: Record<string, CategoryData> = {
  "3d-models": {
    slug: "3d-models",
    name: "3D Models",
    description: "High-quality 3D models and meshes for games, simulations, and interactive experiences in Unity.",
    overview: {
      marketSize: "Largest category on Unity Asset Store with 15,000+ assets",
      competition: "Very High - requires strong differentiation",
      averagePrice: "$15-$50 for individual models, $50-$150 for packs",
    },
    recommendations: {
      title: {
        optimalLength: "40-60 characters (5-8 words)",
        tips: [
          "Include the asset type (Character, Vehicle, Prop, etc.)",
          "Mention the style (Low Poly, Realistic, Stylized, PBR)",
          "Add key features (Animated, Rigged, Modular)",
          'Avoid generic terms like "Pack" or "Bundle" alone',
          'Use numbers for packs (e.g., "50 Medieval Props")',
        ],
        examples: {
          good: [
            "Realistic PBR Character - Sci-Fi Soldier",
            "Low Poly Nature Pack - 100+ Assets",
            "Modular Dungeon Kit - Fantasy RPG",
            "Animated Animals - Farm Collection",
          ],
          bad: ["Cool 3D Model", "Asset Pack", "My First Model Collection", "Best Models Ever!!!"],
        },
      },
      description: {
        optimalLength: "500-1,500 words",
        structure: [
          "Opening hook (1-2 sentences about the problem it solves)",
          "Key features list (bullet points)",
          "Technical specifications (poly count, texture resolution, file formats)",
          "What's included (detailed asset list)",
          "Use cases and examples",
          "Compatibility information (Unity versions, render pipelines)",
          "Support and updates policy",
        ],
        tips: [
          "Front-load important information in the first 150 characters",
          "Use bullet points for scannability",
          "Include specific numbers (poly counts, texture sizes)",
          "Mention render pipeline compatibility (URP, HDRP, Built-in)",
          "Add keywords naturally throughout the text",
          "Include a call-to-action",
          "Format with headers and sections",
        ],
        example: `Transform your game with this comprehensive Medieval Village Pack featuring 120+ optimized 3D models perfect for RPGs and adventure games.

KEY FEATURES:
• 120+ unique medieval assets (buildings, props, vegetation)
• Optimized for mobile and PC (500-5000 tris per model)
• PBR textures (2K and 4K options included)
• Modular building system for endless combinations
• LOD levels for all major assets

TECHNICAL SPECIFICATIONS:
• Polygon count: 500-5,000 tris per asset
• Texture resolution: 2048x2048 and 4096x4096
• Formats: FBX, OBJ included
• Materials: PBR workflow (Albedo, Normal, Metallic, Roughness)

WHAT'S INCLUDED:
[Detailed list of assets...]

Compatible with Unity 2020.3+ and all render pipelines (URP, HDRP, Built-in).`,
      },
      images: {
        optimalCount: "8-15 high-quality screenshots",
        requirements: [
          "First image is the most important - make it compelling",
          "Resolution: Minimum 1920x1080, recommended 2560x1440",
          "Show assets in actual game environments, not just white backgrounds",
          "Include wireframe views to show topology",
          "Display texture maps and material breakdowns",
          "Show scale references with Unity primitives",
          "Demonstrate different lighting conditions",
          "Include UI/inspector screenshots showing asset organization",
        ],
        tips: [
          "Use professional lighting and post-processing",
          "Show variety - different angles, contexts, and use cases",
          "Include text overlays highlighting key features",
          "Demonstrate modularity and customization options",
          "Show before/after or comparison shots",
          "Keep branding subtle but consistent",
          "Optimize file sizes without sacrificing quality",
        ],
      },
      tags: {
        optimalCount: "15-20 relevant tags",
        commonTags: [
          "3D",
          "Models",
          "Characters",
          "Props",
          "Environment",
          "Low Poly",
          "PBR",
          "Modular",
          "Optimized",
          "Mobile",
          "Fantasy",
          "Sci-Fi",
          "Medieval",
          "Modern",
          "Realistic",
          "Stylized",
          "Rigged",
          "Animated",
          "Textured",
          "Game Ready",
        ],
        tips: [
          'Mix broad and specific tags (e.g., "3D" + "Medieval Sword")',
          "Include style descriptors (Low Poly, Realistic, Cartoon)",
          "Add genre tags (RPG, FPS, Strategy)",
          "Use technical tags (PBR, Rigged, LOD)",
          "Include platform tags if optimized (Mobile, VR, PC)",
          "Research competitor tags for popular assets",
          "Avoid redundant or overly generic tags",
        ],
      },
      keywords: {
        primary: [
          "3d models unity",
          "unity 3d assets",
          "game ready models",
          "pbr models unity",
          "low poly models",
          "unity character models",
          "unity environment assets",
        ],
        secondary: [
          "optimized 3d models",
          "modular 3d assets",
          "unity asset store models",
          "game development assets",
          "unity props",
          "mobile optimized models",
          "unity rpg assets",
        ],
        tips: [
          "Use long-tail keywords (3-4 words) for better targeting",
          'Include "unity" in primary keywords',
          "Research keywords using Unity Asset Store search",
          'Consider developer pain points (e.g., "optimized for mobile")',
          "Use keywords in title, description, and tags naturally",
          "Monitor trending keywords in your category",
          "Include render pipeline names (URP, HDRP) when relevant",
        ],
      },
      pricing: {
        range: "$10-$150 depending on complexity and quantity",
        strategy: [
          "Individual models: $5-$25",
          "Small packs (10-30 assets): $20-$50",
          "Large packs (50-100+ assets): $50-$150",
          "Premium/AAA quality: $100-$300",
          "Consider introductory pricing (20-30% off for first month)",
          "Bundle related packs for higher value",
          "Price competitively but don't undervalue your work",
        ],
      },
    },
    realExamples: [
      {
        name: "Polygon Apocalypse - Low Poly Zombie Pack",
        publisher: "Synty Studios",
        whyItWorks: [
          "Clear, descriptive title that includes style (Low Poly) and theme (Zombie)",
          "Consistent art style that's immediately recognizable",
          "Comprehensive pack with 100+ models providing great value",
          "Excellent screenshots showing assets in game environments",
          "Detailed technical specifications in description",
          "Part of a larger ecosystem of compatible assets",
        ],
        metrics: {
          titleLength: 45,
          descriptionLength: 1200,
          imageCount: 12,
          tagCount: 18,
        },
      },
      {
        name: "Realistic Tree 9 - PBR",
        publisher: "BK Production",
        whyItWorks: [
          "Numbered series builds brand recognition",
          "PBR in title signals quality and modern workflow",
          "Photorealistic quality clearly demonstrated in screenshots",
          "Multiple LOD levels mentioned prominently",
          "Includes wind animation shaders",
          "Shows performance metrics in description",
        ],
        metrics: {
          titleLength: 24,
          descriptionLength: 800,
          imageCount: 10,
          tagCount: 15,
        },
      },
      {
        name: "Modular Sci-Fi Hallway - PBR",
        publisher: "Vertex Studio",
        whyItWorks: [
          "Modular in title attracts developers looking for flexibility",
          "Clear genre specification (Sci-Fi)",
          "Demonstrates modularity with multiple configuration examples",
          "Includes lighting setup examples",
          "Shows texture maps and material breakdown",
          "Provides piece count and dimensions",
        ],
        metrics: {
          titleLength: 32,
          descriptionLength: 950,
          imageCount: 14,
          tagCount: 17,
        },
      },
    ],
    commonMistakes: [
      {
        mistake: 'Using generic titles like "3D Model Pack" or "Asset Bundle"',
        impact: "Low discoverability, no differentiation from thousands of other assets",
        solution:
          "Be specific about style, theme, and contents. Use descriptive adjectives and include key features in the title.",
      },
      {
        mistake: "Only showing models on white/gray backgrounds",
        impact: "Buyers can't visualize assets in actual game contexts, reducing conversion",
        solution: "Create demo scenes showing assets in realistic game environments with proper lighting and context.",
      },
      {
        mistake: "Not specifying polygon counts or technical details",
        impact: "Developers can't assess if assets fit their performance requirements",
        solution:
          "Always include poly counts, texture resolutions, file formats, and performance considerations in the description.",
      },
      {
        mistake: "Using too few or irrelevant tags",
        impact: "Poor search visibility and missed opportunities for discovery",
        solution:
          "Use all available tag slots with a mix of broad, specific, style, and technical tags relevant to your asset.",
      },
      {
        mistake: "Writing short, vague descriptions (under 300 words)",
        impact: "Insufficient information for buyers, poor SEO, lower trust",
        solution:
          "Write comprehensive 500-1,500 word descriptions with clear structure, bullet points, and all technical details.",
      },
      {
        mistake: "Not mentioning render pipeline compatibility",
        impact: "Developers unsure if assets work with their project setup",
        solution:
          "Clearly state compatibility with URP, HDRP, and Built-in render pipelines. Provide setup instructions if needed.",
      },
      {
        mistake: "Pricing too low to compete on price alone",
        impact: "Devalues your work, attracts wrong customers, unsustainable",
        solution:
          "Price based on quality, quantity, and value provided. Focus on differentiation rather than being the cheapest.",
      },
    ],
  },
}
