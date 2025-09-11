import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, Plus, X } from "lucide-react";
import { FirecrawlService } from '@/utils/FirecrawlService';
import { supabase } from '@/integrations/supabase/client';

interface MenuImportToolProps {
  restaurantId: string;
  onItemsImported: () => void;
}

interface ExtractedMenuItem {
  name: string;
  price_cents: number;
  category: string;
  description: string;
  source_url: string;
}

const MenuImportTool: React.FC<MenuImportToolProps> = ({ restaurantId, onItemsImported }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedMenuItem[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(!FirecrawlService.getApiKey());
  const { toast } = useToast();

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    FirecrawlService.saveApiKey(apiKey);
    setShowApiKeyInput(false);
    toast({
      title: "Success",
      description: "Firecrawl API key saved successfully"
    });
  };

  const handleExtractMenu = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
      return;
    }

    if (!FirecrawlService.getApiKey()) {
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    try {
      const result = await FirecrawlService.parseMenuFromUrl(url);
      
      if (result.success && result.menuItems) {
        setExtractedItems(result.menuItems);
        toast({
          title: "Success",
          description: `Extracted ${result.menuItems.length} menu items`
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to extract menu items",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error extracting menu:', error);
      toast({
        title: "Error",
        description: "Failed to extract menu items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportItems = async () => {
    if (extractedItems.length === 0) return;

    setLoading(true);
    try {
      // Create categories first
      const categories = [...new Set(extractedItems.map(item => item.category))];
      const categoryMap: Record<string, string> = {};

      for (const categoryName of categories) {
        const { data: existingCategory } = await supabase
          .from('menu_categories')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('name', categoryName)
          .single();

        if (existingCategory) {
          categoryMap[categoryName] = existingCategory.id;
        } else {
          const { data: newCategory, error } = await supabase
            .from('menu_categories')
            .insert({
              restaurant_id: restaurantId,
              name: categoryName,
              display_order: Object.keys(categoryMap).length
            })
            .select('id')
            .single();

          if (error) throw error;
          categoryMap[categoryName] = newCategory.id;
        }
      }

      // Import menu items
      const itemsToInsert = extractedItems.map((item, index) => ({
        restaurant_id: restaurantId,
        category_id: categoryMap[item.category],
        name: item.name,
        description: item.description,
        price_cents: item.price_cents,
        display_order: index,
        is_available: true
      }));

      const { error } = await supabase
        .from('menu_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Imported ${extractedItems.length} menu items successfully`
      });

      setExtractedItems([]);
      setUrl('');
      onItemsImported();
    } catch (error) {
      console.error('Error importing items:', error);
      toast({
        title: "Error",
        description: "Failed to import menu items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (index: number) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  };

  if (showApiKeyInput) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Set up Firecrawl API
          </CardTitle>
          <CardDescription>
            Enter your Firecrawl API key to enable website menu extraction.
            <a 
              href="https://firecrawl.dev/app/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline ml-1"
            >
              Get your API key here →
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Enter your Firecrawl API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
              Save API Key
            </Button>
            <Button variant="outline" onClick={() => setShowApiKeyInput(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Import Menu from Website
          </CardTitle>
          <CardDescription>
            Extract menu items from any restaurant website automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter restaurant website URL (e.g., https://restaurant.com/menu)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleExtractMenu} disabled={loading || !url.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Extract Menu
            </Button>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              API Key: {FirecrawlService.getApiKey() ? '••••••••' : 'Not set'}
            </span>
            <Button 
              variant="link" 
              size="sm"
              onClick={() => setShowApiKeyInput(true)}
            >
              Update API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      {extractedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Menu Items ({extractedItems.length})</CardTitle>
            <CardDescription>
              Review and import the extracted menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {extractedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    <p className="text-sm font-medium">${(item.price_cents / 100).toFixed(2)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setExtractedItems([])}>
                Clear All
              </Button>
              <Button onClick={handleImportItems} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Import {extractedItems.length} Items
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MenuImportTool;