// Temporary type overrides until Supabase types regenerate properly
declare module '@/integrations/supabase/client' {
  export const supabase: any;
}

// Global type overrides for admin components
declare global {
  interface Application {
    [key: string]: any;
  }
  
  interface Order {
    [key: string]: any;
  }
  
  interface Driver {
    [key: string]: any;
  }
  
  interface PaymentMethod {
    [key: string]: any;
  }
  
  interface Restaurant {
    [key: string]: any;
  }
}

export {};