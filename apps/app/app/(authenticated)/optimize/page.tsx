'use client';

import { useState, useEffect } from 'react';
import { Header } from '../components/header';
import { AssetEditor } from './components/asset-editor';
import { AssetGrade } from './components/asset-grade';
import { SimilarAssets } from './components/similar-assets';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { FileText, Search, BarChart3 } from 'lucide-react';
import { Asset } from '@repo/optimizer/src/types';

const App = () => {
  const [currentAssetData, setCurrentAssetData] = useState<Asset | null>(null);
  const [showGrade, setShowGrade] = useState(false);
  const [gradeKey, setGradeKey] = useState(0); // Force re-render of grade component
  const [activeTab, setActiveTab] = useState('input');

  const handleAssetUpdate = (assetData: Asset) => {
    setCurrentAssetData(assetData);
    setShowGrade(true);
    // Only increment gradeKey if the asset data actually changed significantly
    // This prevents unnecessary re-mounts of the AssetGrade component
  };

  const handleAssetClear = () => {
    setCurrentAssetData(null);
    setShowGrade(false);
    setGradeKey(prev => prev + 1); // Force re-render when clearing
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="input" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Input</span>
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
          {/* Left Column - Input */}
          <div className="space-y-6">
            <AssetEditor 
              onAssetUpdate={handleAssetUpdate}
              onAssetClear={handleAssetClear}
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
                
                {/* <SimilarAssets 
                  currentAssetData={currentAssetData}
                /> */}
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
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
