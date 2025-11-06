// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Typography, List, Tag, Progress, Modal, Alert } from 'antd';
import { SendOutlined, FileTextOutlined, CheckCircleOutlined, LoadingOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { docsAPI } from '../hr/api';
import { renderHtml } from '@/lib/templates';
import { renderDocumentHtml } from '@/utils/templateUtils';
import { getExecutiveData, formatExecutiveForDocuments } from '@/utils/getExecutiveData';

const { Title, Text } = Typography;

// C-Suite document types that should be sent to each executive
const CSUITE_DOC_TYPES = [
  { id: 'employment_agreement', title: 'Executive Employment Agreement' },
  { id: 'board_resolution', title: 'Board Resolution – Appointment of Officers' },
  { id: 'pre_incorporation_consent', title: 'Pre-Incorporation Consent (Conditional Appointments)' },
  { id: 'founders_agreement', title: "Founders' / Shareholders' Agreement" },
  { id: 'stock_issuance', title: 'Stock Subscription / Issuance Agreement' },
  { id: 'confidentiality_ip', title: 'Confidentiality & IP Assignment Agreement' },
  { id: 'deferred_comp_addendum', title: 'Deferred Compensation Addendum' },
  { id: 'offer_letter', title: 'Executive Offer Letter' },
  { id: 'bylaws_officers_excerpt', title: 'Bylaws – Officers (Excerpt)' },
];

// Helper function to get incorporation status
const getIncorporationStatus = async (): Promise<'pre_incorporation' | 'incorporated'> => {
  try {
    const { data } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('setting_key', 'incorporation_status')
      .single();
    
    return (data?.setting_value as 'pre_incorporation' | 'incorporated') || 'pre_incorporation';
  } catch (error) {
    console.warn('Error fetching incorporation status, defaulting to pre_incorporation:', error);
    return 'pre_incorporation';
  }
};

// Helper function to get company setting
const getCompanySetting = async (key: string, defaultValue: string = ''): Promise<string> => {
  try {
    const { data } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .single();
    
    return data?.setting_value || defaultValue;
  } catch (error) {
    console.warn(`Error fetching company setting ${key}:`, error);
    return defaultValue;
  }
};

interface Executive {
  id: string;
  user_id: string;
  role: string;
  title: string;
  full_name: string;
  email: string;
  equity_percent?: string;
  shares_issued?: string;
  annual_salary?: string;
  funding_trigger?: string;
  vesting_schedule?: string;
  strike_price?: string;
  salary_status?: string;
}

interface DocumentStatus {
  type: string;
  title: string;
  exists: boolean;
  documentId?: string;
}

export default function SendCSuiteDocs() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<string, DocumentStatus[]>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocumentUrl, setPreviewDocumentUrl] = useState<string>('');
  const [previewDocumentTitle, setPreviewDocumentTitle] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      setLoading(true);
      
      // Use the unified data access layer
      const executivesData = await getExecutiveData();
      
      const formatted: Executive[] = executivesData.map((exec) => {
        const formattedExec = formatExecutiveForDocuments(exec);
        
        return {
          id: exec.id,
          user_id: exec.user_id,
          role: exec.role,
          title: formattedExec.title,
          full_name: exec.full_name,
          email: exec.email,
          equity_percent: formattedExec.equity_percent,
          shares_issued: formattedExec.shares_issued,
          annual_salary: formattedExec.annual_salary,
          funding_trigger: formattedExec.funding_trigger,
          vesting_schedule: formattedExec.vesting_schedule,
          strike_price: formattedExec.strike_price,
          salary_status: formattedExec.salary_status,
        };
      });

      console.log('Formatted executives:', formatted);

      // Include all executives, even if they don't have emails (will show warning)
      setExecutives(formatted);

      // Check existing documents for each executive
      await checkExistingDocuments(formatted);
    } catch (error: any) {
      console.error('Error fetching executives:', error);
      message.error(`Failed to load executives: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDocuments = async (execList: Executive[]) => {
    const status: Record<string, DocumentStatus[]> = {};

    for (const exec of execList) {
      const execStatus: DocumentStatus[] = [];

      // Check which documents already exist for this executive
      // STRICT: Only match by executive_id to avoid cross-executive document matching
      const { data: existingDocs, error: docsError } = await supabase
        .from('executive_documents')
        .select('id, type, status, officer_name, role, executive_id')
        .eq('executive_id', exec.id); // Only match by executive_id

      if (docsError) {
        console.error(`Error checking documents for ${exec.full_name}:`, docsError);
      }

      console.log(`Documents found for ${exec.full_name} (exec_id: ${exec.id}):`, existingDocs);

      // Match by type and executive_id only
      const existingTypes = new Set(
        (existingDocs || [])
          .filter((d: any) => d.executive_id === exec.id)
          .map((d: any) => d.type)
      );

      for (const docType of CSUITE_DOC_TYPES) {
        const matchingDoc = existingDocs?.find((d: any) => 
          d.type === docType.id && d.executive_id === exec.id
        );

        execStatus.push({
          type: docType.id,
          title: docType.title,
          exists: existingTypes.has(docType.id),
          documentId: matchingDoc?.id,
        });
      }

      status[exec.id] = execStatus;
    }

    setStatusMap(status);
  };

  const generateDocumentData = async (exec: Executive, docType: string) => {
    // Fetch company settings for pre-incorporation consent
    const companyName = await getCompanySetting('company_name', "Crave'n, Inc.");
    const stateOfIncorporation = await getCompanySetting('state_of_incorporation', 'Ohio');
    const registeredOffice = await getCompanySetting('registered_office', '123 Main St, Cleveland, OH 44101');
    const stateFilingOffice = await getCompanySetting('state_filing_office', 'Ohio Secretary of State');
    const registeredAgentName = await getCompanySetting('registered_agent_name', 'TBD');
    const registeredAgentAddress = await getCompanySetting('registered_agent_address', 'TBD');
    const fiscalYearEnd = await getCompanySetting('fiscal_year_end', 'December 31');
    const incorporatorName = await getCompanySetting('incorporator_name', 'Torrance Stroman');
    const incorporatorAddress = await getCompanySetting('incorporator_address', '123 Main St, Cleveland, OH 44101');
    const incorporatorEmail = await getCompanySetting('incorporator_email', 'craven@usa.com');
    const county = await getCompanySetting('county', 'Cuyahoga');

    // Fetch fresh equity data from equity_grants table (linked to exec_users.id)
    // ALL fields must come from appointment flow
    const { data: equityGrant } = await supabase
      .from('equity_grants')
      .select('shares_total, shares_percentage, strike_price, vesting_schedule, grant_date, share_class, consideration_type, consideration_value')
      .eq('executive_id', exec.id)
      .order('grant_date', { ascending: false })
      .limit(1)
      .single();

    // Fetch salary and funding_trigger from board_resolutions (appointment flow)
    // Executives are separate from employees - salary comes from appointment
    let annualSalary = 0;
    let fundingTrigger: string | undefined = exec.funding_trigger;
    
    // Get board resolution for this executive (from appointment flow)
    const { data: resolution } = await supabase
      .from('board_resolutions')
      .select('notes, resolution_text')
      .eq('subject_person_name', exec.full_name)
      .or(`subject_position.eq.${exec.role},subject_position.eq.${exec.title}`)
      .eq('resolution_type', 'appointment')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    
    if (resolution) {
      // Try to parse notes as JSON (if salary/funding_trigger stored there)
      if (resolution.notes) {
        try {
          const notesData = JSON.parse(resolution.notes);
          if (notesData.annual_salary) {
            annualSalary = typeof notesData.annual_salary === 'number' 
              ? notesData.annual_salary 
              : parseFloat(notesData.annual_salary.toString());
          }
          if (notesData.funding_trigger) {
            fundingTrigger = notesData.funding_trigger.toString();
          }
        } catch {
          // Notes is not JSON, try to extract from resolution_text
          // Parse resolution_text for salary mentions
          const salaryMatch = resolution.resolution_text.match(/\$(\d{1,3}(?:,\d{3})*)\s*(?:annual|per\s*year|salary)/i);
          if (salaryMatch) {
            annualSalary = parseFloat(salaryMatch[1].replace(/,/g, ''));
          }
        }
      }
    }

    // CRITICAL: Use equity grant data ONLY (from appointment flow)
    // If no equity grant exists, use exec data as fallback
    const sharesIssued = equityGrant?.shares_total || parseInt(exec.shares_issued || '0');
    const strikePrice = equityGrant?.strike_price || parseFloat(exec.strike_price || '0.0001');
    const equityPercent = equityGrant?.shares_percentage || parseFloat(exec.equity_percent || '0');
    
    // Total Purchase Price = Price per Share × Total Shares
    const totalPurchasePrice = strikePrice * sharesIssued;
    
    // Log data source for debugging
    console.log(`📊 Document data for ${exec.full_name} (ALL from appointment flow):`, {
      equityGrant: equityGrant ? 'FOUND' : 'NOT FOUND',
      // From equity_grants (appointment flow)
      share_class: equityGrant?.share_class || 'fallback',
      shares_total: equityGrant?.shares_total || 'fallback',
      strike_price: equityGrant?.strike_price || 'fallback',
      total_purchase_price: totalPurchasePrice.toFixed(2),
      consideration_type: equityGrant?.consideration_type || 'fallback',
      vesting_schedule: equityGrant?.vesting_schedule || 'fallback',
      equity_percentage: equityGrant?.shares_percentage || 'fallback',
      // From board_resolutions (appointment flow)
      annual_salary: annualSalary || 'NOT FOUND',
      funding_trigger: fundingTrigger || 'NOT FOUND',
      appointment_date: appointmentDate,
    });
    const vestingSchedule = equityGrant?.vesting_schedule 
      ? (typeof equityGrant.vesting_schedule === 'string' 
          ? equityGrant.vesting_schedule 
          : `${equityGrant.vesting_schedule.duration_months || 48} months with ${equityGrant.vesting_schedule.cliff_months || 12} month cliff`)
      : (exec.vesting_schedule || '4 years with 1 year cliff');
    
    // Get appointment date from equity grant (from appointment flow) or board_resolutions
    let appointmentDateStr = '';
    if (equityGrant?.grant_date) {
      appointmentDateStr = new Date(equityGrant.grant_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } else {
      // Try to get from board_resolutions
      const { data: resolution } = await supabase
        .from('board_resolutions')
        .select('effective_date')
        .eq('subject_person_name', exec.full_name)
        .or(`subject_position.eq.${exec.role},subject_position.eq.${exec.title}`)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single();
      
      if (resolution?.effective_date) {
        appointmentDateStr = new Date(resolution.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      } else {
        appointmentDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    }
    
    const appointmentDate = appointmentDateStr;
    const grantDate = equityGrant?.grant_date 
      ? new Date(equityGrant.grant_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : appointmentDate;

    // Create comprehensive baseData matching appointment flow structure
    const baseData: Record<string, any> = {
      // Company info
      company_name: companyName,
      company: companyName,
      corporation: companyName,
      state_of_incorporation: stateOfIncorporation,
      state: stateOfIncorporation,
      company_address: registeredOffice,
      registered_office: registeredOffice,
      state_filing_office: stateFilingOffice,
      registered_agent_name: registeredAgentName,
      registered_agent_address: registeredAgentAddress,
      fiscal_year_end: fiscalYearEnd,
      incorporator_name: incorporatorName,
      incorporator_address: incorporatorAddress,
      incorporator_email: incorporatorEmail,
      county: county,
      
      // Executive info - ALL variations
      full_name: exec.full_name,
      executive_name: exec.full_name,
      name: exec.full_name,
      officer_name: exec.full_name,
      employee_name: exec.full_name,
      recipient_name: exec.full_name,
      subscriber_name: exec.full_name,
      counterparty_name: exec.full_name,
      
      // Role/Position - ALL variations
      role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
      position: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
      title: exec.title || exec.role.toUpperCase(),
      position_title: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
      executive_title: exec.title || exec.role.toUpperCase(),
      officer_title: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
      
      // Dates - ALL variations
      effective_date: appointmentDate,
      date: appointmentDate,
      adoption_date: appointmentDate,
      appointment_date: appointmentDate,
      grant_date: grantDate,
      offer_date: appointmentDate,
      start_date: appointmentDate,
      execution_date: appointmentDate,
      closing_date: appointmentDate,
      board_resolution_date: appointmentDate,
      
      // Equity - ALL variations
      equity_percentage: equityPercent.toString(),
      equity_percent: equityPercent.toString(),
      ownership_percent: equityPercent.toString(),
      equity: equityPercent.toString(),
      
      // Shares - ALL variations
      share_count: sharesIssued.toLocaleString(),
      shares_issued: sharesIssued.toLocaleString(),
      shares_total: sharesIssued.toLocaleString(),
      shares: sharesIssued.toLocaleString(),
      
      // Price - ALL variations (without $ sign - templates should use ${{price_per_share}} format)
      strike_price: strikePrice.toFixed(4),
      price_per_share: strikePrice.toFixed(4),
      share_price: strikePrice.toFixed(4),
      total_purchase_price: totalPurchasePrice.toFixed(2),
      
      // Vesting - ALL variations
      vesting_schedule: vestingSchedule,
      vesting_terms: vestingSchedule,
      vesting: vestingSchedule,
      
      // Salary - ALL variations
      annual_salary: annualSalary.toLocaleString(),
      annual_base_salary: annualSalary.toLocaleString(),
      base_salary: annualSalary.toLocaleString(),
      salary: annualSalary.toLocaleString(),
      
      // Funding - ALL variations (from appointment flow)
      funding_trigger: fundingTrigger ? (fundingTrigger.includes('$') ? fundingTrigger : `$${fundingTrigger.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`) : "Upon Series A funding or significant investment event",
      funding_trigger_amount: fundingTrigger ? fundingTrigger.replace(/\D/g, '') : '0',
      deferral_trigger: fundingTrigger ? (fundingTrigger.includes('$') ? fundingTrigger : `$${fundingTrigger.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`) : "Series A funding",
      
      // Governing Law - ALL variations
      governing_law: "State of Ohio",
      governing_law_state: "Ohio",
      
      // Other
      salary_status: exec.salary_status || 'deferred',
      currency: 'USD',
      // Share Class from appointment flow (equity_grants)
      share_class: equityGrant?.share_class || 'Common Stock',
    };
    
    // Add email if available
    if (exec.email) {
      baseData.executive_email = exec.email;
      baseData.subscriber_email = exec.email;
      baseData.email = exec.email;
    }

    // Template-specific additions (same as appointment flow)
    switch (docType) {
      case 'employment_agreement':
        return baseData;
      case 'offer_letter': {
        const firstName = exec.full_name?.split(' ')[0] || '';
        const sched = vestingSchedule || '';
        const yearsMatch = sched.match(/(\d+)\s*year/);
        const cliffMatch = sched.match(/(\d+)\s*(month|year)s?\s*cliff/i);
        const vesting_period = yearsMatch ? yearsMatch[1] : '4';
        const vesting_cliff = cliffMatch ? `${cliffMatch[1]} ${cliffMatch[2]}${cliffMatch[1] === '1' ? '' : 's'}` : '1 year';
        return {
          ...baseData,
          executive_first_name: firstName,
          executive_address: '',
          reporting_to_title: 'Board of Directors',
          work_location: 'Cleveland, Ohio',
          vesting_period,
          vesting_cliff,
          bonus_structure: 'Discretionary performance bonus as determined by the Board',
          employment_country: 'United States',
          signatory_name: 'Torrance Stroman',
          signatory_title: 'CEO',
          company_mission_statement: 'deliver delightful food experiences to every neighborhood',
        };
      }
      case 'board_resolution':
        return {
          ...baseData,
          directors: "Board of Directors",
          ceo_name: exec.role === 'ceo' ? exec.full_name : '',
          cfo_name: exec.role === 'cfo' ? exec.full_name : '',
          cxo_name: exec.role === 'cxo' ? exec.full_name : '',
          equity_ceo: exec.role === 'ceo' ? equityPercent.toString() : '0',
          equity_cfo: exec.role === 'cfo' ? equityPercent.toString() : '0',
          equity_cxo: exec.role === 'cxo' ? equityPercent.toString() : '0',
        };
      case 'pre_incorporation_consent': {
        // Fetch all executives to populate officers and directors
        const allExecutives = await getExecutiveData();
        const formattedExecs = allExecutives.map(e => formatExecutiveForDocuments(e));
        
        // Get CEO, CFO, CXO, and Secretary
        const ceo = formattedExecs.find(e => e.role === 'ceo');
        const cfo = formattedExecs.find(e => e.role === 'cfo');
        const cxo = formattedExecs.find(e => e.role === 'cxo');
        const secretary = formattedExecs.find(e => e.role === 'secretary') || formattedExecs.find(e => e.role === 'ceo');
        
        // Directors (typically CEO + 2 others)
        const directors = formattedExecs.slice(0, 2);
        
        const consentDate = appointmentDate;
        const notaryDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        return {
          ...baseData,
          // Directors
          director_1_name: directors[0]?.full_name || incorporatorName,
          director_1_address: directors[0]?.full_name ? (registeredOffice) : incorporatorAddress,
          director_1_email: directors[0]?.email || incorporatorEmail,
          director_2_name: directors[1]?.full_name || 'Board Member 2',
          director_2_address: registeredOffice,
          director_2_email: directors[1]?.email || 'board@cravenusa.com',
          // Officers
          officer_1_name: ceo?.full_name || incorporatorName,
          officer_1_title: 'Chief Executive Officer (CEO)',
          officer_1_email: ceo?.email || incorporatorEmail,
          officer_2_name: cfo?.full_name || '',
          officer_2_title: 'Chief Financial Officer (CFO)',
          officer_2_email: cfo?.email || '',
          officer_3_name: cxo?.full_name || '',
          officer_3_title: 'Chief Experience Officer (CXO)',
          officer_3_email: cxo?.email || '',
          officer_4_name: secretary?.full_name || incorporatorName,
          officer_4_title: 'Corporate Secretary',
          officer_4_email: secretary?.email || incorporatorEmail,
          // Acceptance page appointees
          appointee_1_name: ceo?.full_name || incorporatorName,
          appointee_1_role: 'Chief Executive Officer (CEO)',
          appointee_1_email: ceo?.email || incorporatorEmail,
          appointee_2_name: cfo?.full_name || '',
          appointee_2_role: 'Chief Financial Officer (CFO)',
          appointee_2_email: cfo?.email || '',
          appointee_3_name: cxo?.full_name || '',
          appointee_3_role: 'Chief Experience Officer (CXO)',
          appointee_3_email: cxo?.email || '',
          appointee_4_name: secretary?.full_name || incorporatorName,
          appointee_4_role: 'Corporate Secretary',
          appointee_4_email: secretary?.email || incorporatorEmail,
          // Dates
          consent_date: consentDate,
          notary_date: notaryDate,
          // Pre-incorporation agreements (empty by default)
          counterparty_1: '',
          agreement_1_name: '',
          agreement_1_date: '',
          agreement_1_notes: '',
        };
      }
      case 'stock_issuance':
        return {
          ...baseData,
          subscriber_address: "TBD",
          accredited_status: "an accredited investor",
          series_label: "N/A",
          // Consideration from appointment flow (equity_grants)
          consideration_type: equityGrant?.consideration_type || (annualSalary > 0 ? "Services Rendered" : "Founder Contribution"),
          consideration_value: equityGrant?.consideration_value || 0,
          consideration_valuation_basis: "Fair market value of services",
          // Certificate form - typically book-entry for executives
          certificate_form: "Book-entry (no physical certificate)",
          payment_method: annualSalary > 0 ? "Services / Sweat Equity" : "Founder Sweat Equity",
          securities_exemption: "Section 4(a)(2) private placement",
          related_agreement_name: "Founders' Agreement",
          notice_contact_name: "Torrance Stroman",
          notice_contact_title: "CEO",
          notice_contact_email: "craven@usa.com",
        };
      case 'founders_agreement':
        return {
          ...baseData,
          founders_table_html: `<tr><td>${exec.full_name}</td><td>${baseData.role}</td><td>${equityPercent}%</td></tr>`,
          vesting_years: '4',
          cliff_months: '12',
        };
      case 'deferred_comp_addendum':
        return {
          ...baseData,
          defer_until: baseData.funding_trigger,
        };
      case 'confidentiality_ip':
        return baseData;
      case 'bylaws_officers_excerpt':
        return {
          ...baseData,
          secretary_name: 'Torrance Stroman',
        };
      default:
        return baseData;
    }
  };

  const validateExecutive = (exec: Executive, docType?: string): string[] => {
    const issues: string[] = [];
    if (!exec.full_name) issues.push('Missing full name');
    if (!exec.email) issues.push('Missing email');
    if (docType === 'stock_issuance') {
      if (!exec.shares_issued) issues.push('Missing shares issued');
      if (!exec.strike_price) issues.push('Missing strike price');
      if (!exec.vesting_schedule) issues.push('Missing vesting schedule');
    }
    if (docType === 'employment_agreement' || docType === 'offer_letter') {
      if (!exec.equity_percent) issues.push('Missing equity percentage');
    }
    if (docType === 'deferred_comp_addendum') {
      if (!exec.funding_trigger) issues.push('Missing funding trigger');
    }
    return issues;
  };

  const sendDocumentsToExecutive = async (exec: Executive, isPartOfBatch = false) => {
    if (!exec) {
      message.warning('No executive selected');
      return;
    }

    // Prevent multiple simultaneous sends
    if (sending && !isPartOfBatch) {
      message.warning('Please wait for the current send operation to complete');
      return;
    }

    if (!isPartOfBatch) {
      setSending(true);
      setProgress(0);
    }

    try {
      const totalOperations = CSUITE_DOC_TYPES.length;
      let completed = 0;
      const execResults = { exec, success: 0, failed: 0, errors: [] as string[] };

      console.log(`\n=== Sending documents ONLY for ${exec.full_name} (${exec.role}) - ID: ${exec.id} ===`);

      // Collect all documents (existing or newly generated) to send in ONE email
      // ONLY for this specific executive
      const docsForEmail: Array<{ title: string; url: string }> = [];

      // Check incorporation status to determine which document to use
      const incorporationStatus = await getIncorporationStatus();
      
      for (const docType of CSUITE_DOC_TYPES) {
        // Determine actual document type to generate based on incorporation status
        let actualDocType = docType.id;
        let actualDocTitle = docType.title;
        
        // Replace board_resolution with pre_incorporation_consent if pre-incorporation
        if (docType.id === 'board_resolution' && incorporationStatus === 'pre_incorporation') {
          actualDocType = 'pre_incorporation_consent';
          actualDocTitle = 'Pre-Incorporation Consent (Conditional Appointments)';
        }
        // Skip pre_incorporation_consent if incorporated (we'll use board_resolution instead)
        if (docType.id === 'pre_incorporation_consent' && incorporationStatus === 'incorporated') {
          continue; // Skip pre_incorporation_consent, will use board_resolution instead
        }
        
        try {
          // Validate required fields for this document type
          const issues = validateExecutive(exec, actualDocType);
          if (issues.length > 0) {
            const msg = `${actualDocTitle}: ${issues.join(', ')}`;
            console.warn(`Validation failed for ${exec.full_name}:`, msg);
            execResults.failed++;
            execResults.errors.push(msg);
            continue;
          }

          // Check if document already exists (from appointment flow)
          // Check for both board_resolution and pre_incorporation_consent since they're interchangeable
          const statuses = statusMap[exec.id] || [];
          const existingDoc = statuses.find(s => 
            (s.type === actualDocType || 
             (actualDocType === 'board_resolution' && s.type === 'pre_incorporation_consent') ||
             (actualDocType === 'pre_incorporation_consent' && s.type === 'board_resolution')) &&
            s.exists && s.documentId
          );
          
          if (existingDoc?.documentId) {
            // Use existing document from appointment flow
            console.log(`✓ Found existing ${actualDocTitle} for ${exec.full_name} (doc ID: ${existingDoc.documentId})`);
            
            // Fetch document URL
            const { data: doc, error: docError } = await supabase
              .from('executive_documents')
              .select('file_url, executive_id')
              .eq('id', existingDoc.documentId)
              .single();

            if (docError) {
              console.error(`✗ Error fetching existing document:`, docError);
              throw new Error(`Failed to fetch existing document: ${docError.message}`);
            }

            // CRITICAL: Verify document belongs to THIS executive
            if (doc.executive_id !== exec.id) {
              console.error(`✗ SECURITY: Document ${existingDoc.documentId} belongs to executive_id ${doc.executive_id}, not ${exec.id} (${exec.full_name})`);
              throw new Error(`Document ownership mismatch: document belongs to different executive`);
            }

            console.log(`✓ Verified document ${existingDoc.documentId} belongs to ${exec.full_name}`);
            
            if (doc.file_url) {
              docsForEmail.push({ title: actualDocTitle, url: doc.file_url });
              execResults.success++;
            } else {
              throw new Error('Existing document has no file URL');
            }
          } else {
            // Document doesn't exist, generate it using templates from database (or fallback to hardcoded)
            console.log(`Generating ${actualDocTitle} (${actualDocType}) for ${exec.full_name} using proper templates...`);
            const data = await generateDocumentData(exec, actualDocType);
            const html_content = await renderDocumentHtml(actualDocType, data, actualDocType);

            // Generate document via API
            const resp = await docsAPI.post('/documents/generate', {
              template_id: actualDocType,
              officer_name: exec.full_name,
              role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
              equity: actualDocType.includes('equity') ? parseFloat(data.equity_percentage) : undefined,
              data,
              html_content,
              executive_id: exec.id, // Link document to executive for signature portal
            });

            console.log(`Document generation response for ${exec.full_name} - ${actualDocTitle}:`, resp);

            if (resp?.ok && resp?.document) {
              // Collect generated document URL for single combined email
              if (resp.document.file_url) {
                docsForEmail.push({ title: actualDocTitle, url: resp.document.file_url });
              }
              execResults.success++;
            } else {
              throw new Error(`Document generation failed: ${resp?.error || 'Unknown error'}`);
            }
          }
        } catch (error: any) {
          console.error(`✗ Error processing ${actualDocTitle} for ${exec.full_name}:`, error);
          execResults.failed++;
          execResults.errors.push(`${actualDocTitle}: ${error.message || error}`);
        }

        completed++;
        if (!isPartOfBatch) {
          setProgress((completed / totalOperations) * 100);
        }
      }

      // After processing all docs, send ONE email with links + PDF attachments
      // ONLY for this specific executive
      // Send email even if some documents failed, but only if we have at least one document or if there were errors
      if (exec.email) {
        if (docsForEmail.length > 0) {
          console.log(`\n📧 Sending email to ${exec.full_name} (${exec.email}) with ${docsForEmail.length} documents:`);
          docsForEmail.forEach((doc, idx) => {
            console.log(`  ${idx + 1}. ${doc.title}`);
          });
          
          try {
            const { data, error } = await supabase.functions.invoke('send-executive-document-email', {
              body: {
                to: exec.email,
                executiveName: exec.full_name,
                documentTitle: 'C-Suite Executive Documents',
                documents: docsForEmail, // ONLY documents for this executive
              },
            });
            if (error) throw error;
            if (data?.success) {
              console.log(`✓ Email sent successfully to ${exec.full_name} (${exec.email}) with ${docsForEmail.length} documents`);
              execResults.success++; // Count email send as success
            } else {
              throw new Error(data?.error || 'Unknown error from email function');
            }
          } catch (emailErr: any) {
            console.error(`⚠ Email failed for ${exec.full_name}:`, emailErr);
            execResults.errors.push(`Email failed: ${emailErr.message || emailErr}`);
            execResults.failed++;
          }
        } else if (execResults.failed > 0) {
          // If all documents failed, send a notification email explaining the issue
          console.log(`\n📧 Sending error notification email to ${exec.full_name} (${exec.email})`);
          try {
            const errorSummary = execResults.errors.slice(0, 5).join('; '); // Limit to first 5 errors
            const { data, error } = await supabase.functions.invoke('send-executive-document-email', {
              body: {
                to: exec.email,
                executiveName: exec.full_name,
                documentTitle: 'C-Suite Document Generation Notice',
                htmlContent: `
                  <p>Dear ${exec.full_name},</p>
                  <p>We attempted to generate your executive documents, but encountered issues with the following:</p>
                  <ul>
                    ${execResults.errors.map(e => `<li>${e}</li>`).join('')}
                  </ul>
                  <p>Please contact HR to resolve these issues and regenerate your documents.</p>
                  <p>Best regards,<br>HR Team</p>
                `,
                documents: [], // No documents to attach
              },
            });
            if (error) throw error;
            if (data?.success) {
              console.log(`✓ Error notification email sent to ${exec.full_name}`);
            }
          } catch (emailErr: any) {
            console.error(`⚠ Failed to send error notification email:`, emailErr);
          }
        } else {
          console.warn(`⚠ No documents to send for ${exec.full_name} and no errors to report`);
        }
      } else {
        console.warn(`⚠ No email address for ${exec.full_name}, skipping email send`);
      }

      // Log summary for this executive
      if (execResults.failed > 0) {
        console.error(`${exec.full_name} - ${execResults.success} success, ${execResults.failed} failed:`, execResults.errors);
        if (!isPartOfBatch) {
          message.warning(
            `${exec.full_name}: ${execResults.success} successful, ${execResults.failed} failed. One email prepared with available documents.`,
            5
          );
        }
      } else {
        console.log(`${exec.full_name} - All ${execResults.success} documents processed successfully`);
        if (!isPartOfBatch) {
          message.success(`Sent 1 email to ${exec.full_name} with ${docsForEmail.length} documents`);
        }
      }

      // Refresh document status only if not part of batch
      if (!isPartOfBatch) {
        await checkExistingDocuments(executives);
      }

      return execResults;
    } catch (error: any) {
      console.error('Error sending documents:', error);
      if (!isPartOfBatch) {
        message.error(`Failed to send documents: ${error.message}`);
      }
      return { exec, success: 0, failed: CSUITE_DOC_TYPES.length, errors: [error.message] };
    } finally {
      if (!isPartOfBatch) {
        setSending(false);
        setProgress(0);
      }
    }
  };

  const sendDocumentsToAll = async () => {
    if (executives.length === 0) {
      message.warning('No executives found');
      return;
    }

    const execsWithEmail = executives.filter(e => e.email);
    if (execsWithEmail.length === 0) {
      message.error('No executives have email addresses');
      return;
    }

    setSending(true);
    setProgress(0);

    try {
      const totalExecs = execsWithEmail.length;
      let completed = 0;
      const allResults: any[] = [];

      message.info(`Sending documents to ${totalExecs} executives...`);

      for (const exec of execsWithEmail) {
        console.log(`\n=== Sending to ${exec.full_name} (${completed + 1}/${totalExecs}) ===`);
        const result = await sendDocumentsToExecutive(exec, true);
        allResults.push(result);
        completed++;
        setProgress((completed / totalExecs) * 100);
      }

      // Refresh document status after all are done
      await checkExistingDocuments(executives);

      // Show summary
      const totalSuccess = allResults.reduce((sum, r) => sum + r.success, 0);
      const totalFailed = allResults.reduce((sum, r) => sum + r.failed, 0);

      if (totalFailed > 0) {
        message.warning(
          `Completed: ${totalSuccess} documents sent successfully, ${totalFailed} failed across ${totalExecs} executives`,
          6
        );
      } else {
        message.success(
          `Successfully sent all documents to ${totalExecs} executives!`,
          4
        );
      }
    } catch (error: any) {
      console.error('Error in batch send:', error);
      message.error(`Batch send failed: ${error.message}`);
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  const sendExistingDocument = async (exec: Executive, docType: { id: string; title: string }, documentId: string) => {
    // Fetch document URL
    const { data: doc } = await supabase
      .from('executive_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (doc?.file_url) {
      await sendDocumentEmail(exec, docType.title, doc.file_url);
    }
  };

  const sendDocumentEmail = async (exec: Executive, docTitle: string, docUrl: string) => {
    if (!exec.email) {
      console.warn(`No email address for ${exec.full_name}, skipping email send`);
      return;
    }

    try {
      console.log(`Sending email for ${docTitle} to ${exec.email}...`);
      
      // Use Supabase edge function to send email
      const { data, error } = await supabase.functions.invoke('send-executive-document-email', {
        body: {
          to: exec.email,
          executiveName: exec.full_name,
          documentTitle: docTitle,
          documentUrl: docUrl,
        },
      });

      if (error) {
        console.error(`✗ Email error for ${exec.full_name} - ${docTitle}:`, error);
        throw new Error(`Email failed: ${error.message || 'Unknown error'}`);
      }

      if (data?.success) {
        console.log(`✓ Email sent successfully to ${exec.email} for ${docTitle}`);
      } else {
        console.error(`✗ Email send failed for ${exec.full_name} - ${docTitle}:`, data);
        throw new Error(`Email failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error(`✗ Error sending email to ${exec.email} for ${docTitle}:`, error);
      throw error; // Re-throw so it's caught by the calling function
    }
  };

  const handlePreviewDocument = async (documentId: string, documentTitle: string) => {
    setPreviewLoading(true);
    try {
      // Fetch document from database
      const { data: doc, error } = await supabase
        .from('executive_documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      if (!doc?.file_url) {
        message.error('Document URL not found');
        return;
      }

      setPreviewDocumentUrl(doc.file_url);
      setPreviewDocumentTitle(documentTitle);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error fetching document for preview:', error);
      message.error('Failed to load document for preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const regenerateDocuments = async (exec: Executive) => {
    if (!exec) {
      message.warning('No executive selected');
      return;
    }

    setRegenerating(true);
    setProgress(0);

    try {
      const totalOperations = CSUITE_DOC_TYPES.length;
      let completed = 0;
      const execResults = { exec, success: 0, failed: 0, errors: [] as string[] };

      console.log(`Regenerating all documents for ${exec.full_name} (${exec.role})...`);

      // Delete all existing documents for this executive
      const { error: deleteError } = await supabase
        .from('executive_documents')
        .delete()
        .or(`officer_name.eq.${exec.full_name},role.eq.${exec.role},role.eq.${exec.title}`);

      if (deleteError) {
        console.error('Error deleting existing documents:', deleteError);
      }

      // Check incorporation status to determine which document to use
      const incorporationStatus = await getIncorporationStatus();
      
      // Generate all documents fresh
      for (const docType of CSUITE_DOC_TYPES) {
        // Determine actual document type to generate based on incorporation status
        let actualDocType = docType.id;
        let actualDocTitle = docType.title;
        
        // Replace board_resolution with pre_incorporation_consent if pre-incorporation
        if (docType.id === 'board_resolution' && incorporationStatus === 'pre_incorporation') {
          actualDocType = 'pre_incorporation_consent';
          actualDocTitle = 'Pre-Incorporation Consent (Conditional Appointments)';
        }
        // Skip pre_incorporation_consent if incorporated (we'll use board_resolution instead)
        if (docType.id === 'pre_incorporation_consent' && incorporationStatus === 'incorporated') {
          continue; // Skip pre_incorporation_consent, will use board_resolution instead
        }
        
        try {
          console.log(`Generating ${actualDocTitle} (${actualDocType}) for ${exec.full_name}...`);
          const data = await generateDocumentData(exec, actualDocType);
          const html_content = await renderDocumentHtml(actualDocType, data, actualDocType);

          // Generate document via API
          const resp = await docsAPI.post('/documents/generate', {
            template_id: actualDocType,
            officer_name: exec.full_name,
            role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
            equity: actualDocType.includes('equity') ? parseFloat(data.equity_percentage) : undefined,
            data,
            html_content,
            executive_id: exec.id, // Link document to executive for signature portal
          });

          console.log(`Document generation response for ${exec.full_name} - ${actualDocTitle}:`, resp);

          if (resp?.ok && resp?.document) {
            execResults.success++;
          } else {
            throw new Error(`Document generation failed: ${resp?.error || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error(`✗ Error regenerating ${actualDocTitle} for ${exec.full_name}:`, error);
          execResults.failed++;
          execResults.errors.push(`${actualDocTitle}: ${error.message || error}`);
        }

        completed++;
        setProgress((completed / totalOperations) * 100);
      }

      // Log summary for this executive
      if (execResults.failed > 0) {
        console.error(`${exec.full_name} - ${execResults.success} success, ${execResults.failed} failed:`, execResults.errors);
        message.warning(
          `${exec.full_name}: ${execResults.success} regenerated successfully, ${execResults.failed} failed.`,
          5
        );
      } else {
        console.log(`${exec.full_name} - All ${execResults.success} documents regenerated successfully`);
        message.success(`Regenerated all ${execResults.success} documents for ${exec.full_name}`);
      }

      // Refresh document status
      await checkExistingDocuments(executives);
    } catch (error: any) {
      console.error('Error regenerating documents:', error);
      message.error(`Failed to regenerate documents: ${error.message}`);
    } finally {
      setRegenerating(false);
      setProgress(0);
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: '#ff7a45' }} />
          <Title level={4} style={{ margin: 0 }}>Send C-Suite Documents</Title>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendDocumentsToAll}
          loading={sending}
          disabled={executives.filter(e => e.email).length === 0 || regenerating}
          style={{ background: 'linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%)', border: 'none' }}
        >
          Send to All ({executives.filter(e => e.email).length})
        </Button>
      }
    >
      <Alert
        message="C-Suite Document Distribution"
        description="Send documents to all executives at once using the 'Send to All' button, or send to individual executives using the 'Send Docs' button next to their name."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {(sending || regenerating) && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={Math.round(progress)} status="active" />
          <Text type="secondary">{sending ? 'Sending documents...' : 'Regenerating documents...'}</Text>
        </div>
      )}

      <List
        loading={loading}
        dataSource={executives}
        renderItem={(exec) => {
          const statuses = statusMap[exec.id] || [];
          const existingCount = statuses.filter(s => s.exists).length;
          const totalCount = CSUITE_DOC_TYPES.length;

          return (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => sendDocumentsToExecutive(exec)}
                  loading={sending}
                  disabled={!exec.email || regenerating}
                  size="small"
                >
                  Send Docs
                </Button>,
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => regenerateDocuments(exec)}
                  loading={regenerating}
                  disabled={sending}
                  size="small"
                >
                  Regenerate
                </Button>
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{exec.full_name}</Text>
                    <Tag color={exec.role === 'ceo' ? 'red' : exec.role === 'cfo' ? 'blue' : 'green'}>
                      {exec.role.toUpperCase()}
                    </Tag>
                    <Text type="secondary">{exec.email || 'No email'}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {!exec.email && (
                      <Tag color="red" style={{ marginBottom: 4 }}>
                        ⚠ No email address - cannot send documents
                      </Tag>
                    )}
                    <Text>
                      Documents: {existingCount} of {totalCount} generated
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {statuses.map((status) => (
                        <Space key={status.type} size={4}>
                          <Tag
                            color={status.exists ? 'green' : 'orange'}
                            icon={status.exists ? <CheckCircleOutlined /> : <LoadingOutlined />}
                          >
                            {status.title}
                          </Tag>
                          {status.exists && status.documentId && (
                            <Button
                              type="link"
                              icon={<EyeOutlined />}
                              size="small"
                              onClick={() => handlePreviewDocument(status.documentId!, status.title)}
                              style={{ padding: 0, height: 'auto' }}
                            >
                              Preview
                            </Button>
                          )}
                        </Space>
                      ))}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />

      {/* Document Preview Modal */}
      <Modal
        title={`Preview: ${previewDocumentTitle}`}
        open={showPreview}
        onCancel={() => {
          setShowPreview(false);
          setPreviewDocumentUrl('');
          setPreviewDocumentTitle('');
        }}
        width={900}
        footer={[
          <Button key="close" onClick={() => {
            setShowPreview(false);
            setPreviewDocumentUrl('');
            setPreviewDocumentTitle('');
          }}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<FileTextOutlined />}
            onClick={() => {
              if (previewDocumentUrl) {
                window.open(previewDocumentUrl, '_blank');
              }
            }}
          >
            Open in New Tab
          </Button>,
        ]}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <LoadingOutlined style={{ fontSize: 32 }} />
            <div style={{ marginTop: 16 }}>
              <Text>Loading document...</Text>
            </div>
          </div>
        ) : previewDocumentUrl ? (
          <div style={{ width: '100%', height: '70vh', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
            <iframe
              src={previewDocumentUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={previewDocumentTitle}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">No document URL available</Text>
          </div>
        )}
      </Modal>
    </Card>
  );
}

