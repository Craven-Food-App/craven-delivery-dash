export const env = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 5050,
  SUPABASE_URL: process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY!, // or service role if only server-side
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || "documents",
  
  // Email via Microsoft 365 (or any SMTP):
  SMTP_HOST: process.env.SMTP_HOST || "smtp.office365.com",
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  SMTP_USER: process.env.SMTP_USER!,    // e.g. no-reply@cravenusa.com
  SMTP_PASS: process.env.SMTP_PASS!,    // app password or OAuth2 token
  SMTP_FROM: process.env.SMTP_FROM || "Crave'n Docs <no-reply@cravenusa.com>",
  
  ORIGIN: process.env.ORIGIN || "http://localhost:5173"
};

