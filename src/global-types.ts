// Global type fixes for Supabase integration until types regenerate
declare global {
  interface Window {
    supabase: any;
  }
}

// Extend the supabase client type temporarily
declare module '@/integrations/supabase/client' {
  export const supabase: any;
}

export {};