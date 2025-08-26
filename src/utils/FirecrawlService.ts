import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status: string;
  completed: number;
  total: number;
  creditsUsed: number;
  expiresAt: string;
  data: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export interface MenuItemData {
  name: string;
  description: string;
  price: number;
  category?: string;
  dietary?: {
    vegetarian?: boolean;
    vegan?: boolean;
    glutenFree?: boolean;
  };
}

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
    console.log('API key saved successfully');
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('Testing API key with Firecrawl API');
      this.firecrawlApp = new FirecrawlApp({ apiKey });
      // A simple test scrape to verify the API key
      const testResponse = await this.firecrawlApp.scrape('https://example.com');
      return !!testResponse && !!testResponse.markdown;
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async scrapeMenu(url: string): Promise<{ success: boolean; error?: string; data?: MenuItemData[] }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      console.log('Making scrape request to Firecrawl API for menu extraction');
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const scrapeResponse = await this.firecrawlApp.scrape(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      });

      if (!scrapeResponse || !scrapeResponse.markdown) {
        console.error('Scrape failed: No markdown content returned');
        return { 
          success: false, 
          error: 'Failed to scrape website - no content returned' 
        };
      }

      console.log('Scrape successful, parsing menu data...');
      const menuItems = this.parseMenuData(scrapeResponse.markdown);
      
      return { 
        success: true,
        data: menuItems 
      };
    } catch (error) {
      console.error('Error during scrape:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  private static parseMenuData(markdown: string): MenuItemData[] {
    const menuItems: MenuItemData[] = [];
    const lines = markdown.split('\n');
    
    let currentItem: Partial<MenuItemData> | null = null;
    let currentCategory = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect headers that might be categories
      if (line.startsWith('##') || line.startsWith('#')) {
        const headerText = line.replace(/^#+\s*/, '').trim();
        if (!headerText.toLowerCase().includes('menu') && 
            !headerText.toLowerCase().includes('about') &&
            !headerText.toLowerCase().includes('contact')) {
          currentCategory = headerText;
        }
        continue;
      }
      
      // Look for items with prices
      const priceMatch = line.match(/\$(\d+(?:\.\d{2})?)/);
      if (priceMatch) {
        // If we have a current item, save it
        if (currentItem && currentItem.name) {
          menuItems.push({
            name: currentItem.name,
            description: currentItem.description || '',
            price: currentItem.price || 0,
            category: currentCategory,
            dietary: currentItem.dietary || {}
          });
        }
        
        // Start a new item
        const price = parseFloat(priceMatch[1]);
        const nameMatch = line.replace(/\$\d+(?:\.\d{2})?.*/, '').trim();
        
        if (nameMatch) {
          currentItem = {
            name: nameMatch,
            price,
            category: currentCategory,
            dietary: {}
          };
        }
      }
      
      // Look for descriptions (lines after prices without new prices)
      else if (currentItem && line && !line.match(/\$\d+/) && 
               !line.startsWith('#') && !line.startsWith('*') && 
               line.length > 10) {
        if (!currentItem.description) {
          currentItem.description = line;
        } else {
          currentItem.description += ' ' + line;
        }
        
        // Check for dietary information
        if (line.toLowerCase().includes('vegetarian')) {
          currentItem.dietary!.vegetarian = true;
        }
        if (line.toLowerCase().includes('vegan')) {
          currentItem.dietary!.vegan = true;
        }
        if (line.toLowerCase().includes('gluten-free') || line.toLowerCase().includes('gluten free')) {
          currentItem.dietary!.glutenFree = true;
        }
      }
    }
    
    // Don't forget the last item
    if (currentItem && currentItem.name) {
      menuItems.push({
        name: currentItem.name,
        description: currentItem.description || '',
        price: currentItem.price || 0,
        category: currentCategory,
        dietary: currentItem.dietary || {}
      });
    }
    
    return menuItems.filter(item => item.name && item.price > 0);
  }
}