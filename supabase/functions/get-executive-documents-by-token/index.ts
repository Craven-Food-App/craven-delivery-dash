import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: { token?: string } = await req.json();

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing or invalid signature token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // First, get one document to find the executive_id
    const { data: sampleDoc, error: sampleError } = await supabase
      .from("executive_documents")
      .select("executive_id, officer_name, role")
      .eq("signature_token", token)
      .maybeSingle();

    if (sampleError) throw sampleError;

    if (!sampleDoc || !sampleDoc.executive_id) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid or expired signature token" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get executive user info
    const { data: execUser, error: execError } = await supabase
      .from("exec_users")
      .select("id, user_id, title, role")
      .eq("id", sampleDoc.executive_id)
      .maybeSingle();

    if (execError) throw execError;

    // Get auth user info if available
    let userEmail = null;
    let userName = sampleDoc.officer_name || null;
    if (execUser?.user_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(execUser.user_id);
      if (authUser?.user) {
        userEmail = authUser.user.email;
        userName = authUser.user.user_metadata?.full_name || userName;
      }
    }

    // Fetch all documents for this executive
    const { data: documents, error: docsError } = await supabase
      .from("executive_documents")
      .select("id, officer_name, role, type, status, signature_status, file_url, signed_file_url, packet_id, signing_stage, signing_order, required_signers, signer_roles, signature_token, signature_token_expires_at, created_at, depends_on_document_id, template_id")
      .eq("executive_id", sampleDoc.executive_id)
      .order("signing_stage", { ascending: true, nullsFirst: false })
      .order("signing_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true });

    if (docsError) throw docsError;

    // Check token expiration on any document
    const hasExpiredToken = documents?.some(doc => {
      if (!doc.signature_token_expires_at) return false;
      const expiresAt = new Date(doc.signature_token_expires_at);
      return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < Date.now();
    });

    if (hasExpiredToken) {
      return new Response(
        JSON.stringify({ ok: false, error: "This signing link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Organize documents into stages
    const stages = [
      {
        id: 1,
        name: "Pre-Incorporation",
        description: "Initial consent and appointment documents",
        documents: documents?.filter(d => d.signing_stage === 1) || []
      },
      {
        id: 2,
        name: "Appointment & Authority",
        description: "Officer appointment and authority documents",
        documents: documents?.filter(d => d.signing_stage === 2) || []
      },
      {
        id: 3,
        name: "Employment & Core Agreements",
        description: "Employment terms and confidentiality agreements",
        documents: documents?.filter(d => d.signing_stage === 3) || []
      },
      {
        id: 4,
        name: "Equity & Compensation",
        description: "Stock options and compensation agreements",
        documents: documents?.filter(d => d.signing_stage === 4) || []
      }
    ].filter(stage => stage.documents.length > 0);

    // Add ungrouped documents as a stage if any exist
    const ungrouped = documents?.filter(d => !d.signing_stage) || [];
    if (ungrouped.length > 0) {
      stages.push({
        id: 999,
        name: "Additional Documents",
        description: "Other documents requiring signature",
        documents: ungrouped
      });
    }

    // Format documents for response
    const formattedDocuments = documents?.map(doc => ({
      id: doc.id,
      name: doc.type?.replace(/_/g, ' ') || 'Document',
      required: true,
      fileUrl: doc.file_url,
      signature_status: doc.signature_status,
      signed_file_url: doc.signed_file_url,
      signing_stage: doc.signing_stage,
      signing_order: doc.signing_order,
      depends_on_document_id: doc.depends_on_document_id,
      created_at: doc.created_at,
    })) || [];

    return new Response(
      JSON.stringify({
        ok: true,
        token: token,
        user: {
          email: userEmail,
          name: userName,
          title: execUser?.title || sampleDoc.role || "Executive",
          company: "Crave'n, Inc."
        },
        documentFlow: stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          description: stage.description,
          documents: stage.documents.map(doc => ({
            id: doc.id,
            name: doc.type?.replace(/_/g, ' ') || 'Document',
            required: true,
            fileUrl: doc.file_url,
            templateId: doc.template_id,
            signature_status: doc.signature_status,
            signed_file_url: doc.signed_file_url,
            signing_stage: doc.signing_stage,
            signing_order: doc.signing_order,
            depends_on_document_id: doc.depends_on_document_id,
          }))
        })),
        alreadySigned: documents?.filter(d => d.signature_status === 'signed').reduce((acc, doc) => {
          acc[doc.id] = {
            signature: doc.officer_name || "Signed",
            timestamp: doc.created_at,
          };
          return acc;
        }, {} as Record<string, any>) || {}
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-executive-documents-by-token error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unexpected error";
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

