import { notFound } from "next/navigation"
import type { CategoryData } from "@/lib/category-data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { CTASection } from "../../components/cta-section"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ImageIcon,
  Tag,
  FileText,
  Target,
} from "lucide-react"
import type { Metadata } from "next"
import { env } from "@/env"

interface PageProps {
  params: Promise<{ slug: string }>
}

// Helper function to dynamically load category data
async function loadCategoryData(slug: string): Promise<CategoryData | null> {
  try {
    const categoryModule = await import(`@/lib/category-data/${slug}`)
    return categoryModule.default
  } catch (error) {
    console.error(`Failed to load category data for slug: ${slug}`, error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await loadCategoryData(slug)

  if (!category) {
    return {
      title: "Category Not Found",
    }
  }

  return {
    title: `${category.name} Unity Asset Optimization Guide | Best Practices for Publishers`,
    description: `Complete guide to optimizing ${category.name} listings on Unity Asset Store. Learn best practices for titles, descriptions, images, tags, and pricing to maximize visibility and sales.`,
    keywords: [
      `unity ${category.name.toLowerCase()}`,
      "unity asset store optimization",
      "unity asset seo",
      "unity publisher guide",
      "asset store best practices",
      ...category.recommendations.keywords.primary,
    ],
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = await loadCategoryData(slug)

  if (!category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="space-y-4">
            <Badge variant="secondary" className="mb-2">
              Unity Asset Store Optimization
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              {category.name} Asset Listing Optimization Guide
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">{category.description}</p>
          </div>

          {/* Market Overview */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Market Size</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">{category.overview.marketSize}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Competition Level</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">{category.overview.competition}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Average Price</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-semibold">{category.overview.averagePrice}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
        {/* Title Optimization */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Title Optimization</h2>
              <p className="text-muted-foreground">Your title is the first thing buyers see</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Optimal Length</CardTitle>
              <CardDescription>{category.recommendations.title.optimalLength}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Best Practices:</h4>
                <ul className="space-y-2">
                  {category.recommendations.title.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Good Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {Array.from(new Set(category.recommendations.title.examples.good)).map((example, index) => (
                    <li key={index} className="text-sm p-3 bg-green-50 dark:bg-green-950/30 rounded-md font-medium">
                      {example}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-900">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5" />
                  Bad Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {Array.from(new Set(category.recommendations.title.examples.bad)).map((example, index) => (
                    <li
                      key={index}
                      className="text-sm p-3 bg-red-50 dark:bg-red-950/30 rounded-md line-through opacity-75"
                    >
                      {example}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Description Optimization */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Description Optimization</h2>
              <p className="text-muted-foreground">Detailed, structured content converts browsers to buyers</p>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Optimal Length</CardTitle>
              <CardDescription>{category.recommendations.description.optimalLength}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Recommended Structure:</h4>
                <ol className="space-y-2">
                  {category.recommendations.description.structure.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed pt-0.5">{item}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Writing Tips:</h4>
                <ul className="space-y-2">
                  {category.recommendations.description.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Example Description Template:</h4>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-xs leading-relaxed whitespace-pre-wrap font-mono">
                    {category.recommendations.description.example}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Images Optimization */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Image & Screenshot Guidelines</h2>
              <p className="text-muted-foreground">Visual quality directly impacts conversion rates</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Optimal Count</CardTitle>
              <CardDescription>{category.recommendations.images.optimalCount}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Requirements:</h4>
                <ul className="space-y-2">
                  {category.recommendations.images.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Pro Tips:</h4>
                <ul className="space-y-2">
                  {category.recommendations.images.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Tags & Keywords */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Tags & Keywords Strategy</h2>
              <p className="text-muted-foreground">Maximize discoverability through search</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
                <CardDescription>{category.recommendations.tags.optimalCount}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Common Tags for {category.name}:</h4>
                  <div className="flex flex-wrap gap-2">
                    {category.recommendations.tags.commonTags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        <span className="capitalize">{tag}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Tagging Tips:</h4>
                  <ul className="space-y-2">
                    {category.recommendations.tags.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Keywords</CardTitle>
                <CardDescription>For SEO and Asset Store search optimization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Primary Keywords:</h4>
                  <ul className="space-y-1">
                    {category.recommendations.keywords.primary.map((keyword, index) => (
                      <li key={index} className="text-sm p-2 bg-primary/5 rounded">
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Secondary Keywords:</h4>
                  <ul className="space-y-1">
                    {category.recommendations.keywords.secondary.map((keyword, index) => (
                      <li key={index} className="text-sm p-2 bg-muted rounded">
                        {keyword}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Keyword Strategy Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.recommendations.keywords.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Pricing Strategy */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Pricing Strategy</h2>
              <p className="text-muted-foreground">Balance value perception with competitive positioning</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recommended Price Range</CardTitle>
              <CardDescription>{category.recommendations.pricing.range}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.recommendations.pricing.strategy.map((strategy, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{strategy}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Real Examples */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Real-World Success Examples</h2>
            <p className="text-muted-foreground">Learn from top-performing assets in this category</p>
          </div>

          <div className="space-y-6">
            {category.realExamples.map((example, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{example.name}</CardTitle>
                  <CardDescription>by {example.publisher}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Why This Asset Succeeds:</h4>
                    <ul className="space-y-2">
                      {example.whyItWorks.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Title Length</p>
                      <p className="text-lg font-bold">{example.metrics.titleLength} chars</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-lg font-bold">{example.metrics.descriptionLength} words</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Images</p>
                      <p className="text-lg font-bold">{example.metrics.imageCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tags</p>
                      <p className="text-lg font-bold">{example.metrics.tagCount}</p>
                    </div>
                  </div>
                  {example.tags && example.tags.length > 0 && (
                    <div className="pt-4 border-t mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Tags Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {example.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="outline" className="text-xs">
                            <span className="capitalize">{tag}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Common Mistakes */}
        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Common Mistakes to Avoid</h2>
            <p className="text-muted-foreground">Learn from others' errors and optimize from the start</p>
          </div>

          <div className="space-y-4">
            {category.commonMistakes.map((mistake, index) => (
              <Card key={index} className="border-l-4 border-l-destructive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    {mistake.mistake}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-1">Impact:</p>
                    <p className="text-sm">{mistake.impact}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900">
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">Solution:</p>
                    <p className="text-sm text-green-900 dark:text-green-200">{mistake.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <CTASection
          className="border-t pt-12"
          title={`Ready to Optimize Your ${category.name} Assets?`}
          description="Apply these best practices to your next Unity Asset Store listing and watch your visibility and sales improve. Remember: Optimization is an ongoing process. Monitor your asset's performance, gather user feedback, and continuously refine your listing based on what works best for your specific assets and target audience."
          linkText="Get Started with Optimization"
          linkHref={env.NEXT_PUBLIC_APP_URL}
        />
      </div>
    </div>
  )
}
