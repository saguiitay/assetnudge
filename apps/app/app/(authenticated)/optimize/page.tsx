'use client';

import { useState, useEffect } from 'react';
import { Header } from '../components/header';
import { AssetEditor } from './components/asset-editor';
import { AssetGrade } from './components/asset-grade';
import { AssetGenerator } from './components/asset-generator';
import { SimilarAssets } from './components/similar-assets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Separator } from '@workspace/ui/components/separator';
import { Badge } from '@workspace/ui/components/badge';
import { FileText, Sparkles, Search, BarChart3 } from 'lucide-react';

interface AssetData {
  title: string;
  short_description: string;
  long_description: string;
  tags: string[];
  category: string;
  price: number;
  size: number;
}

const App = () => {
  const [currentAssetData, setCurrentAssetData] = useState<AssetData | null>(null);
  const [showGrade, setShowGrade] = useState(false);
  const [gradeKey, setGradeKey] = useState(0); // Force re-render of grade component
  const [activeTab, setActiveTab] = useState('input');

  const handleAssetUpdate = (assetData: AssetData) => {
    setCurrentAssetData(assetData);
    setShowGrade(true);
    // Trigger grade re-calculation when asset data changes
    setGradeKey(prev => prev + 1);
  };

  const handleAssetClear = () => {
    setCurrentAssetData(null);
    setShowGrade(false);
    setGradeKey(prev => prev + 1);
  };

  const handleGeneratedDataUpdate = (generatedData: Partial<AssetData>) => {
    if (currentAssetData) {
      const updatedData = { ...currentAssetData, ...generatedData };
      setCurrentAssetData(updatedData);
      setGradeKey(prev => prev + 1);
    }
  };

  // Auto-switch to results tab when asset data is available
  useEffect(() => {
    if (currentAssetData && showGrade) {
      setActiveTab('results');
    }
  }, [currentAssetData, showGrade]);

  return (
    <>
      <Header pages={['Home']} page="Optimize Asset">
      </Header>
      <div className="container mx-auto py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Asset Optimizer</h1>
              <p className="text-muted-foreground">
                Import, enhance, and analyze your educational assets for maximum impact
              </p>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet Layout - Tabbed Interface */}
        <div className="xl:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="input" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Input</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Generate</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Results</span>
              </TabsTrigger>
              <TabsTrigger value="similar" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Similar</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="mt-6">
              <AssetEditor 
                onAssetUpdate={handleAssetUpdate}
                onAssetClear={handleAssetClear}
              />
            </TabsContent>
            
            <TabsContent value="generate" className="mt-6">
              <AssetGenerator 
                currentAssetData={currentAssetData}
                onGeneratedDataUpdate={handleGeneratedDataUpdate}
              />
            </TabsContent>
            
            <TabsContent value="results" className="mt-6">
              <AssetGrade 
                key={gradeKey}
                assetData={currentAssetData}
                onRefresh={() => setGradeKey(prev => prev + 1)}
                autoGrade={true}
              />
            </TabsContent>
            
            <TabsContent value="similar" className="mt-6">
              <SimilarAssets 
                currentAssetData={currentAssetData}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout - Two Column */}
        <div className="hidden xl:grid xl:grid-cols-2 xl:gap-8">
          {/* Left Column - Input & Generation */}
          <div className="space-y-6">
            <AssetEditor 
              onAssetUpdate={handleAssetUpdate}
              onAssetClear={handleAssetClear}
            />
            
            <Separator />
            
            <AssetGenerator 
              currentAssetData={currentAssetData}
              onGeneratedDataUpdate={handleGeneratedDataUpdate}
            />
          </div>
          
          {/* Right Column - Results & Analysis */}
          <div className="space-y-6">
            {showGrade && currentAssetData ? (
              <>
                <AssetGrade 
                  key={gradeKey}
                  assetData={currentAssetData}
                  onRefresh={() => setGradeKey(prev => prev + 1)}
                  autoGrade={true}
                />
                
                <Separator />
                
                <SimilarAssets 
                  currentAssetData={currentAssetData}
                />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Asset Analysis
                    </CardTitle>
                    <CardDescription>
                      Import or create an asset to see detailed analysis and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 text-center">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-muted-foreground mb-1">--</div>
                        <div className="text-sm text-muted-foreground">Grade</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Similar Assets
                    </CardTitle>
                    <CardDescription>
                      Discover exemplar assets for reference and inspiration
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                      <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Import an asset to find similar examples</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
