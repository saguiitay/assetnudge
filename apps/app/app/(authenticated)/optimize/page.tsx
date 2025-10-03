import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Header } from '../components/header';
import { AssetEditor } from './components/asset-editor';

const title = 'Asset Nudge';
const description = 'Optimize your assets with ease.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const { orgId } = await auth();

  return (
    <>
      <Header pages={['Home']} page="Optimize Asset">
      </Header>
      <div className="container mx-auto py-8">
        <AssetEditor />
      </div>
    </>
  );
};

export default App;
