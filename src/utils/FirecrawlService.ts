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
      return testResponse && typeof testResponse === 'object';
    } catch (error) {
      console.error('Error testing API key:', error);
      return false;
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: any }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      console.log('Making crawl request to Firecrawl API');
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }

      const crawlResponse = await this.firecrawlApp.scrape(url, {
        formats: ['markdown', 'html'],
      }) as any;

      if (!crawlResponse || typeof crawlResponse !== 'object') {
        console.error('Crawl failed: Invalid response');
        return { 
          success: false, 
          error: 'Failed to crawl website - invalid response' 
        };
      }

      console.log('Crawl successful:', crawlResponse);
      return { 
        success: true,
        data: { data: [crawlResponse] }
      };
    } catch (error) {
      console.error('Error during crawl:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' 
      };
    }
  }

  static async parseMenuFromUrl(url: string): Promise<{ success: boolean; menuItems?: any[]; error?: string }> {
    try {
      const crawlResult = await this.crawlWebsite(url);
      
      if (!crawlResult.success) {
        return { success: false, error: crawlResult.error };
      }

      // Extract menu items from crawled data
      const menuItems = this.extractMenuItems(crawlResult.data);
      
      return { success: true, menuItems };
    } catch (error) {
      console.error('Error parsing menu from URL:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to parse menu from URL' 
      };
    }
  }

  private static extractMenuItems(crawlData: any): any[] {
    // This is a simplified menu extraction - in a real implementation,
    // you'd use more sophisticated parsing based on common menu structures
    const menuItems: any[] = [];
    
    if (crawlData?.data && Array.isArray(crawlData.data)) {
      crawlData.data.forEach((page: any) => {
        if (page.markdown || page.content) {
          const content = page.markdown || page.content;
          // Simple regex-based extraction for demonstration
          // In practice, you'd want more sophisticated parsing
          const lines = content.split('\n');
          let currentCategory = '';
          
          lines.forEach((line: string) => {
            // Detect category headers (lines with ## or ###)
            if (line.match(/^#{2,3}\s+(.+)/)) {
              currentCategory = line.replace(/^#{2,3}\s+/, '').trim();
            }
            
            // Detect menu items (lines with price patterns)
            const priceMatch = line.match(/(.+?)\s*[\$\€\£]?(\d+\.?\d*)/);
            if (priceMatch && priceMatch[1] && priceMatch[2]) {
              const [, name, price] = priceMatch;
              if (name.length > 3 && name.length < 100) { // Basic validation
                menuItems.push({
                  name: name.trim(),
                  price_cents: Math.round(parseFloat(price) * 100),
                  category: currentCategory || 'Main',
                  description: '',
                  source_url: page.sourceURL || page.url || ''
                });
              }
            }
          });
        }
      });
    }
    
    return menuItems;
  }
}