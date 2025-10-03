'use client';

import { useState } from 'react';
import { Header } from '../components/header';
import { AssetEditor } from './components/asset-editor';
import { AssetGrade } from './components/asset-grade';

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

  const handleAssetUpdate = (assetData: AssetData) => {
    setCurrentAssetData(assetData);
    setShowGrade(true);
  };

  const handleAssetClear = () => {
    setCurrentAssetData(null);
    setShowGrade(false);
  };

  return (
    <>
      <Header pages={['Home']} page="Optimize Asset">
      </Header>
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-6">
            <AssetEditor 
              onAssetUpdate={handleAssetUpdate}
              onAssetClear={handleAssetClear}
            />
          </div>
          <div className="space-y-6">
            {showGrade && currentAssetData ? (
              <AssetGrade 
                assetData={currentAssetData}
                onRefresh={() => {
                  // Trigger re-grading with current data
                  setShowGrade(false);
                  setTimeout(() => setShowGrade(true), 100);
                }}
              />
            ) : (
              <div className="hidden xl:block">
                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
                  <div className="space-y-2">
                    <div className="text-lg font-medium">Asset Grade</div>
                    <div className="text-sm">Import or create an asset to see its educational assessment</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
