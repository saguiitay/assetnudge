'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from '@workspace/ui/components/field';
import { Input } from '@workspace/ui/components/input';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { Alert, AlertDescription } from '@workspace/ui/components/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@workspace/ui/components/dialog';
import { AssetMediaGallery } from './media-gallery';
import { X, Download, AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';
import { EditorProvider, EditorBubbleMenu, EditorFormatBold, EditorFormatItalic, EditorLinkSelector, EditorNodeBulletList, EditorNodeOrderedList, type JSONContent, type Editor } from '@workspace/ui/components/kibo-ui/editor';
import { Asset } from '@repo/optimizer/src/types';
import { PromptHoverCard } from './prompt-hover-card';
import { GenerateButton, type GeneratableField } from './generate-button';
import { SuggestionInput } from '@workspace/ui/components/suggestion-input';
import { DescriptionSuggestion, TagSuggestion, TitleSuggestion } from '@repo/optimizer/src/suggestions/types';

// JSON validation function for Kibo UI editor output
const validateEditorContent = (content: any) => {
  if (!content) return true;
  
  // If it's a string (legacy HTML), allow it
  if (typeof content === 'string') {
    return content.length <= 5000;
  }
  
  // If it's JSON content from Tiptap, validate structure
  if (typeof content === 'object' && content.type === 'doc') {
    // Convert to HTML and check length
    const htmlLength = JSON.stringify(content).length;
    return htmlLength <= 10000; // Allow more for JSON structure
  }
  
  return true;
};

// Zod schema for Asset validation
const assetSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  short_description: z.string().min(1, 'Short description is required').max(200, 'Short description must be 200 characters or less'),
  long_description: z.union([
    z.string().min(1, 'Long description is required').max(5000, 'Long description must be 5000 characters or less'),
    z.object({
      type: z.literal('doc'),
      content: z.array(z.any()).optional()
    }).refine(
      (content) => {
        if (typeof window === 'undefined') return true; // Skip validation on server
        return validateEditorContent(content);
      },
      { message: 'Content is too long or invalid format' }
    )
  ]).refine(
    (content) => {
      if (typeof window === 'undefined') return true; // Skip validation on server
      return validateEditorContent(content);
    },
    { message: 'Invalid content format' }
  ),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  category: z.string().min(1, 'Category is required'),
  price: z.number().min(0, 'Price must be non-negative'),
  size: z.number().min(0, 'Size must be non-negative'),
  // Additional display-only fields
  rating: z.number().min(0).max(5).optional(),
  reviews_count: z.number().min(0).optional(),
  favorites: z.number().min(0).optional(),
  images_count: z.number().min(0).optional(),
  videos_count: z.number().min(0).optional(),
  // Media fields
  mainImage: z.object({
    big: z.string().optional(),
    small: z.string().optional(),
    icon: z.string().optional(),
    facebook: z.string().optional(),
    icon75: z.string().optional(),
  }).optional(),
  images: z.array(z.object({
    imageUrl: z.string(),
    thumbnailUrl: z.string().optional(),
  })).optional(),
  videos: z.array(z.object({
    videoUrl: z.string(),
    thumbnailUrl: z.string().optional(),
    title: z.string().optional(),
  })).optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetEditorProps {
  onAssetUpdate?: (assetData: Asset) => void;
  onAssetClear?: () => void;
}

export function AssetEditor({ onAssetUpdate, onAssetClear }: AssetEditorProps) {
  const [newTag, setNewTag] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importedData, setImportedData] = useState<Asset | undefined>(undefined);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Asset generation state
  const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);

  // Function to get current asset data for prompt loading
  const getCurrentAssetData = (): Asset => {
    return {
      id: 'temp-id',
      url: 'https://assetstore.unity.com/packages/temp',
      title: form.getValues('title') || 'Sample Asset Title',
      short_description: form.getValues('short_description') || 'Sample description',
      long_description: form.getValues('long_description') || 'Sample long description',
      tags: form.getValues('tags') || ['sample', 'tags'],
      category: form.getValues('category') || 'Tools/Utilities',
      price: form.getValues('price') || 0,
      images_count: 0,
      videos_count: 0,
      rating: [],
      reviews_count: 0,
      last_update: new Date().toISOString(),
      publisher: 'Sample Publisher',
      size: '1.0 MB',
      version: '1.0.0',
      publishNotes: '',
      favorites: 0,
      mainImage: undefined,
      images: [],
      videos: []
    } as Asset;
  };

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
      reviews_count: 0,
      favorites: 0,
      images_count: 0,
      videos_count: 0,
      mainImage: undefined,
      images: [],
      videos: [],
    },
  });

  const { watch, setValue } = form;
  const tags = watch('tags');

  // Watch all form values for changes and trigger updates with debounce
  const watchedValues = watch();
  useEffect(() => {
    // Skip grading during import or batch updates to prevent multiple API calls
    if (isImporting || isBatchUpdating) return;
    
    // Only trigger update if we have meaningful data (at least title and some description)
    if (watchedValues.title && watchedValues.title.length > 0 && 
        (watchedValues.short_description || watchedValues.long_description) &&
        watchedValues.tags && watchedValues.tags.length > 0) {
      
      // Debounce the update to avoid excessive API calls
      const timeoutId = setTimeout(() => {
        onAssetUpdate?.({ 
          ...importedData, 
          title: watchedValues.title,
          short_description: watchedValues.short_description,
          long_description: watchedValues.long_description,
          tags: watchedValues.tags,
        } as Asset);
      }, 500); // Wait 500ms after user stops typing
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    isImporting,
    isBatchUpdating,
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
    // Note: Automatic updates are now handled by useEffect above
  };

  // Asset generation functions
  const generateField = async (fieldKey: GeneratableField): Promise<{text: string, rationale: string | undefined}[]> => {
    const currentAssetData = {
      ...importedData,
      title: form.getValues('title'),
      short_description: form.getValues('short_description'),
      long_description: form.getValues('long_description'),
      tags: form.getValues('tags'),
      category: form.getValues('category')
    } as Asset;

    if (!currentAssetData.title) {
      setGenerationError('Please enter a title first to generate other fields.');
      return [];
    }

    setIsGenerating(prev => ({ ...prev, [fieldKey]: true }));
    setGenerationError(null);
    setGenerationSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true';

      const response = await fetch(`${apiUrl}/optimize?field=${fieldKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          options: {
            assetData: currentAssetData,
            useAI: true
          },
          debug: isDevelopment
        }),
      });

      const output = await response.json();

      if (!output.success) {
        setGenerationError(output.error || `Failed to generate ${fieldKey}`);
        return [];
      }

      // Update the form with generated data
      if (output.result && output.result.length > 0) {
        if (fieldKey === 'title') {
          return (output.result as TitleSuggestion[]).map(s => ({ text: s.text, rationale: s.rationale }));
        } else if (fieldKey === 'tags') {
          return (output.result as TagSuggestion[]).map(s => ({ text: s.tag, rationale: s.rationale }));
        } else if (fieldKey === 'short_description') {
          return (output.result as DescriptionSuggestion[]).map(s => ({ text: s.description, rationale: s.rationale }));
        } else if (fieldKey === 'long_description') {
          return (output.result as DescriptionSuggestion[]).map(s => ({ text: s.description, rationale: s.rationale }));
        }
      }

    } catch (error) {
      console.error('Generation error:', error);
      setGenerationError(`Failed to generate ${fieldKey}. Please check your connection and try again.`);
    } finally {
      setGenerationSuccess(`Successfully generated ${fieldKey}!`);
      setIsGenerating(prev => ({ ...prev, [fieldKey]: false }));
    }
    return [];
  };

  const clearImportedData = () => {
    setImportUrl('');
    setImportError(null);
    setImportSuccess(false);
    setImportedData(undefined);
    setIsImportModalOpen(false);
    setIsBatchUpdating(false);
    onAssetClear?.();
    
    // Reset form to defaults with explicit undefined values to force re-render
    form.reset({
      title: '',
      short_description: '',
      long_description: '',
      tags: [],
      category: '',
      price: 0,
      size: 0,
      rating: 0,
      reviews_count: 0,
      favorites: 0,
      images_count: 0,
      videos_count: 0,
      mainImage: undefined,
      images: [],
      videos: [],
    });
    
    // Force a manual re-render by updating a timestamp or key
    // This ensures the media gallery gets a new key
    setTimeout(() => {
      form.trigger(); // Trigger form validation to ensure all watchers update
    }, 100);
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
    setImportedData(undefined);

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

      console.log('Raw scraped asset data:', result.asset);

      // Start batch updating to prevent multiple useEffect triggers
      setIsBatchUpdating(true);

      // Process the asset data first
      const asset = result.asset as Asset;
      
      // Handle long description - preserve HTML and clean up for Tiptap editor
      let processedLongDescription = '';
      if (asset.long_description) {
        let htmlDescription = asset.long_description;
        
        // If it's plain text, wrap it properly for Tiptap
        if (!/<[^>]+>/g.test(htmlDescription)) {
          // Convert line breaks to paragraphs
          const paragraphs = htmlDescription.split(/\n\s*\n/);
          htmlDescription = paragraphs.map((p: string) => p.trim() ? `<p>${p.replace(/\n/g, '<br>')}</p>` : '').join('');
        } else {
          // Clean up existing HTML - convert to Tiptap compatible format
          htmlDescription = htmlDescription
            .replace(/<b>/gi, '<strong>')
            .replace(/<\/b>/gi, '</strong>')
            .replace(/<i>/gi, '<em>')
            .replace(/<\/i>/gi, '</em>')
            // Keep common HTML tags that Tiptap supports
            .replace(/<(?!\/?(p|strong|em|b|i|a|ol|ul|li|br|h[1-6])(?:\s[^>]*)?\/?)[^>]*>/gi, '');
        }
        
        processedLongDescription = htmlDescription.slice(0, 5000); // Respect max length
      }
      
      // Process main image
      let processedMainImage = undefined;
      if (asset.mainImage) {
        const processMainImage = (url?: string) => {
          if (!url) return undefined;
          // Handle different URL formats
          if (url.startsWith('//')) return `https:${url}`;
          if (url.startsWith('http')) return url;
          return `https://${url}`;
        };
        
        processedMainImage = {
          big: processMainImage(asset.mainImage.big),
          small: processMainImage(asset.mainImage.small),
          icon: processMainImage(asset.mainImage.icon),
          facebook: processMainImage(asset.mainImage.facebook),
          icon75: processMainImage(asset.mainImage.icon75),
        };
      }
      
      // Process images
      let processedImages: any[] = [];
      if (asset.images && Array.isArray(asset.images)) {
        const processImageUrl = (url?: string) => {
          if (!url) return '';
          if (url.startsWith('//')) return `https:${url}`;
          if (url.startsWith('http')) return url;
          return `https://${url}`;
        };
        
        processedImages = asset.images.map((img: any) => ({
          imageUrl: processImageUrl(img.imageUrl),
          thumbnailUrl: processImageUrl(img.thumbnailUrl),
        })).filter((img: any) => img.imageUrl);
        
        console.log('Processed images:', processedImages);
      }
      
      // Process videos
      let processedVideos: any[] = [];
      if (asset.videos && Array.isArray(asset.videos)) {
        const processVideoUrl = (url?: string) => {
          if (!url) return '';
          if (url.startsWith('//')) return `https:${url}`;
          if (url.startsWith('http')) return url;
          return `https://${url}`;
        };
        
        processedVideos = asset.videos.map((vid: any) => ({
          videoUrl: processVideoUrl(vid.videoUrl),
          thumbnailUrl: processVideoUrl(vid.thumbnailUrl),
          title: vid.title || undefined,
        })).filter((vid: any) => vid.videoUrl);
        
        console.log('Processed videos:', processedVideos);
      }
      
      // Parse size if it's a string (e.g., "222.0 KB")
      let processedSize = 0;
      if (asset.size) {
        if (typeof asset.size === 'string') {
          const sizeMatch = asset.size.match(/([\d.]+)\s*(KB|MB|GB)/i);
          if (sizeMatch) {
            const value = parseFloat(sizeMatch[1]!);
            const unit = sizeMatch[2]!.toLowerCase();
            switch (unit) {
              case 'kb': processedSize = value / 1024; break;
              case 'mb': processedSize = value; break;
              case 'gb': processedSize = value * 1024; break;
            }
          }
        } else if (typeof asset.size === 'number') {
          processedSize = asset.size;
        }
        processedSize = Math.round(processedSize * 100) / 100; // Round to 2 decimals
      }

      // Use form.reset() to populate all fields in a single batch operation
      form.reset({
        title: asset.title || '',
        short_description: asset.short_description || '',
        long_description: processedLongDescription,
        category: asset.category || '',
        tags: (asset.tags && Array.isArray(asset.tags)) ? asset.tags.slice(0, 20) : [],
        price: (typeof asset.price === 'number') ? asset.price : 0,
        size: processedSize,
        rating: (typeof asset.rating === 'number') ? asset.rating : 0,
        reviews_count: asset.reviews_count ?? 0,
        favorites: (typeof asset.favorites === 'number') ? asset.favorites : 0,
        images_count: (typeof asset.images_count === 'number') ? asset.images_count : 0,
        videos_count: (typeof asset.videos_count === 'number') ? asset.videos_count : 0,
        mainImage: processedMainImage,
        images: processedImages,
        videos: processedVideos,
      });

      setImportSuccess(true);
      
      // Close modal on successful import
      setIsImportModalOpen(false);
      
      // End batch updating and trigger single grading call
      setIsBatchUpdating(false);
      
      // Trigger grading with the complete form data
      //const formData = form.getValues();
      onAssetUpdate?.(asset);
      
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
        <FieldSet>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <FieldLabel htmlFor="category">Category</FieldLabel>
                  <Input 
                    id="category" 
                    placeholder="Enter category" 
                    {...field} 
                    aria-invalid={!!fieldState.error}
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <SuggestionInput
                    label={(
                      <div className="flex items-center gap-2">
                        <span>
                          Title
                        </span>
                        <PromptHoverCard
                          fieldType="title"
                          fieldName="Title"
                          getCurrentAssetData={getCurrentAssetData}
                        />
                      </div>
                    )}
                    value={field.value}
                    onChange={field.onChange}
                    onSuggest={async (currentValue) => {
                      try {
                        return await generateField('title');
                      } catch (error) {
                        console.error('Error generating title suggestions:', error);
                        return [];
                      }
                    }}
                    placeholder="Enter asset title"
                    variant="input"
                    buttonVariant="outline"
                  />
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="short_description"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <SuggestionInput
                    label={(
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          Short Description
                        </span>
                        <PromptHoverCard
                          fieldType="short_description"
                          fieldName="Short Description"
                          getCurrentAssetData={getCurrentAssetData}
                        />
                      </div>
                    )}
                    value={field.value}
                    onChange={field.onChange}
                    onSuggest={async (currentValue) => {
                      try {
                        return await generateField('short_description');
                      } catch (error) {
                        console.error('Error generating short description suggestions:', error);
                        return [];
                      }
                    }}
                    placeholder="Enter a brief description"
                    variant="textarea"
                    rows={3}
                    buttonSize="default"
                    buttonVariant="outline"
                  />
                  <FieldDescription>
                    A brief summary of the asset (max 200 characters)
                  </FieldDescription>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="long_description"
              render={({ field, fieldState }) => (
                <Field data-invalid={!!fieldState.error}>
                  <SuggestionInput
                    label={(
                      <div className="flex items-center gap-2">
                        <span>
                          Long Description
                        </span>
                        <PromptHoverCard
                          fieldType="long_description"
                          fieldName="Long Description"
                          getCurrentAssetData={getCurrentAssetData}
                        />
                      </div>
                    )}
                    value={field.value}
                    onChange={field.onChange}
                    onSuggest={async (currentValue) => {
                      try {
                        return await generateField('long_description');
                      } catch (error) {
                        console.error('Error generating long description suggestions:', error);
                        return [];
                      }
                    }}
                    placeholder="Enter detailed description with rich text formatting"
                    variant="custom"
                    buttonSize="default"
                    buttonVariant="outline"
                    renderInput={({ value, onChange, placeholder }) => (
                      <EditorProvider
                        key={typeof value === 'string' && value ? `editor-${value.slice(0, 50)}` : `editor-${JSON.stringify(value)?.slice(0, 50) || 'empty'}`}
                        className="border rounded-md"
                        content={
                          // Handle both HTML strings and JSON content
                          typeof value === 'string' && value
                            ? value  // Pass HTML string directly
                            : (value as any) as JSONContent  // Pass JSON content for Tiptap
                        }
                        onUpdate={(props) => {
                          // Get HTML content for backward compatibility
                          const html = props.editor.getHTML();
                          const isEmpty = html === '<p></p>' || html === '';
                          onChange(isEmpty ? '' : html);
                        }}
                        placeholder={placeholder}
                        editorProps={{
                          attributes: {
                            class: 'prose prose-sm max-w-none min-h-[120px] p-3 focus:outline-none [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-800 [&_a:hover]:dark:text-blue-300 [&_a]:cursor-pointer [&_a]:transition-colors',
                          },
                        }}
                      >
                        <EditorBubbleMenu>
                          <EditorFormatBold hideName />
                          <EditorFormatItalic hideName />
                          <EditorLinkSelector />
                          <EditorNodeBulletList hideName />
                          <EditorNodeOrderedList hideName />
                        </EditorBubbleMenu>
                      </EditorProvider>
                    )}
                  />
                  <FieldDescription>
                    A detailed description with rich text formatting (max 5000 characters)
                  </FieldDescription>
                  {fieldState.error && (
                    <FieldError>{fieldState.error.message}</FieldError>
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  Tags
                  <PromptHoverCard
                    fieldType="tags"
                    fieldName="Tags"
                    getCurrentAssetData={getCurrentAssetData}
                  />
                </div>
                <GenerateButton
                  fieldKey="tags"
                  isGenerating={isGenerating.tags || false}
                  isDisabled={Object.values(isGenerating).some(Boolean) || !form.watch('title')}
                  onGenerate={generateField}
                />
              </FieldLabel>
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
                <FieldError>
                  {form.formState.errors.tags.message}
                </FieldError>
              )}
            </Field>

            <FieldSeparator />

            {/* Asset Statistics */}
            <Field>
              <FieldLabel>Asset Statistics</FieldLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rating:</span>
                  <div className="font-medium">{form.watch('rating')?.toFixed(1) || '0.0'} / 5</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Reviews:</span>
                  <div className="font-medium">{form.watch('reviews_count') || 0}</div>
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
            </Field>
            
            {/* Asset Media Gallery */}
            <AssetMediaGallery 
              key={`media-${form.watch('title')}-${form.watch('mainImage')?.big || ''}-${form.watch('images')?.length || 0}`}
              data={{
                mainImage: form.watch('mainImage'),
                images: form.watch('images'),
                videos: form.watch('videos'),
                title: form.watch('title')
              }}
              showIfEmpty={importSuccess}
            />

            <div className="flex justify-end space-x-4">
              {(importSuccess || form.watch('title')) && (
                <Button type="button" variant="destructive" onClick={clearImportedData}>
                  Clear Asset
                </Button>
              )}
              <Button type="button" variant="outline">
                Reset
              </Button>
            </div>
          </form>
        </FieldSet>
      </CardContent>
    </Card>
    </div>
  );
}