import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { Header } from '../components/header';
import { AssetEditor } from './components/asset-editor';

const title = 'Acme Inc';
const description = 'My application.';

export const metadata: Metadata = {
  title,
  description,
};

const App = async () => {
  const { orgId } = await auth();

  return (
    <>
      <Header pages={['Building Your Application']} page="New Asset">
      </Header>
      <div className="container mx-auto py-8">
        <AssetEditor />
      </div>
    </>
  );
};

export default App;
