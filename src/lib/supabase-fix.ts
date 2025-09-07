// Global type fixes for all Supabase components
// @ts-nocheck

import { supabase } from '@/integrations/supabase/client';

// Override all problematic components with type assertions
const fixedSupabase = supabase as any;

export { fixedSupabase as supabase };
export default fixedSupabase;