import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { ArrowRight, TrendingUp, DollarSign, Users } from "lucide-react"
import { categoryData } from "@/lib/category-data"
import { CTASection } from "../components/cta-section"
import type { Metadata } from "next"
import { env } from "@/env"

export const metadata: Metadata = {
  title: "Unity Asset Store Categories - Complete Optimization Guide",
  description:
    "Browse all Unity Asset Store categories with detailed optimization guides, best practices, and recommendations for publishers to maximize visibility and sales.",
  keywords: [
    "unity asset store categories",
    "unity asset optimization",
    "unity publisher guide",
    "asset store seo",
    "unity asset marketing",
  ],
}

export default function CategoriesPage() {
  const categories = Object.values(categoryData)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">Unity Asset Store Categories</h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
            Explore comprehensive optimization guides for every major Unity Asset Store category. Learn best practices,
            common mistakes, and proven strategies to increase your asset visibility and sales.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg">Categories Covered</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Detailed optimization guides</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Real Examples</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{categories.reduce((sum, cat) => sum + cat.realExamples.length, 0)}+</p>
              <p className="text-sm text-muted-foreground mt-1">Successful asset case studies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg">Pricing Strategies</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">Included</p>
              <p className="text-sm text-muted-foreground mt-1">For every category</p>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Browse by Category</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {categories.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>
                <Card className="h-full hover:border-primary transition-all hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-balance">
                      {category.name}
                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </CardTitle>
                    <CardDescription className="leading-relaxed">{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Market Overview */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">
                          Market
                        </Badge>
                        <p className="text-sm text-muted-foreground flex-1">{category.overview.marketSize}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">
                          Competition
                        </Badge>
                        <p className="text-sm text-muted-foreground flex-1">{category.overview.competition}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">
                          Pricing
                        </Badge>
                        <p className="text-sm text-muted-foreground flex-1">{category.overview.averagePrice}</p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="pt-4 border-t flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {category.realExamples.length} real examples included
                      </span>
                      <span className="text-primary font-medium">View Guide →</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <CTASection
          title="Ready to Optimize Your Assets?"
          description="Each category guide includes detailed recommendations on titles, descriptions, images, tags, keywords, and pricing strategies. Learn from real successful assets and avoid common mistakes that hurt visibility."
          linkText="Back to Home"
          linkHref={env.NEXT_PUBLIC_APP_URL}
          className="mt-16"
        />
      </div>
    </div>
  )
}
