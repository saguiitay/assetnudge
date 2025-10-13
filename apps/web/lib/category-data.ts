export interface CategoryMetaData {
  slug: string
  name: string
  description: string
  overview: {
    marketSize: string
    competition: string
    averagePrice: string
  }
}


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
    },
    tags?: string[]
  }[]
  commonMistakes: {
    mistake: string
    impact: string
    solution: string
  }[]
}

export const categoryMetadata: CategoryMetaData[] = [
  {
    "slug": "2d",
    "name": "2D",
    "description": "Guidelines for creating standout 2D assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium – around 500–1000 assets",
      "competition": "Moderate–High competition – clear positioning matters",
      "averagePrice": "Around $14.0"
    }
  },
  {
    "slug": "2d-characters",
    "name": "2D/Characters",
    "description": "Guidelines for creating standout 2D/Characters assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $28"
    }
  },
  {
    "slug": "2d-environments",
    "name": "2D/Environments",
    "description": "Guidelines for creating standout 2D/Environments assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $25"
    }
  },
  {
    "slug": "2d-fonts",
    "name": "2D/Fonts",
    "description": "Guidelines for creating standout 2D/Fonts assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $11.0"
    }
  },
  {
    "slug": "2d-gui",
    "name": "2D/GUI",
    "description": "Guidelines for creating standout 2D/GUI assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $19"
    }
  },
  {
    "slug": "2d-gui-icons",
    "name": "2D/GUI/Icons",
    "description": "Guidelines for creating standout 2D/GUI/Icons assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $11"
    }
  },
  {
    "slug": "2d-textures-materials",
    "name": "2D/Textures & Materials",
    "description": "Guidelines for creating standout 2D/Textures & Materials assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Huge – over 2000 assets in category",
      "competition": "High competition – many similar tools available",
      "averagePrice": "Around $17.0"
    }
  },
  {
    "slug": "2d-textures-materials-abstract",
    "name": "2D/Textures & Materials/Abstract",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Abstract assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $8.0"
    }
  },
  {
    "slug": "2d-textures-materials-brick",
    "name": "2D/Textures & Materials/Brick",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Brick assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $10.0"
    }
  },
  {
    "slug": "2d-textures-materials-building",
    "name": "2D/Textures & Materials/Building",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Building assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $24.0"
    }
  },
  {
    "slug": "2d-textures-materials-concrete",
    "name": "2D/Textures & Materials/Concrete",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Concrete assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $10.0"
    }
  },
  {
    "slug": "2d-textures-materials-fabric",
    "name": "2D/Textures & Materials/Fabric",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Fabric assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $9.0"
    }
  },
  {
    "slug": "2d-textures-materials-floors",
    "name": "2D/Textures & Materials/Floors",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Floors assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $9.0"
    }
  },
  {
    "slug": "2d-textures-materials-food",
    "name": "2D/Textures & Materials/Food",
    "description": "Guidelines for publishing standout assets in the 2D/Textures & Materials/Food category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – around 700–1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $12"
    }
  },
  {
    "slug": "2d-textures-materials-glass",
    "name": "2D/Textures & Materials/Glass",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Glass assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $11.0"
    }
  },
  {
    "slug": "2d-textures-materials-metals",
    "name": "2D/Textures & Materials/Metals",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Metals assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $8.0"
    }
  },
  {
    "slug": "2d-textures-materials-nature",
    "name": "2D/Textures & Materials/Nature",
    "description": "Guidelines for publishing standout assets in the 2D/Textures & Materials/Nature category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – fewer than 700 assets in category",
      "competition": "Lower competition – room to stand out",
      "averagePrice": "Around $17"
    }
  },
  {
    "slug": "2d-textures-materials-roads",
    "name": "2D/Textures & Materials/Roads",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Roads assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $11.0"
    }
  },
  {
    "slug": "2d-textures-materials-roofing",
    "name": "2D/Textures & Materials/Roofing",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Roofing assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $9.0"
    }
  },
  {
    "slug": "2d-textures-materials-sky",
    "name": "2D/Textures & Materials/Sky",
    "description": "Guidelines for publishing standout assets in the 2D/Textures & Materials/Sky category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – fewer than 700 assets in category",
      "competition": "Lower competition – room to stand out",
      "averagePrice": "Around $12"
    }
  },
  {
    "slug": "2d-textures-materials-stone",
    "name": "2D/Textures & Materials/Stone",
    "description": "Guidelines for publishing standout assets in the 2D/Textures & Materials/Stone category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – fewer than 700 assets in category",
      "competition": "Lower competition – room to stand out",
      "averagePrice": "Around $9"
    }
  },
  {
    "slug": "2d-textures-materials-tiles",
    "name": "2D/Textures & Materials/Tiles",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Tiles assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 131 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $10"
    }
  },
  {
    "slug": "2d-textures-materials-water",
    "name": "2D/Textures & Materials/Water",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Water assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $10.0"
    }
  },
  {
    "slug": "2d-textures-materials-wood",
    "name": "2D/Textures & Materials/Wood",
    "description": "Guidelines for creating standout 2D/Textures & Materials/Wood assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $9.0"
    }
  },
  {
    "slug": "3d",
    "name": "3D",
    "description": "Guidelines for creating standout 3D assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium – around 500–1000 assets",
      "competition": "Moderate–High competition – clear positioning matters",
      "averagePrice": "Around $16.0"
    }
  },
  {
    "slug": "3d-animations",
    "name": "3D/Animations",
    "description": "Guidelines for creating standout 3D/Animations assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 1330 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $39"
    }
  },
  {
    "slug": "3d-characters-animals",
    "name": "3D/Characters/Animals",
    "description": "Guidelines for publishing standout assets in the 3D/Characters/Animals category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – around 700–1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $33"
    }
  },
  {
    "slug": "3d-characters-animals-birds",
    "name": "3D/Characters/Animals/Birds",
    "description": "Guidelines for creating standout 3D/Characters/Animals/Birds assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $24.0"
    }
  },
  {
    "slug": "3d-characters-animals-fish",
    "name": "3D/Characters/Animals/Fish",
    "description": "Guidelines for creating standout 3D/Characters/Animals/Fish assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $23.0"
    }
  },
  {
    "slug": "3d-characters-animals-insects",
    "name": "3D/Characters/Animals/Insects",
    "description": "Guidelines for creating standout 3D/Characters/Animals/Insects assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $26.0"
    }
  },
  {
    "slug": "3d-characters-animals-mammals",
    "name": "3D/Characters/Animals/Mammals",
    "description": "Guidelines for creating standout 3D/Characters/Animals/Mammals assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 838 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $31"
    }
  },
  {
    "slug": "3d-characters-animals-reptiles",
    "name": "3D/Characters/Animals/Reptiles",
    "description": "Guidelines for creating standout 3D/Characters/Animals/Reptiles assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $27.0"
    }
  },
  {
    "slug": "3d-characters-creatures",
    "name": "3D/Characters/Creatures",
    "description": "Guidelines for creating standout 3D/Characters/Creatures assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $34"
    }
  },
  {
    "slug": "3d-characters-humanoids",
    "name": "3D/Characters/Humanoids",
    "description": "Guidelines for creating standout 3D/Characters/Humanoids assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 1725 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $38"
    }
  },
  {
    "slug": "3d-characters-humanoids-fantasy",
    "name": "3D/Characters/Humanoids/Fantasy",
    "description": "Guidelines for creating standout 3D/Characters/Humanoids/Fantasy assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $32"
    }
  },
  {
    "slug": "3d-characters-humanoids-humans",
    "name": "3D/Characters/Humanoids/Humans",
    "description": "Guidelines for creating standout 3D/Characters/Humanoids/Humans assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 2062 assets",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $42"
    }
  },
  {
    "slug": "3d-characters-humanoids-robots",
    "name": "3D/Characters/Humanoids/Robots",
    "description": "Guidelines for creating standout 3D/Characters/Humanoids/Robots assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 644 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $22"
    }
  },
  {
    "slug": "3d-characters-humanoids-sci-fi",
    "name": "3D/Characters/Humanoids/Sci-Fi",
    "description": "Guidelines for creating standout 3D/Characters/Humanoids/Sci-Fi assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 1726 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $30"
    }
  },
  {
    "slug": "3d-environments-dungeons",
    "name": "3D/Environments/Dungeons",
    "description": "Guidelines for creating standout 3D/Environments/Dungeons assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 422 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $29"
    }
  },
  {
    "slug": "3d-environments-historic",
    "name": "3D/Environments/Historic",
    "description": "Guidelines for creating standout 3D/Environments/Historic assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium – around 500–1000 assets",
      "competition": "Moderate–High competition – clear positioning matters",
      "averagePrice": "Around $28.0"
    }
  },
  {
    "slug": "3d-environments-industrial",
    "name": "3D/Environments/Industrial",
    "description": "Guidelines for publishing standout assets in the 3D/Environments/Industrial category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small-Medium - around 700-1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $19"
    }
  },
  {
    "slug": "3d-environments-landscapes",
    "name": "3D/Environments/Landscapes",
    "description": "Guidelines for creating standout 3D/Environments/Landscapes assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 900 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $22"
    }
  },
  {
    "slug": "3d-environments-roadways",
    "name": "3D/Environments/Roadways",
    "description": "Guidelines for creating standout 3D/Environments/Roadways assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $22.0"
    }
  },
  {
    "slug": "3d-environments-urban",
    "name": "3D/Environments/Urban",
    "description": "Guidelines for creating standout 3D/Environments/Urban assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 1652 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $27"
    }
  },
  {
    "slug": "3d-props",
    "name": "3D/Props",
    "description": "Guidelines for publishing standout assets in the 3D/Props category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - many similar assets available",
      "averagePrice": "Around $14"
    }
  },
  {
    "slug": "3d-props-accessories",
    "name": "3D/Props/Accessories",
    "description": "Guidelines for creating standout 3D/Props/Accessories assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $15.0"
    }
  },
  {
    "slug": "3d-props-armor",
    "name": "3D/Props/Armor",
    "description": "Guidelines for creating standout 3D/Props/Armor assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $16.0"
    }
  },
  {
    "slug": "3d-props-clothing",
    "name": "3D/Props/Clothing",
    "description": "Guidelines for publishing standout assets in the 3D/Props/Clothing category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – fewer than 700 assets in category",
      "competition": "Lower competition – room to stand out",
      "averagePrice": "Around $14"
    }
  },
  {
    "slug": "3d-props-electronics",
    "name": "3D/Props/Electronics",
    "description": "Guidelines for publishing standout assets in the 3D/Props/Electronics category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small-Medium - around 700-1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $10"
    }
  },
  {
    "slug": "3d-props-exterior",
    "name": "3D/Props/Exterior",
    "description": "Guidelines for creating standout 3D/Props/Exterior assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 1367 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $14"
    }
  },
  {
    "slug": "3d-props-furniture",
    "name": "3D/Props/Furniture",
    "description": "Guidelines for creating standout 3D/Props/Furniture assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 1497 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $14"
    }
  },
  {
    "slug": "3d-props-guns",
    "name": "3D/Props/Guns",
    "description": "Guidelines for creating standout 3D/Props/Guns assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 959 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $16"
    }
  },
  {
    "slug": "3d-props-interior",
    "name": "3D/Props/Interior",
    "description": "Guidelines for creating standout 3D/Props/Interior assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 1523 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $17"
    }
  },
  {
    "slug": "3d-props-weapons",
    "name": "3D/Props/Weapons",
    "description": "Guidelines for creating standout 3D/Props/Weapons assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $15"
    }
  },
  {
    "slug": "3d-vegetation",
    "name": "3D/Vegetation",
    "description": "Guidelines for creating standout 3D/Vegetation assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 350 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $16"
    }
  },
  {
    "slug": "3d-vegetation-flowers",
    "name": "3D/Vegetation/Flowers",
    "description": "Guidelines for creating standout 3D/Vegetation/Flowers assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $8.0"
    }
  },
  {
    "slug": "3d-vegetation-plants",
    "name": "3D/Vegetation/Plants",
    "description": "Guidelines for creating standout 3D/Vegetation/Plants assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $13.0"
    }
  },
  {
    "slug": "3d-vegetation-trees",
    "name": "3D/Vegetation/Trees",
    "description": "Guidelines for creating standout 3D/Vegetation/Trees assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 611 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $11"
    }
  },
  {
    "slug": "3d-vehicles",
    "name": "3D/Vehicles",
    "description": "Guidelines for creating standout 3D/Vehicles assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 795 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $17"
    }
  },
  {
    "slug": "3d-vehicles-air",
    "name": "3D/Vehicles/Air",
    "description": "Guidelines for creating standout 3D/Vehicles/Air assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 686 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $41"
    }
  },
  {
    "slug": "3d-vehicles-land",
    "name": "3D/Vehicles/Land",
    "description": "Guidelines for publishing standout assets in the 3D/Vehicles/Land category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 1500-3000 assets in category",
      "competition": "Moderate to high competition",
      "averagePrice": "Around $19"
    }
  },
  {
    "slug": "3d-vehicles-space",
    "name": "3D/Vehicles/Space",
    "description": "Guidelines for publishing standout assets in the 3D/Vehicles/Space category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – around 700–1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $24"
    }
  },
  {
    "slug": "add-ons",
    "name": "Add-Ons",
    "description": "Guidelines for creating standout Add-Ons assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $25.0"
    }
  },
  {
    "slug": "add-ons-machine-learning",
    "name": "Add-Ons/Machine Learning",
    "description": "Guidelines for creating standout Add-Ons/Machine Learning assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $94.0"
    }
  },
  {
    "slug": "add-ons-services",
    "name": "Add-Ons/Services",
    "description": "Guidelines for creating standout Add-Ons/Services assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $0.0"
    }
  },
  {
    "slug": "add-ons-services-billing",
    "name": "Add-Ons/Services/Billing",
    "description": "Guidelines for creating standout Add-Ons/Services/Billing assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $42.0"
    }
  },
  {
    "slug": "audio",
    "name": "Audio",
    "description": "Guidelines for creating standout Audio assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 333 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $26"
    }
  },
  {
    "slug": "audio-ambient",
    "name": "Audio/Ambient",
    "description": "Guidelines for creating standout Audio/Ambient assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $21.0"
    }
  },
  {
    "slug": "audio-music",
    "name": "Audio/Music",
    "description": "Guidelines for creating standout Audio/Music assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - more than 3000 assets in category",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $25"
    }
  },
  {
    "slug": "audio-music-electronic",
    "name": "Audio/Music/Electronic",
    "description": "Guidelines for creating standout Audio/Music/Electronic assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 982 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $23"
    }
  },
  {
    "slug": "audio-music-orchestral",
    "name": "Audio/Music/Orchestral",
    "description": "Guidelines for creating standout Audio/Music/Orchestral assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 1149 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $26"
    }
  },
  {
    "slug": "audio-music-pop",
    "name": "Audio/Music/Pop",
    "description": "Guidelines for publishing standout assets in the Audio/Music/Pop category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - fewer than 700 assets in category",
      "competition": "Lower competition - room to stand out",
      "averagePrice": "Around $21"
    }
  },
  {
    "slug": "audio-music-rock",
    "name": "Audio/Music/Rock",
    "description": "Guidelines for creating standout Audio/Music/Rock assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $19.0"
    }
  },
  {
    "slug": "audio-music-world",
    "name": "Audio/Music/World",
    "description": "Guidelines for creating standout Audio/Music/World assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $28.0"
    }
  },
  {
    "slug": "audio-noise",
    "name": "Audio/Noise",
    "description": "Guidelines for creating standout Audio/Noise assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $18.0"
    }
  },
  {
    "slug": "audio-sound-fx",
    "name": "Audio/Sound FX",
    "description": "Guidelines for creating standout Audio/Sound FX assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 2276 assets",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $20"
    }
  },
  {
    "slug": "audio-sound-fx-foley",
    "name": "Audio/Sound FX/Foley",
    "description": "Guidelines for creating standout Audio/Sound FX/Foley assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 400 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $15"
    }
  },
  {
    "slug": "audio-sound-fx-transportation",
    "name": "Audio/Sound FX/Transportation",
    "description": "Guidelines for creating standout Audio/Sound FX/Transportation assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $17.0"
    }
  },
  {
    "slug": "audio-sound-fx-voices",
    "name": "Audio/Sound FX/Voices",
    "description": "Guidelines for publishing standout assets in the Audio/Sound FX/Voices category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - fewer than 700 assets in category",
      "competition": "Lower competition - room to stand out",
      "averagePrice": "Around $28"
    }
  },
  {
    "slug": "decentralization-infrastructure",
    "name": "Decentralization/Infrastructure",
    "description": "Guidelines for creating standout Decentralization/Infrastructure assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $0.0"
    }
  },
  {
    "slug": "essentials",
    "name": "Essentials",
    "description": "Guidelines for creating standout Essentials assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $0.0"
    }
  },
  {
    "slug": "essentials-tutorial-projects",
    "name": "Essentials/Tutorial Projects",
    "description": "Guidelines for creating standout Essentials/Tutorial Projects assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $178.0"
    }
  },
  {
    "slug": "templates",
    "name": "Templates",
    "description": "Guidelines for publishing standout assets in the Templates category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - fewer than 700 assets in category",
      "competition": "Lower competition - room to stand out",
      "averagePrice": "Around $16"
    }
  },
  {
    "slug": "templates-packs",
    "name": "Templates/Packs",
    "description": "Guidelines for creating standout Templates/Packs assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 1647 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $39"
    }
  },
  {
    "slug": "templates-systems",
    "name": "Templates/Systems",
    "description": "Guidelines for creating standout Templates/Systems assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium – around 500–1000 assets",
      "competition": "Moderate–High competition – clear positioning matters",
      "averagePrice": "Around $39.0"
    }
  },
  {
    "slug": "templates-tutorials",
    "name": "Templates/Tutorials",
    "description": "Guidelines for creating standout Templates/Tutorials assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $29.0"
    }
  },
  {
    "slug": "tools",
    "name": "Tools",
    "description": "Guidelines for publishing standout assets in the Tools category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small-Medium - around 700-1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $12"
    }
  },
  {
    "slug": "tools-ai-ml-integration",
    "name": "Tools/AI-ML Integration",
    "description": "Guidelines for creating standout Tools/AI-ML Integration assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $52.0"
    }
  },
  {
    "slug": "tools-animation",
    "name": "Tools/Animation",
    "description": "Guidelines for creating standout Tools/Animation assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $27.0"
    }
  },
  {
    "slug": "tools-behavior-ai",
    "name": "Tools/Behavior AI",
    "description": "Guidelines for publishing standout assets in the Tools/Behavior AI category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - fewer than 700 assets in category",
      "competition": "Lower competition - room to stand out",
      "averagePrice": "Around $27"
    }
  },
  {
    "slug": "tools-camera",
    "name": "Tools/Camera",
    "description": "Guidelines for creating standout Tools/Camera assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 278 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $22"
    }
  },
  {
    "slug": "tools-game-toolkits",
    "name": "Tools/Game Toolkits",
    "description": "Guidelines for creating standout Tools/Game Toolkits assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium – around 500–1000 assets",
      "competition": "Moderate–High competition – clear positioning matters",
      "averagePrice": "Around $34.0"
    }
  },
  {
    "slug": "tools-generative-ai",
    "name": "Tools/Generative AI",
    "description": "Guidelines for creating standout Tools/Generative AI assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $34.0"
    }
  },
  {
    "slug": "tools-input-management",
    "name": "Tools/Input Management",
    "description": "Guidelines for publishing standout assets in the Tools/Input Management category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - fewer than 700 assets in category",
      "competition": "Lower competition - room to stand out",
      "averagePrice": "Around $20"
    }
  },
  {
    "slug": "tools-integration",
    "name": "Tools/Integration",
    "description": "Guidelines for publishing standout assets in the Tools/Integration category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – around 700–1500 assets in category",
      "competition": "Moderate competition",
      "averagePrice": "Around $24"
    }
  },
  {
    "slug": "tools-level-design",
    "name": "Tools/Level Design",
    "description": "Guidelines for creating standout Tools/Level Design assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $28.0"
    }
  },
  {
    "slug": "tools-localization",
    "name": "Tools/Localization",
    "description": "Guidelines for creating standout Tools/Localization assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $17.0"
    }
  },
  {
    "slug": "tools-modeling",
    "name": "Tools/Modeling",
    "description": "Guidelines for creating standout Tools/Modeling assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 407 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $38"
    }
  },
  {
    "slug": "tools-network",
    "name": "Tools/Network",
    "description": "Guidelines for creating standout Tools/Network assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $52.0"
    }
  },
  {
    "slug": "tools-painting",
    "name": "Tools/Painting",
    "description": "Guidelines for creating standout Tools/Painting assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $30.0"
    }
  },
  {
    "slug": "tools-particles-effects",
    "name": "Tools/Particles & Effects",
    "description": "Guidelines for publishing standout assets in the Tools/Particles & Effects category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – fewer than 700 assets in category",
      "competition": "Lower competition – room to stand out",
      "averagePrice": "Around $23"
    }
  },
  {
    "slug": "tools-physics",
    "name": "Tools/Physics",
    "description": "Guidelines for creating standout Tools/Physics assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $25.0"
    }
  },
  {
    "slug": "tools-sprite-management",
    "name": "Tools/Sprite Management",
    "description": "Guidelines for creating standout Tools/Sprite Management assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 167 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $15"
    }
  },
  {
    "slug": "tools-terrain",
    "name": "Tools/Terrain",
    "description": "Guidelines for publishing standout assets in the Tools/Terrain category on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – fewer than 700 assets in category",
      "competition": "Lower competition – room to stand out",
      "averagePrice": "Around $36"
    }
  },
  {
    "slug": "tools-utilities",
    "name": "Tools/Utilities",
    "description": "Guidelines for creating standout Tools/Utilities assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 2854 assets",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $22"
    }
  },
  {
    "slug": "tools-version-control",
    "name": "Tools/Version Control",
    "description": "Guidelines for creating standout Tools/Version Control assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $16.0"
    }
  },
  {
    "slug": "tools-video",
    "name": "Tools/Video",
    "description": "Guidelines for creating standout Tools/Video assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $139.0"
    }
  },
  {
    "slug": "tools-visual-scripting",
    "name": "Tools/Visual Scripting",
    "description": "Guidelines for creating standout Tools/Visual Scripting assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small - around 153 assets",
      "competition": "Lower competition - good presentation can stand out quickly.",
      "averagePrice": "Around $33"
    }
  },
  {
    "slug": "vfx",
    "name": "VFX",
    "description": "Guidelines for creating standout VFX assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium – around 500–1000 assets",
      "competition": "Moderate–High competition – clear positioning matters",
      "averagePrice": "Around $23.0"
    }
  },
  {
    "slug": "vfx-environment",
    "name": "VFX/Environment",
    "description": "Guidelines for creating standout VFX/Environment assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small – around 100–200 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $11.0"
    }
  },
  {
    "slug": "vfx-fire-explosions",
    "name": "VFX/Fire & Explosions",
    "description": "Guidelines for creating standout VFX/Fire & Explosions assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $18.0"
    }
  },
  {
    "slug": "vfx-particles",
    "name": "VFX/Particles",
    "description": "Guidelines for creating standout VFX/Particles assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Medium - around 971 assets",
      "competition": "Moderate competition - differentiate with style, scale, or performance.",
      "averagePrice": "Around $13"
    }
  },
  {
    "slug": "vfx-shaders",
    "name": "VFX/Shaders",
    "description": "Guidelines for creating standout VFX/Shaders assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Large - around 2075 assets",
      "competition": "High competition - strong previews and niche positioning are key.",
      "averagePrice": "Around $18"
    }
  },
  {
    "slug": "vfx-shaders-directx-11",
    "name": "VFX/Shaders/DirectX 11",
    "description": "Guidelines for creating standout VFX/Shaders/DirectX 11 assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $25.0"
    }
  },
  {
    "slug": "vfx-shaders-fullscreen-camera-effects",
    "name": "VFX/Shaders/Fullscreen & Camera Effects",
    "description": "Guidelines for creating standout VFX/Shaders/Fullscreen & Camera Effects assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $18.0"
    }
  },
  {
    "slug": "vfx-shaders-substances",
    "name": "VFX/Shaders/Substances",
    "description": "Guidelines for creating standout VFX/Shaders/Substances assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Very small – fewer than 100 assets",
      "competition": "Lower competition – niche quality can stand out",
      "averagePrice": "Around $9.0"
    }
  },
  {
    "slug": "vfx-spells",
    "name": "VFX/Spells",
    "description": "Guidelines for creating standout VFX/Spells assets on the Unity Asset Store.",
    "overview": {
      "marketSize": "Small–Medium – a few hundred assets",
      "competition": "Moderate competition – strong previews and keywords help",
      "averagePrice": "Around $17.0"
    }
  }
];