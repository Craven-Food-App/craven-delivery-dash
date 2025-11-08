// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  message,
  Space,
  Typography,
  List,
  Tag,
  Progress,
  Modal,
  Alert,
} from 'antd';
import {
  SendOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ReloadOutlined,
  EyeOutlined,
  LockOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { docsAPI } from '../hr/api';
import { renderDocumentHtml } from '@/utils/templateUtils';
import { getExecutiveData, formatExecutiveForDocuments } from '@/utils/getExecutiveData';
import { FlowExecutive } from '@/types/executiveDocuments';
import {
  DocumentFlowNode,
  PACKET_LABELS,
  getExpectedNodesForExecutive,
  stageComparator,
} from '@/utils/executiveDocumentFlow';
import { buildFoundersTableHtml } from '@/utils/foundersTable';

const { Title, Text } = Typography;

interface Executive extends FlowExecutive {
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
  incorporation_status?: 'pre_incorporation' | 'incorporated';
  defer_salary?: boolean;
  share_count?: string;
}

interface DocumentStatus {
  node: DocumentFlowNode;
  exists: boolean;
  documentId?: string;
  signatureStatus?: string | null;
  status?: string | null;
  fileUrl?: string | null;
}

type DocumentStatusMap = Record<string, DocumentStatus[]>;

const SIGNATURE_REQUIRED_TYPES = new Set([
  'employment_agreement',
  'offer_letter',
  'stock_issuance',
  'founders_agreement',
  'confidentiality_ip',
  'deferred_comp_addendum',
]);

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const toCurrency = (value?: number | string | null) => {
  const num = Number(value);
  if (!num || Number.isNaN(num)) return '$0.00';
  return currencyFormatter.format(num);
};

const parseNumeric = (value?: string | number | null) => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
};

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
  if (docType === 'pre_incorporation_consent' && exec.role !== 'ceo') {
    issues.push('Only the CEO is designated as incorporator');
  }
  return issues;
};

const buildPreIncorporationConsentData = async (
  baseData: Record<string, any>,
  appointmentDate: string,
  registeredOffice: string,
  incorporatorName: string,
  incorporatorAddress: string,
  incorporatorEmail: string
) => {
  const executives = await getExecutiveData();

  const find = (role: string) => executives.find((exec) => exec.role === role);
  const ceo = find('ceo');
  const cfo = find('cfo');
  const cxo = find('cxo');
  const secretary = find('secretary') ?? find('ceo');

  const directors = executives.slice(0, 2);

  const consentDate = appointmentDate;
  const notaryDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return {
    ...baseData,
    director_1_name: directors[0]?.full_name || incorporatorName,
    director_1_address: directors[0] ? registeredOffice : incorporatorAddress,
    director_1_email: directors[0]?.email || incorporatorEmail,
    director_2_name: directors[1]?.full_name || 'Board Member 2',
    director_2_address: registeredOffice,
    director_2_email: directors[1]?.email || 'board@cravenusa.com',
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
    consent_date: consentDate,
    notary_date: notaryDate,
    counterparty_1: '',
    agreement_1_name: '',
    agreement_1_date: '',
    agreement_1_notes: '',
  };
};

const buildStockIssuanceData = (
  baseData: Record<string, any>,
  equityGrant: any,
  annualSalary: number
) => {
  const considerationValue =
    equityGrant?.consideration_value != null
      ? Number(equityGrant.consideration_value)
      : Number(baseData.total_purchase_price || 0);

  return {
    ...baseData,
    subscriber_address: 'TBD',
    accredited_status: 'an accredited investor',
    series_label: 'N/A',
    consideration_type:
      equityGrant?.consideration_type ||
      (annualSalary > 0 ? 'Services Rendered' : 'Founder Contribution'),
    consideration_value: considerationValue,
    consideration_valuation_basis: 'Fair market value of services',
    certificate_form: 'Book-entry (no physical certificate)',
    payment_method: annualSalary > 0 ? 'Services / Sweat Equity' : 'Founder Sweat Equity',
    securities_exemption: 'Section 4(a)(2) private placement',
    related_agreement_name: "Founders' Agreement",
    notice_contact_name: 'Torrance Stroman',
    notice_contact_title: 'CEO',
    notice_contact_email: 'craven@usa.com',
  };
};

const generateDocumentData = async (exec: Executive, docType: string) => {
  const companyName = await getCompanySetting('company_name', "Crave'n, Inc.");
  const stateOfIncorporation = await getCompanySetting('state_of_incorporation', 'Ohio');
  const registeredOffice = await getCompanySetting(
    'registered_office',
    '123 Main St, Cleveland, OH 44101'
  );
  const stateFilingOffice = await getCompanySetting('state_filing_office', 'Ohio Secretary of State');
  const registeredAgentName = await getCompanySetting('registered_agent_name', 'TBD');
  const registeredAgentAddress = await getCompanySetting('registered_agent_address', 'TBD');
  const fiscalYearEnd = await getCompanySetting('fiscal_year_end', 'December 31');
  const incorporatorName = await getCompanySetting('incorporator_name', 'Torrance Stroman');
  const incorporatorAddress = await getCompanySetting(
    'incorporator_address',
    '123 Main St, Cleveland, OH 44101'
  );
  const incorporatorEmail = await getCompanySetting('incorporator_email', 'craven@usa.com');
  const county = await getCompanySetting('county', 'Cuyahoga');

  const { data: equityGrant } = await supabase
    .from('equity_grants')
    .select(
      'shares_total, shares_percentage, strike_price, vesting_schedule, grant_date, share_class, consideration_type, consideration_value'
    )
    .eq('executive_id', exec.id)
    .order('grant_date', { ascending: false })
    .limit(1)
    .single();

  let annualSalary = 0;
  let fundingTrigger: string | undefined = exec.funding_trigger;

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
    if (resolution.notes) {
      try {
        const notesData = JSON.parse(resolution.notes);
        if (notesData.annual_salary) {
          annualSalary =
            typeof notesData.annual_salary === 'number'
              ? notesData.annual_salary
              : parseFloat(notesData.annual_salary.toString());
        }
        if (notesData.funding_trigger) {
          fundingTrigger = notesData.funding_trigger.toString();
        }
      } catch {
        const salaryMatch = resolution.resolution_text?.match(
          /\$(\d{1,3}(?:,\d{3})*)\s*(?:annual|per\s*year|salary)/i
        );
        if (salaryMatch) {
          annualSalary = parseFloat(salaryMatch[1].replace(/,/g, ''));
        }
      }
    }
  }

  const sharesIssued = equityGrant?.shares_total || parseNumeric(exec.shares_issued);
  const strikePrice = equityGrant?.strike_price || parseFloat(exec.strike_price || '0.0001');
  const equityPercent = equityGrant?.shares_percentage || parseFloat(exec.equity_percent || '0');
  const totalPurchasePrice = strikePrice * sharesIssued;

  const vestingSchedule =
    equityGrant?.vesting_schedule && typeof equityGrant.vesting_schedule === 'string'
      ? equityGrant.vesting_schedule
      : exec.vesting_schedule || '4 years with 1 year cliff';

  let appointmentDateStr = '';
  if (equityGrant?.grant_date) {
    appointmentDateStr = new Date(equityGrant.grant_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } else {
    const { data: resolutionDate } = await supabase
      .from('board_resolutions')
      .select('effective_date')
      .eq('subject_person_name', exec.full_name)
      .or(`subject_position.eq.${exec.role},subject_position.eq.${exec.title}`)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (resolutionDate?.effective_date) {
      appointmentDateStr = new Date(resolutionDate.effective_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      appointmentDateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  }

  const appointmentDate = appointmentDateStr;
  const grantDate = equityGrant?.grant_date
    ? new Date(equityGrant.grant_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : appointmentDate;

  const formattedFundingTrigger = fundingTrigger
    ? fundingTrigger.includes('$')
      ? fundingTrigger
      : `$${fundingTrigger.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
    : 'Upon Series A funding or significant investment event';

  const baseData: Record<string, any> = {
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
    county,
    full_name: exec.full_name,
    executive_name: exec.full_name,
    name: exec.full_name,
    officer_name: exec.full_name,
    employee_name: exec.full_name,
    recipient_name: exec.full_name,
    subscriber_name: exec.full_name,
    counterparty_name: exec.full_name,
    role:
      exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
    position:
      exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
    title: exec.title || exec.role.toUpperCase(),
    position_title:
      exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
    executive_title: exec.title || exec.role.toUpperCase(),
    officer_title:
      exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
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
    equity_percentage: equityPercent.toFixed(2),
    equity_percent: equityPercent.toFixed(2),
    ownership_percent: equityPercent.toFixed(2),
    equity: equityPercent.toFixed(2),
    share_count: sharesIssued.toLocaleString(),
    shares_issued: sharesIssued.toLocaleString(),
    shares_total: sharesIssued.toLocaleString(),
    shares: sharesIssued.toLocaleString(),
    strike_price: strikePrice.toFixed(4),
    price_per_share: strikePrice.toFixed(4),
    share_price: strikePrice.toFixed(4),
    total_purchase_price: totalPurchasePrice.toFixed(2),
    vesting_schedule: vestingSchedule,
    vesting_terms: vestingSchedule,
    vesting: vestingSchedule,
    annual_salary: toCurrency(annualSalary),
    annual_base_salary: toCurrency(annualSalary),
    base_salary: toCurrency(annualSalary),
    salary: toCurrency(annualSalary),
    funding_trigger: formattedFundingTrigger,
    funding_trigger_amount: fundingTrigger ? fundingTrigger.replace(/\D/g, '') : '0',
    deferral_trigger: formattedFundingTrigger,
    governing_law: 'State of Ohio',
    governing_law_state: 'Ohio',
    salary_status: exec.salary_status || 'deferred',
    currency: 'USD',
    share_class: equityGrant?.share_class || 'Common Stock',
  };

  if (exec.email) {
    baseData.executive_email = exec.email;
    baseData.subscriber_email = exec.email;
    baseData.email = exec.email;
  }

  switch (docType) {
    case 'employment_agreement':
      return baseData;
    case 'offer_letter': {
      const firstName = exec.full_name?.split(' ')[0] || '';
      const sched = vestingSchedule || '';
      const yearsMatch = sched.match(/(\d+)\s*year/);
      const cliffMatch = sched.match(/(\d+)\s*(month|year)s?\s*cliff/i);
      const vesting_period = yearsMatch ? yearsMatch[1] : '4';
      const vesting_cliff = cliffMatch
        ? `${cliffMatch[1]} ${cliffMatch[2]}${cliffMatch[1] === '1' ? '' : 's'}`
        : '1 year';
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
        company_mission_statement: 'Deliver delightful food experiences to every neighborhood.',
      };
    }
    case 'board_resolution':
      return {
        ...baseData,
        directors: 'Board of Directors',
        ceo_name: exec.role === 'ceo' ? exec.full_name : '',
        cfo_name: exec.role === 'cfo' ? exec.full_name : '',
        cxo_name: exec.role === 'cxo' ? exec.full_name : '',
        coo_name: exec.role === 'coo' ? exec.full_name : '',
        cto_name: exec.role === 'cto' ? exec.full_name : '',
        officer_titles:
          exec.role === 'cxo'
            ? 'Chief Experience Officer'
            : exec.role === 'cfo'
            ? 'Chief Financial Officer'
            : exec.role === 'coo'
            ? 'Chief Operating Officer'
            : exec.role === 'cto'
            ? 'Chief Technology Officer'
            : 'Chief Executive Officer',
      };
    case 'pre_incorporation_consent':
      return await buildPreIncorporationConsentData(
        baseData,
        appointmentDate,
        registeredOffice,
        incorporatorName,
        incorporatorAddress,
        incorporatorEmail
      );
    case 'founders_agreement': {
      const foundersTable = await buildFoundersTableHtml({
        role: exec.role,
        name: exec.full_name,
        title: exec.title || exec.role.toUpperCase(),
        equityPercent: baseData.equity_percentage,
        shares: baseData.share_count,
        vesting: baseData.vesting_schedule,
      });
      return {
        ...baseData,
        founders_table_html: foundersTable.tableHtml,
        founders_signature_html: foundersTable.signatureHtml,
        founders_addressed_name: foundersTable.addressedName,
        founders_addressed_role: foundersTable.addressedRole,
        founders_ceo_name: foundersTable.ceoName,
        founders_cfo_name: foundersTable.cfoName,
        founders_cxo_name: foundersTable.cxoName,
        vesting_years: '4',
        cliff_months: '12',
      };
    }
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
    case 'stock_issuance':
      return buildStockIssuanceData(baseData, equityGrant, annualSalary);
    default:
      return baseData;
  }
};

export default function GenerateOfficerDocuments() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [documentStatusMap, setDocumentStatusMap] = useState<DocumentStatusMap>({});
  const [showPreview, setShowPreview] = useState(false);
  const [previewDocumentUrl, setPreviewDocumentUrl] = useState<string>('');
  const [previewDocumentTitle, setPreviewDocumentTitle] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [incorporationStatus, setIncorporationStatus] = useState<'pre_incorporation' | 'incorporated'>('pre_incorporation');

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      setLoading(true);
      const status = (await getCompanySetting('incorporation_status', 'pre_incorporation')) as
        | 'pre_incorporation'
        | 'incorporated';
      setIncorporationStatus(status);

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
          incorporation_status: status,
          defer_salary: formattedExec.defer_salary,
          share_count: formattedExec.share_count,
        } as Executive;
      });
      setExecutives(formatted);
      await checkExistingDocuments(formatted);
    } catch (error: any) {
      console.error('Error fetching executives:', error);
      message.error(`Failed to load executives: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDocuments = async (execList: Executive[]) => {
    const statusMap: DocumentStatusMap = {};

    for (const exec of execList) {
      const expectedNodes = getExpectedNodesForExecutive(exec);
      if (expectedNodes.length === 0) {
        statusMap[exec.id] = [];
        continue;
      }

      const { data: existingDocs, error: docsError } = await supabase
        .from('executive_documents')
        .select(
          'id, template_key, type, packet_id, signing_stage, signing_order, signature_status, status, file_url'
        )
        .eq('executive_id', exec.id);

      if (docsError) {
        console.error(`Error checking documents for ${exec.full_name}:`, docsError);
      }

      const docs = existingDocs || [];

      const statuses: DocumentStatus[] = expectedNodes.map((node) => {
        const match = docs.find((doc: any) => {
          const docType = doc.template_key || doc.type;
          const sameType = docType === node.type;
          if (!sameType) return false;
          if (doc.signing_stage && doc.signing_stage !== node.signingStage) return false;
          if (doc.signing_order && doc.signing_order !== node.signingOrder) return false;
          if (doc.packet_id && doc.packet_id !== node.packetId) return false;
          return true;
        });

        return {
          node,
          exists: !!match,
          documentId: match?.id,
          signatureStatus: match?.signature_status ?? null,
          status: match?.status ?? null,
          fileUrl: match?.file_url ?? null,
        };
      });

      statusMap[exec.id] = statuses;
    }

    setDocumentStatusMap(statusMap);
  };

  const sendDocumentsToExecutive = async (
    exec: Executive,
    isPartOfBatch = false,
    options?: { forceRegenerate?: boolean }
  ) => {
    if (!exec) {
      message.warning('No executive selected');
      return;
    }

    if (sending && !isPartOfBatch) {
      message.warning('Please wait for the current send operation to complete');
      return;
    }

    if (!isPartOfBatch) {
      setSending(true);
      setProgress(0);
    }

    try {
      const expectedNodes = getExpectedNodesForExecutive(exec);
      if (expectedNodes.length === 0) {
        message.info(`${exec.full_name} has no documents in the flow.`);
        return;
      }

      const existingStatuses = documentStatusMap[exec.id] || [];
      const docIdMap = new Map<string, string>();
      existingStatuses.forEach((status) => {
        if (status.exists && status.documentId) {
          docIdMap.set(status.node.type, status.documentId);
        }
      });

      if (options?.forceRegenerate) {
        await supabase.from('executive_documents').delete().eq('executive_id', exec.id);
        docIdMap.clear();
      }

      const docsForEmail: Array<{ title: string; url: string }> = [];
      const execResults = { success: 0, failed: 0, errors: [] as string[] };
      let processed = 0;

      for (const node of expectedNodes) {
        processed += 1;
        if (!isPartOfBatch) {
          setProgress(Math.round((processed / expectedNodes.length) * 100));
        }

        const existingStatus = existingStatuses.find((status) => status.node.type === node.type);
        if (existingStatus?.exists && existingStatus.fileUrl && !options?.forceRegenerate) {
          docsForEmail.push({ title: node.title, url: existingStatus.fileUrl });
          continue;
        }

        const validationIssues = validateExecutive(exec, node.type);
        if (validationIssues.length > 0) {
          const issueMessage = `${node.title}: ${validationIssues.join(', ')}`;
          console.warn(`Validation failed for ${exec.full_name}:`, issueMessage);
          execResults.failed += 1;
          execResults.errors.push(issueMessage);
          continue;
        }

        const dependsOnId = node.dependsOn ? docIdMap.get(node.dependsOn) || null : null;

        try {
          const data = await generateDocumentData(exec, node.type);
          const html_content = await renderDocumentHtml(node.type, data, node.type);

          const response = await docsAPI.post('/documents/generate', {
            template_id: node.type,
            officer_name: exec.full_name,
            role:
              exec.role === 'cxo'
                ? 'Chief Experience Officer'
                : exec.title || exec.role.toUpperCase(),
            equity: node.type.includes('equity') ? parseFloat(data.equity_percentage) : undefined,
            data,
            html_content,
            executive_id: exec.id,
            packet_id: node.packetId,
            signing_stage: node.signingStage,
            signing_order: node.signingOrder,
            depends_on_document_id: dependsOnId,
            required_signers: node.requiredSigners,
            template_key: node.type,
            document_title: node.title,
          });

          if (response?.ok && response?.document) {
            const fileUrl = response.file_url;
            if (fileUrl) {
              docsForEmail.push({ title: node.title, url: fileUrl });
            }
            docIdMap.set(node.type, response.document.id);
            execResults.success += 1;
          } else {
            throw new Error(response?.error || 'Unknown error');
          }
        } catch (error: any) {
          console.error(`Error generating ${node.title} for ${exec.full_name}:`, error);
          execResults.failed += 1;
          execResults.errors.push(`${node.title}: ${error.message || error}`);
        }
      }

      if (exec.email) {
        if (docsForEmail.length > 0) {
          const uniqueDocs = Array.from(
            new Map(docsForEmail.map((doc) => [doc.title, doc])).values()
          );
          try {
            const { data, error } = await supabase.functions.invoke(
              'send-executive-document-email',
              {
                body: {
                  to: exec.email,
                  executiveName: exec.full_name,
                  documentTitle: 'Executive Onboarding Packet',
                  documents: uniqueDocs,
                },
              }
            );
            if (error) throw error;
            if (data?.success) {
              execResults.success += 1;
            } else {
              throw new Error(data?.error || 'Unknown error sending email');
            }
          } catch (emailErr: any) {
            console.error(`Email failed for ${exec.full_name}:`, emailErr);
            execResults.failed += 1;
            execResults.errors.push(`Email failed: ${emailErr.message || emailErr}`);
          }
        } else if (execResults.failed > 0) {
          console.warn(`No documents generated for ${exec.full_name}; skipping email send.`);
        }
      } else {
        console.warn(`No email address for ${exec.full_name}; skipping email send.`);
      }

      if (execResults.failed > 0) {
        message.warning(
          `${exec.full_name}: ${execResults.success} successful, ${execResults.failed} failed.`,
          5
        );
      } else {
        message.success(`Sent executive packet to ${exec.full_name}`);
      }

      await checkExistingDocuments(executives);
    } catch (error: any) {
      console.error('Error sending documents:', error);
      message.error(`Failed to send documents: ${error.message}`);
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

    const execsWithEmail = executives.filter((e) => !!e.email);
    if (execsWithEmail.length === 0) {
      message.error('No executives have email addresses');
      return;
    }

    setSending(true);
    setProgress(0);

    try {
      let completed = 0;
      for (const exec of execsWithEmail) {
        await sendDocumentsToExecutive(exec, true);
        completed += 1;
        setProgress(Math.round((completed / execsWithEmail.length) * 100));
      }
      message.success(`Sent documents to ${execsWithEmail.length} executives`);
    } catch (error: any) {
      console.error('Error in batch send:', error);
      message.error(`Batch send failed: ${error.message}`);
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  const regenerateDocuments = async (exec: Executive) => {
    setRegenerating(true);
    setProgress(0);
    try {
      await supabase.from('executive_documents').delete().eq('executive_id', exec.id);
      await sendDocumentsToExecutive(exec, true, { forceRegenerate: true });
      await checkExistingDocuments(executives);
      message.success(`Regenerated documents for ${exec.full_name}`);
    } catch (error: any) {
      console.error('Error regenerating documents:', error);
      message.error(`Failed to regenerate documents: ${error.message}`);
    } finally {
      setRegenerating(false);
      setProgress(0);
    }
  };

  const handlePreviewDocument = async (documentId: string, documentTitle: string) => {
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase
        .from('executive_documents')
        .select('file_url')
        .eq('id', documentId)
        .single();

      if (error || !data?.file_url) {
        throw error || new Error('Document not found');
      }

      setPreviewDocumentUrl(data.file_url);
      setPreviewDocumentTitle(documentTitle);
      setShowPreview(true);
    } catch (error: any) {
      console.error('Error loading document preview:', error);
      message.error('Failed to load document preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const statusByStage = useMemo(() => {
    const result: Record<string, Record<number, DocumentStatus[]>> = {};
    Object.entries(documentStatusMap).forEach(([execId, statuses]) => {
      result[execId] = statuses.reduce<Record<number, DocumentStatus[]>>((acc, status) => {
        const stage = status.node.signingStage;
        if (!acc[stage]) acc[stage] = [];
        acc[stage].push(status);
        return acc;
      }, {});
      Object.values(result[execId]).forEach((stageStatuses) =>
        stageStatuses.sort((a, b) => stageComparator(a.node, b.node))
      );
    });
    return result;
  }, [documentStatusMap]);

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: '#ff7a45' }} />
          <Title level={4} style={{ margin: 0 }}>
            Executive Appointment Document Flow
          </Title>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendDocumentsToAll}
          loading={sending}
          disabled={executives.filter((e) => e.email).length === 0 || regenerating}
          style={{ background: 'linear-gradient(135deg, #ff7a45 0%, #ff8c00 100%)', border: 'none' }}
        >
          Send to All ({executives.filter((e) => e.email).length})
        </Button>
      }
    >
      <Alert
        message="Appointment Signing Flow"
        description="Documents are generated and sent in the required order. Each stage unlocks the next, and executives receive a single email containing every document assigned to them."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {(sending || regenerating) && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={progress} status="active" />
          <Text type="secondary">{sending ? 'Distributing documents...' : 'Regenerating documents...'}</Text>
        </div>
      )}

      <List
        loading={loading}
        dataSource={executives}
        renderItem={(exec) => {
          const statuses = documentStatusMap[exec.id] || [];
          const totalCount = statuses.length;
          const completedCount = statuses.filter((status) => status.exists).length;
          const groupedByStage = statusByStage[exec.id] || {};

          return (
            <List.Item
              actions={[
                <Button
                  key="send"
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
                  key="regenerate"
                  icon={<ReloadOutlined />}
                  onClick={() => regenerateDocuments(exec)}
                  loading={regenerating}
                  disabled={sending}
                  size="small"
                >
                  Regenerate
                </Button>,
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
                      Documents: {completedCount} of {totalCount} generated
                    </Text>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(groupedByStage)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([stage, stageStatuses]) => (
                          <Card
                            key={stage}
                            size="small"
                            title={PACKET_LABELS[stageStatuses[0].node.packetId] || `Stage ${stage}`}
                          >
                            <Space wrap size={6}>
                              {stageStatuses.map((status) => {
                                const isPending = !status.exists;
                                const isSigned = status.signatureStatus === 'signed';
                                const isAwaitingSignature = status.signatureStatus === 'pending';

                                const color = isSigned
                                  ? 'green'
                                  : isPending
                                  ? 'orange'
                                  : isAwaitingSignature
                                  ? 'cyan'
                                  : 'blue';

                                return (
                                  <Tag
                                    key={status.node.type}
                                    color={color}
                                    icon={
                                      isSigned ? (
                                        <CheckCircleOutlined />
                                      ) : isPending ? (
                                        <LockOutlined />
                                      ) : isAwaitingSignature ? (
                                        <ClockCircleOutlined />
                                      ) : undefined
                                    }
                                  >
                                    {status.node.title}
                                  </Tag>
                                );
                              })}
                            </Space>
                          </Card>
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {statuses
                        .filter((status) => status.exists && status.documentId)
                        .map((status) => (
                          <Button
                            key={status.documentId}
                            type="link"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() =>
                              handlePreviewDocument(status.documentId!, status.node.title)
                            }
                          >
                            {status.node.title}
                          </Button>
                        ))}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />

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
          <Button
            key="close"
            onClick={() => {
              setShowPreview(false);
              setPreviewDocumentUrl('');
              setPreviewDocumentTitle('');
            }}
          >
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
          <div style={{ textAlign: 'center', padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32 }} />
            <div style={{ marginTop: 16 }}>
              <Text>Loading document...</Text>
            </div>
          </div>
        ) : previewDocumentUrl ? (
          <div style={{ width: '100%', height: '70vh', border: '1px solid #d9d9d9', borderRadius: 4 }}>
            <iframe
              src={previewDocumentUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={previewDocumentTitle}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">No document URL available</Text>
          </div>
        )}
      </Modal>
    </Card>
  );
}

