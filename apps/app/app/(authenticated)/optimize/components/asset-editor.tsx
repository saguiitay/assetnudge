'use client';

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { X, Download, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';

// HTML validation function for allowed tags
const validateHtml = (html: string) => {
  // Allow only specific tags: b, i, a, ol, ul, li
  const allowedTags = /<\/?(?:b|i|a(?:\s+href=["'][^"']*["'])?|ol|ul|li)(?:\s[^>]*)?>|[^<]+/gi;
  const cleanHtml = html.match(allowedTags)?.join('') || '';
  
  // Check if the cleaned HTML matches the original (meaning no disallowed tags)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = cleanHtml;
  const hasDisallowedTags = cleanHtml !== html && /<[^>]+>/g.test(html);
  
  return !hasDisallowedTags;
};

// Zod schema for Asset validation
const assetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  short_description: z.string().min(1, 'Short description is required').max(200, 'Short description must be 200 characters or less'),
  long_description: z.string()
    .min(1, 'Long description is required')
    .max(5000, 'Long description must be 5000 characters or less')
    .refine(
      (html) => {
        if (typeof window === 'undefined') return true; // Skip validation on server
        return validateHtml(html);
      },
      { message: 'Only the following HTML tags are allowed: <b>, <i>, <a>, <ol>, <ul>, <li>' }
    ),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  size: z.number().min(0, 'Size must be non-negative'),
  // Additional display-only fields
  rating: z.number().min(0).max(5).optional(),
  rating_count: z.number().min(0).optional(),
  favorites: z.number().min(0).optional(),
  images_count: z.number().min(0).optional(),
  videos_count: z.number().min(0).optional(),
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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
      rating: 0,
      rating_count: 0,
      favorites: 0,
      images_count: 0,
      videos_count: 0,
    },
  });

  const { watch, setValue } = form;
  const tags = watch('tags');

  // Watch all form values for changes and trigger updates with debounce
  const watchedValues = watch();
  useEffect(() => {
    // Only trigger update if we have meaningful data (at least title and some description)
    if (watchedValues.title && watchedValues.title.length > 0 && 
        (watchedValues.short_description || watchedValues.long_description) &&
        watchedValues.tags && watchedValues.tags.length > 0) {
      
      // Debounce the update to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        onAssetUpdate?.(watchedValues as AssetFormData);
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    watchedValues.title,
    watchedValues.short_description, 
    watchedValues.long_description,
    watchedValues.tags?.length, // Only watch tags length, not the array reference
    watchedValues.category,
    watchedValues.size
    // Exclude onAssetUpdate from dependencies to prevent loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

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
    // Note: Automatic updates are now handled by useEffect above
  };

  const clearImportedData = () => {
    setImportUrl('');
    setImportError(null);
    setImportSuccess(false);
    setImportedData(null);
    setIsImportModalOpen(false);
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
      rating: 0,
      rating_count: 0,
      favorites: 0,
      images_count: 0,
      videos_count: 0,
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
      
      // Handle long description - preserve HTML but clean up disallowed tags
      if (asset.long_description) {
        let htmlDescription = asset.long_description;
        
        // If it's plain text, wrap it properly
        if (!/<[^>]+>/g.test(htmlDescription)) {
          // Convert line breaks to proper HTML
          htmlDescription = htmlDescription.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
          if (!htmlDescription.startsWith('<p>')) {
            htmlDescription = '<p>' + htmlDescription + '</p>';
          }
        } else {
          // Clean up existing HTML - remove disallowed tags but keep content
          htmlDescription = htmlDescription.replace(/<(?!\/?(b|i|a|ol|ul|li)(?:\s[^>]*)?\/?)[^>]*>/gi, '');
        }
        
        form.setValue('long_description', htmlDescription.slice(0, 5000)); // Respect max length
      }
      
      if (asset.category) form.setValue('category', asset.category);
      if (asset.tags && Array.isArray(asset.tags)) form.setValue('tags', asset.tags.slice(0, 20)); // Limit tags
      if (typeof asset.price === 'number') form.setValue('price', asset.price);
      
      // Set additional display fields
      if (typeof asset.rating === 'number') form.setValue('rating', asset.rating);
      if (typeof asset.rating_count === 'number') form.setValue('rating_count', asset.rating_count);
      if (typeof asset.favorites === 'number') form.setValue('favorites', asset.favorites);
      if (typeof asset.images_count === 'number') form.setValue('images_count', asset.images_count);
      if (typeof asset.videos_count === 'number') form.setValue('videos_count', asset.videos_count);
      
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
      
      // Close modal on successful import
      setIsImportModalOpen(false);
      
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
      {/* Manual Asset Creation Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                {importSuccess 
                  ? 'Review and edit the imported asset details below.'
                  : 'Fill in the details below to create a new asset manually.'
                }
              </CardDescription>
            </div>
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Import from Store
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Import from Unity Asset Store
                  </DialogTitle>
                  <DialogDescription>
                    Import asset details from a Unity Asset Store URL to automatically populate the form.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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

                  {importSuccess && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>Asset data imported successfully!</AlertDescription>
                    </Alert>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
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
                  <FormLabel>Long Description (HTML)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2 text-xs text-muted-foreground border-b pb-2">
                        <span>Allowed tags: &lt;b&gt;, &lt;i&gt;, &lt;a&gt;, &lt;ol&gt;, &lt;ul&gt;, &lt;li&gt;</span>
                      </div>
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit" className="mt-2">
                          <Textarea
                            placeholder="Enter detailed description with HTML formatting"
                            className="min-h-32 resize-y font-mono text-sm"
                            {...field}
                          />
                        </TabsContent>
                        <TabsContent value="preview" className="mt-2">
                          <div className="border rounded p-3 bg-muted/50 min-h-32">
                            {field.value ? (
                              <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: field.value }}
                              />
                            ) : (
                              <p className="text-muted-foreground text-sm">No content to preview</p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </FormControl>
                  <FormDescription>
                    A detailed description with HTML formatting (max 5000 characters including HTML tags)
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
                {tags.map((tag, index) => (
                  <Badge key={`${tag}-${index}`} variant="secondary" className="flex items-center gap-1 pr-1">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        removeTag(tag);
                      }}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {form.formState.errors.tags && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.tags.message}
                </p>
              )}
            </div>

            {/* Asset Statistics */}
            <div className="space-y-4">
              <FormLabel>Asset Statistics</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="font-medium">{form.watch('rating')?.toFixed(1) || '0.0'} / 5</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Reviews:</span>
                  <div className="font-medium">{form.watch('rating_count') || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Favorites:</span>
                  <div className="font-medium">{form.watch('favorites') || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <div className="font-medium">${form.watch('price')?.toFixed(2) || '0.00'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Images:</span>
                  <div className="font-medium">{form.watch('images_count') || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Videos:</span>
                  <div className="font-medium">{form.watch('videos_count') || 0}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <div className="font-medium">{form.watch('size')?.toFixed(2) || '0.00'} MB</div>
                </div>
              </div>
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