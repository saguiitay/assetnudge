import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Header } from '../components/header';
import { Button } from '@workspace/ui/components/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@workspace/ui/components/card';
import { Sparkles, ArrowRight, Zap, FileText, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
import Link from 'next/link';

const title = 'Asset Nudge';
const description = 'Optimize your assets with ease.';

export const metadata: Metadata = {
  title,
  description,
};

function ActivityItem({
  icon,
  title,
  description,
  time,
}: {
  icon: React.ReactNode
  title: string
  description: string
  time: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">{icon}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  )
}

const App = async () => {
  const { orgId } = await auth();

  return (
    <>
      <Header pages={[]} page="Home">
        {/* {env.LIVEBLOCKS_SECRET && (
          <CollaborationProvider orgId={orgId}>
            <AvatarStack />
            <Cursors />
          </CollaborationProvider>
        )} */}
      </Header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        </div>
        <div className="min-h-screen flex-1 rounded-xl bg-muted/50 md:min-h-min" /> */}

        {/* Welcome Section */}
        <section className="border-b border-border bg-gradient-to-b from-background to-muted/20 px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6">
              {/* <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  v1.0.0
                </Badge>
              </div> */}
              <div className="space-y-4">
                <h1 className="text-balance text-4xl font-bold tracking-tight lg:text-5xl">Welcome to Asset Nudge</h1>
                <p className="text-pretty text-lg text-muted-foreground lg:text-xl">
                  Optimize your assets with AI-powered insights. Track keywords, improve SEO performance, and
                  increase your sales.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/optimize">
                  <Button size="lg" className="gap-2">
                    Start Optimizing
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {/* <Button size="lg" variant="outline">
                  View Documentation
                </Button> */}
              </div>
            </div>
          </div>
        </section>

        <div className="px-6 py-12 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Getting Started Guide - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Getting Started</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* <Card className="group relative overflow-hidden transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Zap className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Quick Setup</CardTitle>
                    <CardDescription>
                      Connect your content sources and configure optimization preferences in minutes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="ghost" className="gap-2 px-0 text-primary">
                      Get Started
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </CardContent>
                </Card> */}

                <Card className="group relative overflow-hidden transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Optimize Your First Asset</CardTitle>
                    <CardDescription>
                      Upload content and let our AI analyze and suggest improvements for better performance.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/optimize">
                      <Button variant="ghost" className="gap-2 px-0 text-primary">
                        Start Optimizing
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10 text-chart-2">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Track Keywords</CardTitle>
                    <CardDescription>
                      Monitor keyword performance and discover new opportunities to improve rankings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="group relative overflow-hidden transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/10 text-chart-4">
                      <FileText className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">Documentation Hub</CardTitle>
                    <CardDescription>
                      Access comprehensive guides, API references, and best practices for asset optimization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Coming Soon
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Activity Feed - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-semibold tracking-tight">Recent Activity</h2>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6 text-muted-foreground">
                    Coming soon: Your activity feed will appear here.
                    {/* <ActivityItem
                      icon={<CheckCircle2 className="h-4 w-4 text-chart-3" />}
                      title="Asset optimized"
                      description="homepage-hero.jpg"
                      time="2 hours ago"
                    />
                    <ActivityItem
                      icon={<CheckCircle2 className="h-4 w-4 text-chart-3" />}
                      title="Asset optimized"
                      description="product-feature.png"
                      time="5 hours ago"
                    />
                    <ActivityItem
                      icon={<CheckCircle2 className="h-4 w-4 text-chart-3" />}
                      title="Asset optimized"
                      description="blog-post-header.jpg"
                      time="1 day ago"
                    />
                    <ActivityItem
                      icon={<CheckCircle2 className="h-4 w-4 text-chart-3" />}
                      title="Asset optimized"
                      description="landing-page-bg.png"
                      time="2 days ago"
                    />
                    <div className="pt-2">
                      <Button variant="outline" className="w-full gap-2 bg-transparent">
                        View All Activity
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div> */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
