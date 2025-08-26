import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FirecrawlService, MenuItemData } from '@/utils/FirecrawlService';
import { supabase } from "@/integrations/supabase/client";
import { Download, ExternalLink, AlertCircle, Check } from 'lucide-react';

interface MenuImportProps {
  restaurantId: string;
  onImportComplete: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const MenuImport = ({ restaurantId, onImportComplete, isOpen, onClose }: MenuImportProps) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState(FirecrawlService.getApiKey() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [scrapedItems, setScrapedItems] = useState<MenuItemData[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [importStep, setImportStep] = useState<'setup' | 'preview' | 'importing'>('setup');

  const handleScrape = async () => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a Cookin.com URL",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter your Firecrawl API key",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Save API key for future use
      FirecrawlService.saveApiKey(apiKey);
      
      const result = await FirecrawlService.scrapeMenu(url);
      
      if (result.success && result.data) {
        if (result.data.length === 0) {
          toast({
            title: "No menu items found",
            description: "We couldn't extract any menu items from this page. Please check the URL or try a different page.",
            variant: "destructive",
          });
        } else {
          setScrapedItems(result.data);
          setSelectedItems(new Set(result.data.map((_, index) => index)));
          setImportStep('preview');
          toast({
            title: "Success",
            description: `Found ${result.data.length} menu items ready for import`,
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to scrape menu data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error scraping menu:', error);
      toast({
        title: "Error",
        description: "Failed to scrape menu data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    const itemsToImport = scrapedItems.filter((_, index) => selectedItems.has(index));
    
    if (itemsToImport.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one item to import",
        variant: "destructive",
      });
      return;
    }

    setImportStep('importing');
    
    try {
      const importPromises = itemsToImport.map(async (item, index) => {
        const menuItemData = {
          restaurant_id: restaurantId,
          name: item.name,
          description: item.description,
          price_cents: Math.round(item.price * 100),
          is_vegetarian: item.dietary?.vegetarian || false,
          is_vegan: item.dietary?.vegan || false,
          is_gluten_free: item.dietary?.glutenFree || false,
          is_available: true,
          display_order: index,
          category_id: null, // TODO: Map categories if needed
        };

        const { error } = await supabase
          .from('menu_items')
          .insert(menuItemData);

        if (error) throw error;
      });

      await Promise.all(importPromises);

      toast({
        title: "Success",
        description: `Successfully imported ${itemsToImport.length} menu items`,
      });

      onImportComplete();
      handleClose();
    } catch (error) {
      console.error('Error importing menu items:', error);
      toast({
        title: "Error",
        description: "Failed to import some menu items",
        variant: "destructive",
      });
    }
  };

  const toggleItemSelection = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(scrapedItems.map((_, index) => index)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleClose = () => {
    setUrl('');
    setScrapedItems([]);
    setSelectedItems(new Set());
    setImportStep('setup');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Menu from Cookin.com
          </DialogTitle>
          <DialogDescription>
            Scrape and import menu items from your Cookin.com chef profile or any public menu page.
          </DialogDescription>
        </DialogHeader>

        {importStep === 'setup' && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-2 text-sm">
                  <p><strong>You'll need a Firecrawl API key to use this feature.</strong></p>
                  <p>
                    Get your free API key at{' '}
                    <a 
                      href="https://firecrawl.dev" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      firecrawl.dev <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="firecrawl-api-key">Firecrawl API Key</Label>
                <Input
                  id="firecrawl-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="fc-..."
                />
              </div>

              <div>
                <Label htmlFor="cookin-url">Cookin.com Menu URL</Label>
                <Input
                  id="cookin-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://my.cookin.com/chef-name"
                />
              </div>
            </div>
          </div>
        )}

        {importStep === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Preview Items ({scrapedItems.length} found)</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {scrapedItems.map((item, index) => (
                <Card key={index} className={`cursor-pointer transition-colors ${
                  selectedItems.has(index) ? 'ring-2 ring-primary' : ''
                }`} onClick={() => toggleItemSelection(index)}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedItems.has(index)}
                        onChange={() => toggleItemSelection(index)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">{item.name}</h5>
                          <span className="font-semibold text-primary">${item.price.toFixed(2)}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        <div className="flex gap-2 mt-2">
                          {item.category && <Badge variant="secondary">{item.category}</Badge>}
                          {item.dietary?.vegetarian && <Badge variant="outline">Vegetarian</Badge>}
                          {item.dietary?.vegan && <Badge variant="outline">Vegan</Badge>}
                          {item.dietary?.glutenFree && <Badge variant="outline">Gluten Free</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {importStep === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Importing menu items...</p>
          </div>
        )}

        <DialogFooter>
          {importStep === 'setup' && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleScrape} disabled={isLoading}>
                {isLoading ? 'Scraping...' : 'Scrape Menu'}
              </Button>
            </>
          )}
          {importStep === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setImportStep('setup')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={selectedItems.size === 0}>
                Import {selectedItems.size} Items
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};