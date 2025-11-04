import { supabase } from "@/integrations/supabase/client";

async function invokeEdgeFunction(functionName: string, data?: any) {
  const { data: result, error } = await supabase.functions.invoke(functionName, {
    body: data,
  });

  if (error) throw error;
  return result;
}

export const docsAPI = {
  get: async (endpoint: string) => {
    if (endpoint === "/documents/templates") {
      return invokeEdgeFunction("document-templates");
    }
    throw new Error(`Unsupported GET endpoint: ${endpoint}`);
  },
  post: async (endpoint: string, data?: any) => {
    if (endpoint === "/documents/generate") {
      return invokeEdgeFunction("document-generate", data);
    }
    throw new Error(`Unsupported POST endpoint: ${endpoint}`);
  },
};

