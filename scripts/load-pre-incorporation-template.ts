import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get environment variables from process.env or require them to be set
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function loadPreIncorporationTemplate() {
  try {
    // Read the template file - try multiple paths
    const possiblePaths = [
      path.join(process.cwd(), 'server', 'templates', 'pre_incorporation_consent.hbs'),
      path.join(__dirname, '..', 'server', 'templates', 'pre_incorporation_consent.hbs'),
    ];
    
    let templatePath = '';
    let templateContent = '';
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        templatePath = p;
        templateContent = fs.readFileSync(p, 'utf-8');
        break;
      }
    }
    
    if (!templateContent) {
      throw new Error(`Template file not found. Tried: ${possiblePaths.join(', ')}`);
    }
    
    console.log(`Read template file: ${templatePath}`);
    console.log(`Template size: ${templateContent.length} characters`);
    
    // Check if template already exists
    const { data: existing, error: checkError } = await supabase
      .from('document_templates')
      .select('id')
      .eq('template_key', 'pre_incorporation_consent')
      .single();
    
    if (existing) {
      // Update existing template
      console.log('Updating existing template...');
      const { error: updateError } = await supabase
        .from('document_templates')
        .update({
          html_content: templateContent,
          placeholders: [
            'company_name', 'state', 'state_of_incorporation', 'registered_office', 'state_filing_office',
            'director_1_name', 'director_1_address', 'director_1_email',
            'director_2_name', 'director_2_address', 'director_2_email',
            'officer_1_name', 'officer_1_title', 'officer_1_email',
            'officer_2_name', 'officer_2_title', 'officer_2_email',
            'officer_3_name', 'officer_3_title', 'officer_3_email',
            'officer_4_name', 'officer_4_title', 'officer_4_email',
            'fiscal_year_end', 'registered_agent_name', 'registered_agent_address',
            'incorporator_name', 'incorporator_address', 'incorporator_email',
            'county', 'consent_date', 'notary_date',
            'appointee_1_name', 'appointee_1_role', 'appointee_1_email',
            'appointee_2_name', 'appointee_2_role', 'appointee_2_email',
            'appointee_3_name', 'appointee_3_role', 'appointee_3_email',
            'appointee_4_name', 'appointee_4_role', 'appointee_4_email',
            'counterparty_1', 'agreement_1_name', 'agreement_1_date', 'agreement_1_notes'
          ],
          updated_at: new Date().toISOString(),
        })
        .eq('template_key', 'pre_incorporation_consent');
      
      if (updateError) {
        throw updateError;
      }
      console.log('✅ Template updated successfully!');
    } else {
      // Create new template
      console.log('Creating new template...');
      const { error: insertError } = await supabase
        .from('document_templates')
        .insert({
          template_key: 'pre_incorporation_consent',
          name: 'Pre-Incorporation Consent (Conditional Appointments)',
          category: 'executive',
          html_content: templateContent,
          placeholders: [
            'company_name', 'state', 'state_of_incorporation', 'registered_office', 'state_filing_office',
            'director_1_name', 'director_1_address', 'director_1_email',
            'director_2_name', 'director_2_address', 'director_2_email',
            'officer_1_name', 'officer_1_title', 'officer_1_email',
            'officer_2_name', 'officer_2_title', 'officer_2_email',
            'officer_3_name', 'officer_3_title', 'officer_3_email',
            'officer_4_name', 'officer_4_title', 'officer_4_email',
            'fiscal_year_end', 'registered_agent_name', 'registered_agent_address',
            'incorporator_name', 'incorporator_address', 'incorporator_email',
            'county', 'consent_date', 'notary_date',
            'appointee_1_name', 'appointee_1_role', 'appointee_1_email',
            'appointee_2_name', 'appointee_2_role', 'appointee_2_email',
            'appointee_3_name', 'appointee_3_role', 'appointee_3_email',
            'appointee_4_name', 'appointee_4_role', 'appointee_4_email',
            'counterparty_1', 'agreement_1_name', 'agreement_1_date', 'agreement_1_notes'
          ],
          description: 'Pre-incorporation consent template for conditional officer appointments',
          is_active: true,
        });
      
      if (insertError) {
        throw insertError;
      }
      console.log('✅ Template created successfully!');
    }
    
    console.log('\n✅ Pre-incorporation consent template loaded into database!');
    console.log('You can now generate pre-incorporation documents.');
    
  } catch (error: any) {
    console.error('❌ Error loading template:', error);
    process.exit(1);
  }
}

loadPreIncorporationTemplate();

