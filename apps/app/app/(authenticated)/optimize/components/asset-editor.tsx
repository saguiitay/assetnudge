'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/design-system/components/ui/form';
import { Input } from '@repo/design-system/components/ui/input';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Alert, AlertDescription } from '@repo/design-system/components/ui/alert';
import { Separator } from '@repo/design-system/components/ui/separator';
import { X, Download, AlertCircle, CheckCircle } from 'lucide-react';

// Zod schema for Asset validation
const assetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  short_description: z.string().min(1, 'Short description is required').max(200, 'Short description must be 200 characters or less'),
  long_description: z.string().min(1, 'Long description is required').max(2000, 'Long description must be 2000 characters or less'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  size: z.number().min(0, 'Size must be non-negative'),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetEditorProps {
  onAssetUpdate?: (assetData: AssetFormData) => void;
  onAssetClear?: () => void;
}

export function AssetEditor({ onAssetUpdate, onAssetClear }: AssetEditorProps) {
  const [newTag, setNewTag] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);

  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      title: '',
      short_description: '',
      long_description: '',
      tags: [],
      category: '',
      price: 0,
      size: 0,
    },
  });

  const { watch, setValue } = form;
  const tags = watch('tags');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setValue('tags', [...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  const onSubmit = (data: AssetFormData) => {
    console.log('Asset data:', data);
    onAssetUpdate?.(data);
    // Here you would typically save the asset
  };

  const clearImportedData = () => {
    setImportUrl('');
    setImportError(null);
    setImportSuccess(false);
    setImportedData(null);
    onAssetClear?.();
    
    // Reset form to defaults
    form.reset({
      title: '',
      short_description: '',
      long_description: '',
      tags: [],
      category: '',
      price: 0,
      size: 0,
    });
  };

  const importFromUrl = async () => {
    if (!importUrl.trim()) {
      setImportError('Please enter a valid URL');
      return;
    }

    if (!importUrl.includes('assetstore.unity.com/packages/')) {
      setImportError('Please enter a valid Unity Asset Store URL');
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(false);
    setImportedData(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const response = await fetch(`${apiUrl}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: importUrl.trim(),
          method: 'graphql',
          debug: true
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setImportError(result.error || 'Failed to import asset data');
        return;
      }

      // Store the imported data for reference
      setImportedData({
        ...result.asset,
        scraping_method: result.scraping_method,
        scraped_at: result.scraped_at
      });

      // Populate the form with scraped data
      const asset = result.asset;
      if (asset.title) form.setValue('title', asset.title);
      if (asset.short_description) form.setValue('short_description', asset.short_description);
      
      // Handle long description - strip HTML tags if present
      if (asset.long_description) {
        const cleanDescription = asset.long_description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        form.setValue('long_description', cleanDescription.slice(0, 2000)); // Respect max length
      }
      
      if (asset.category) form.setValue('category', asset.category);
      if (asset.tags && Array.isArray(asset.tags)) form.setValue('tags', asset.tags.slice(0, 20)); // Limit tags
      if (typeof asset.price === 'number') form.setValue('price', asset.price);
      
      // Parse size if it's a string (e.g., "222.0 KB")
      if (asset.size) {
        let sizeInMB = 0;
        if (typeof asset.size === 'string') {
          const sizeMatch = asset.size.match(/([\d.]+)\s*(KB|MB|GB)/i);
          if (sizeMatch) {
            const value = parseFloat(sizeMatch[1]);
            const unit = sizeMatch[2].toLowerCase();
            switch (unit) {
              case 'kb': sizeInMB = value / 1024; break;
              case 'mb': sizeInMB = value; break;
              case 'gb': sizeInMB = value * 1024; break;
            }
          }
        } else if (typeof asset.size === 'number') {
          sizeInMB = asset.size;
        }
        form.setValue('size', Math.round(sizeInMB * 100) / 100); // Round to 2 decimals
      }

      setImportSuccess(true);
      
      // Notify parent component immediately with imported data
      const formData = form.getValues();
      onAssetUpdate?.(formData);
      
      // Keep the URL for reference but don't clear it immediately
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import asset data. Please check your connection and try again.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Import from URL Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import from Unity Asset Store
          </CardTitle>
          <CardDescription>
            Import asset details from a Unity Asset Store URL to automatically populate the form below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://assetstore.unity.com/packages/..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  importFromUrl();
                }
              }}
              disabled={isImporting}
              className="flex-1"
            />
            <Button 
              onClick={importFromUrl} 
              disabled={isImporting || !importUrl.trim()}
              className="whitespace-nowrap"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </div>
          
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Manual Asset Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>
            {importSuccess 
              ? 'Review and edit the imported asset details below.'
              : 'Fill in the details below to create a new asset manually.'
            }
          </CardDescription>
        </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a brief description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief summary of the asset (max 200 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="long_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Long Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed description"
                      className="min-h-32 resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A detailed description of the asset (max 2000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add Tag
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              {form.formState.errors.tags && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.tags.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Price in USD</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>Size in MB</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
    </div>
  );
}