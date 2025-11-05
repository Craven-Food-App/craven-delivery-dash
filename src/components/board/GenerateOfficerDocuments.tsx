// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Typography, List, Tag, Progress, Modal, Alert } from 'antd';
import { SendOutlined, FileTextOutlined, CheckCircleOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
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
  { id: 'founders_agreement', title: "Founders' / Shareholders' Agreement" },
  { id: 'stock_issuance', title: 'Stock Subscription / Issuance Agreement' },
  { id: 'confidentiality_ip', title: 'Confidentiality & IP Assignment Agreement' },
  { id: 'deferred_comp_addendum', title: 'Deferred Compensation Addendum' },
  { id: 'offer_letter', title: 'Executive Offer Letter' },
  { id: 'bylaws_officers_excerpt', title: 'Bylaws – Officers (Excerpt)' },
];

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
      // Prioritize executive_id matching for accuracy, then fall back to name/role
      const { data: existingDocs, error: docsError } = await supabase
        .from('executive_documents')
        .select('id, type, status, officer_name, role, executive_id')
        .or(`executive_id.eq.${exec.id},officer_name.eq.${exec.full_name}`);

      if (docsError) {
        console.error(`Error checking documents for ${exec.full_name}:`, docsError);
      }

      console.log(`Documents found for ${exec.full_name}:`, existingDocs);

      // Match by type and executive_id (most accurate), then fall back to name
      const existingTypes = new Set(
        (existingDocs || [])
          .filter((d: any) => 
            d.executive_id === exec.id || 
            d.officer_name === exec.full_name
          )
          .map((d: any) => d.type)
      );

      for (const docType of CSUITE_DOC_TYPES) {
        const matchingDoc = existingDocs?.find((d: any) => 
          d.type === docType.id && 
          (d.executive_id === exec.id || d.officer_name === exec.full_name)
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

  const generateDocumentData = (exec: Executive, docType: string) => {
    // Calculate actual values from executive data
    const sharesIssued = parseInt(exec.shares_issued || '0');
    const strikePrice = parseFloat(exec.strike_price || '0.0001');
    const purchasePrice = strikePrice * sharesIssued;
    const annualSalary = parseInt(exec.annual_salary || '0');
    const equityPercent = parseFloat(exec.equity_percent || '0');
    
    const baseData = {
      company_name: "Crave'n, Inc.",
      state_of_incorporation: "Ohio",
      full_name: exec.full_name,
      role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
      effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      funding_trigger: exec.funding_trigger ? `$${parseInt(exec.funding_trigger).toLocaleString()}` : "Upon Series A funding or significant investment event",
      governing_law: "State of Ohio",
      governing_law_state: "Ohio",
      equity_percentage: exec.equity_percent || '0',
      annual_salary: annualSalary.toLocaleString(),
      vesting_schedule: exec.vesting_schedule || '4 years with 1 year cliff',
      strike_price: strikePrice.toFixed(4),
      shares_issued: sharesIssued.toLocaleString(),
      salary_status: exec.salary_status || 'deferred',
      company_address: "123 Main St, Cleveland, OH 44101",
    };

    // Add template-specific data
    switch (docType) {
      case 'employment_agreement':
        return {
          ...baseData,
          base_salary: annualSalary.toLocaleString(),
          equity_grant: `${equityPercent}% (${sharesIssued.toLocaleString()} shares)`,
          start_date: baseData.effective_date,
          benefits: "Health insurance upon funding, 15 days PTO",
        };
      case 'offer_letter': {
        const firstName = exec.full_name?.split(' ')[0] || '';
        const sched = baseData.vesting_schedule || '';
        const yearsMatch = sched.match(/(\d+)\s*year/);
        const cliffMatch = sched.match(/(\d+)\s*(month|year)s?\s*cliff/i);
        const vesting_period = yearsMatch ? yearsMatch[1] : '4';
        const vesting_cliff = cliffMatch ? `${cliffMatch[1]} ${cliffMatch[2]}${cliffMatch[1] === '1' ? '' : 's'}` : '1 year';

        return {
          ...baseData,
          company_name: baseData.company_name,
          offer_date: baseData.effective_date,
          executive_name: exec.full_name,
          executive_first_name: firstName,
          executive_address: '',
          executive_email: exec.email || '',
          position_title: baseData.role,
          reporting_to_title: 'Board of Directors',
          work_location: 'Cleveland, Ohio',
          start_date: baseData.effective_date,
          annual_base_salary: annualSalary.toLocaleString(),
          currency: 'USD',
          funding_trigger_amount: exec.funding_trigger ? parseInt(exec.funding_trigger).toLocaleString() : '0',
          share_count: sharesIssued.toLocaleString(),
          share_class: 'Common Stock',
          ownership_percent: equityPercent.toString(),
          vesting_period,
          vesting_cliff,
          bonus_structure: 'Discretionary performance bonus as determined by the Board',
          employment_country: 'United States',
          governing_law_state: 'Ohio',
          signatory_name: 'Torrance Stroman',
          signatory_title: 'CEO',
          company_mission_statement: 'deliver delightful food experiences to every neighborhood',
        };
      }
      case 'board_resolution':
        return {
          ...baseData,
          date: baseData.effective_date,
          directors: "Board of Directors",
          officer_name: exec.full_name,
          officer_title: baseData.role,
          officer_salary: annualSalary.toLocaleString(),
          officer_equity: `${equityPercent}% (${sharesIssued.toLocaleString()} shares)`,
          ceo_name: exec.role === 'ceo' ? exec.full_name : '',
          cfo_name: exec.role === 'cfo' ? exec.full_name : '',
          cxo_name: exec.role === 'cxo' ? exec.full_name : '',
          equity_ceo: exec.role === 'ceo' ? equityPercent.toString() : '0',
          equity_cfo: exec.role === 'cfo' ? equityPercent.toString() : '0',
          equity_cxo: exec.role === 'cxo' ? equityPercent.toString() : '0',
        };
      case 'stock_issuance':
        return {
          company_name: "Crave'n, Inc.",
          state_of_incorporation: "Ohio",
          company_address: "123 Main St, Cleveland, OH 44101",
          notice_contact_name: "Torrance Stroman",
          notice_contact_title: "CEO",
          notice_contact_email: "craven@usa.com",
          subscriber_name: exec.full_name,
          subscriber_address: "TBD",
          subscriber_email: exec.email,
          accredited_status: "an accredited investor",
          share_class: "Common Stock",
          series_label: "N/A",
          share_count: sharesIssued.toLocaleString(),
          price_per_share: strikePrice.toFixed(4),
          total_purchase_price: purchasePrice.toFixed(2),
          currency: "USD",
          vesting_terms: baseData.vesting_schedule,
          consideration_type: annualSalary > 0 ? "Services Rendered" : "Founder Contribution",
          consideration_valuation_basis: "Fair market value of services",
          certificate_form: "Book-entry (no physical certificate)",
          closing_date: baseData.effective_date,
          effective_date: baseData.effective_date,
          payment_method: annualSalary > 0 ? "Services / Sweat Equity" : "Founder Sweat Equity",
          securities_exemption: "Section 4(a)(2) private placement",
          related_agreement_name: "Founders' Agreement",
          governing_law_state: "Ohio",
          board_resolution_date: baseData.effective_date,
          signatory_name: "Torrance Stroman",
          signatory_title: "CEO",
          founder_1_name: "Torrance Stroman",
          founder_1_class: "Common Stock",
          founder_1_shares: "7,700,000",
          founder_1_percent: "77",
          founder_1_notes: "Founder shares, immediate vesting",
          founder_2_name: "Justin Sweet",
          founder_2_class: "Common Stock",
          founder_2_shares: "1,000,000",
          founder_2_percent: "10",
          founder_2_notes: "4 year vesting, 1 year cliff",
          subscriber_percent_post: equityPercent.toString(),
          option_pool_shares: "0",
          option_pool_percent: "0",
          option_pool_notes: "To be established",
          total_fd_shares: "10,000,000",
          bank_name: "Chase Bank",
          routing_number: "021000021",
          account_number: "1234567890",
          account_name: "Crave'n, Inc.",
          swift_bic: "CHASUS33",
          payment_reference: `Stock Purchase - ${exec.full_name}`,
          notes: exec.notes || '',
        };
      case 'founders_agreement':
        return {
          ...baseData,
          founders_table_html: `<table><tr><td>${exec.full_name}</td><td>${equityPercent}%</td><td>${sharesIssued.toLocaleString()} shares</td></tr></table>`,
          vesting_years: '4',
          cliff_months: '12',
          founder_1_name: exec.full_name,
          founder_1_role: baseData.role,
          founder_1_percent: equityPercent.toString(),
          founder_1_shares: sharesIssued.toLocaleString(),
          founder_1_vesting: baseData.vesting_schedule,
        };
      case 'deferred_comp_addendum':
        return {
          ...baseData,
          deferred_salary: annualSalary.toLocaleString(),
          total_annual_comp: annualSalary.toLocaleString(),
          deferral_trigger: exec.funding_trigger ? `$${parseInt(exec.funding_trigger).toLocaleString()}` : "Series A funding",
          payment_terms: "Paid within 30 days of funding event",
        };
      case 'confidentiality_ip':
        return {
          ...baseData,
          employee_name: exec.full_name,
          position: baseData.role,
        };
      case 'bylaws_officers_excerpt':
        return {
          ...baseData,
          officer_roles_html: `<ul><li>${baseData.role}: ${exec.full_name}</li></ul>`,
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

      for (const docType of CSUITE_DOC_TYPES) {
        try {
          // Validate required fields for this document type
          const issues = validateExecutive(exec, docType.id);
          if (issues.length > 0) {
            const msg = `${docType.title}: ${issues.join(', ')}`;
            console.warn(`Validation failed for ${exec.full_name}:`, msg);
            execResults.failed++;
            execResults.errors.push(msg);
            continue;
          }

          // Check if document already exists (from appointment flow)
          const statuses = statusMap[exec.id] || [];
          const existingDoc = statuses.find(s => s.type === docType.id && s.exists && s.documentId);
          
          if (existingDoc?.documentId) {
            // Use existing document from appointment flow
            console.log(`✓ Found existing ${docType.title} for ${exec.full_name} (doc ID: ${existingDoc.documentId})`);
            
            // Fetch document URL
            const { data: doc, error: docError } = await supabase
              .from('executive_documents')
              .select('file_url, executive_id, officer_name')
              .eq('id', existingDoc.documentId)
              .single();

            if (docError) {
              console.error(`✗ Error fetching existing document:`, docError);
              throw new Error(`Failed to fetch existing document: ${docError.message}`);
            }

            // CRITICAL: Verify document belongs to THIS executive only
            if (doc.executive_id && doc.executive_id !== exec.id) {
              console.error(`✗ SECURITY: Document ${existingDoc.documentId} belongs to executive_id ${doc.executive_id}, not ${exec.id} (${exec.full_name})`);
              throw new Error(`Document ownership mismatch: document belongs to different executive`);
            }
            
            if (doc.officer_name && doc.officer_name !== exec.full_name) {
              console.error(`✗ SECURITY: Document ${existingDoc.documentId} belongs to ${doc.officer_name}, not ${exec.full_name}`);
              throw new Error(`Document ownership mismatch: document belongs to different executive`);
            }

            console.log(`✓ Verified document ${existingDoc.documentId} belongs to ${exec.full_name}`);
            
            if (doc.file_url) {
              docsForEmail.push({ title: docType.title, url: doc.file_url });
              execResults.success++;
            } else {
              throw new Error('Existing document has no file URL');
            }
          } else {
            // Document doesn't exist, generate it using templates from database (or fallback to hardcoded)
            console.log(`Generating ${docType.title} for ${exec.full_name} using proper templates...`);
            const data = generateDocumentData(exec, docType.id);
            const html_content = await renderDocumentHtml(docType.id, data, docType.id);

            // Generate document via API
            const resp = await docsAPI.post('/documents/generate', {
              template_id: docType.id,
              officer_name: exec.full_name,
              role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
              equity: docType.id.includes('equity') ? parseFloat(data.equity_percentage) : undefined,
              data,
              html_content,
              executive_id: exec.id, // Link document to executive for signature portal
            });

            console.log(`Document generation response for ${exec.full_name} - ${docType.title}:`, resp);

            if (resp?.ok && resp?.document) {
              // Collect generated document URL for single combined email
              if (resp.document.file_url) {
                docsForEmail.push({ title: docType.title, url: resp.document.file_url });
              }
              execResults.success++;
            } else {
              throw new Error(`Document generation failed: ${resp?.error || 'Unknown error'}`);
            }
          }
        } catch (error: any) {
          console.error(`✗ Error processing ${docType.title} for ${exec.full_name}:`, error);
          execResults.failed++;
          execResults.errors.push(`${docType.title}: ${error.message || error}`);
        }

        completed++;
        if (!isPartOfBatch) {
          setProgress((completed / totalOperations) * 100);
        }
      }

      // After processing all docs, send ONE email with links + PDF attachments
      // ONLY for this specific executive
      if (exec.email && docsForEmail.length > 0) {
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
          } else {
            throw new Error(data?.error || 'Unknown error from email function');
          }
        } catch (emailErr: any) {
          console.error(`⚠ Email failed for ${exec.full_name}:`, emailErr);
          execResults.errors.push(`Email failed: ${emailErr.message || emailErr}`);
        }
      } else if (!exec.email) {
        console.warn(`⚠ No email address for ${exec.full_name}, skipping email send`);
      } else if (docsForEmail.length === 0) {
        console.warn(`⚠ No documents to send for ${exec.full_name}`);
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

      // Generate all documents fresh
      for (const docType of CSUITE_DOC_TYPES) {
        try {
          console.log(`Generating ${docType.title} for ${exec.full_name}...`);
          const data = generateDocumentData(exec, docType.id);
          const html_content = await renderDocumentHtml(docType.id, data, docType.id);

          // Generate document via API
          const resp = await docsAPI.post('/documents/generate', {
            template_id: docType.id,
            officer_name: exec.full_name,
            role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
            equity: docType.id.includes('equity') ? parseFloat(data.equity_percentage) : undefined,
            data,
            html_content,
            executive_id: exec.id, // Link document to executive for signature portal
          });

          console.log(`Document generation response for ${exec.full_name} - ${docType.title}:`, resp);

          if (resp?.ok && resp?.document) {
            execResults.success++;
          } else {
            throw new Error(`Document generation failed: ${resp?.error || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error(`✗ Error regenerating ${docType.title} for ${exec.full_name}:`, error);
          execResults.failed++;
          execResults.errors.push(`${docType.title}: ${error.message || error}`);
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
                        <Tag
                          key={status.type}
                          color={status.exists ? 'green' : 'orange'}
                          icon={status.exists ? <CheckCircleOutlined /> : <LoadingOutlined />}
                        >
                          {status.title}
                        </Tag>
                      ))}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}

