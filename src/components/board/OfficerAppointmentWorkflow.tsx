import React, { useState, useEffect } from 'react';
import { Card, Steps, Form, Input, Select, DatePicker, InputNumber, Button, message, Upload, Row, Col, Typography, Divider } from 'antd';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';
import { UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { renderHtml } from '@/lib/templates';
import { renderDocumentHtml } from '@/utils/templateUtils';
import { docsAPI } from '../hr/api';
import { getExecutiveData, formatExecutiveForDocuments } from '@/utils/getExecutiveData';

const { Step } = Steps;
const { TextArea } = Input;
const { Text } = Typography;

interface OfficerFormData {
  full_name: string;
  email: string;
  position_title: 'CEO' | 'CFO' | 'COO' | 'CTO' | 'CXO';
  appointment_date: string;
  equity_percent: number;
  share_count: number;
  vesting_schedule: string;
  strike_price?: number;
  annual_salary?: number;
  defer_salary: boolean;
  funding_trigger?: string;
  // SSN fields
  date_of_birth?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  ssn1?: string;
  ssn2?: string;
  ssn3?: string;
}

export const OfficerAppointmentWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<UploadFile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [incorporationStatus, setIncorporationStatus] = useState<'pre_incorporation' | 'incorporated'>('pre_incorporation');

  // Fetch incorporation status on mount
  useEffect(() => {
    getIncorporationStatus().then(setIncorporationStatus);
  }, []);

  const steps = [
    { title: 'Officer Details', description: 'Name, title, email' },
    { title: 'Equity Allocation', description: 'Shares and vesting' },
    { title: 'Compensation', description: 'Salary structure' },
    { title: 'Identity Verification', description: 'SSN and address' },
    { title: 'Review & Appoint', description: 'Generate documents' },
  ];

  // Document types to generate during appointment
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

  const generateDocumentsForOfficer = async (
    formValues: OfficerFormData,
    executiveId: string,
    equityGrantId?: string
  ) => {
    try {
      const appointmentDate = formValues.appointment_date 
        ? (dayjs.isDayjs(formValues.appointment_date) 
            ? formValues.appointment_date.format('MMMM D, YYYY')
            : typeof formValues.appointment_date === 'string'
            ? dayjs(formValues.appointment_date).format('MMMM D, YYYY')
            : String(formValues.appointment_date))
        : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

      const strikePrice = formValues.strike_price || 0.0001;
      const sharesIssued = formValues.share_count || 0;
      const totalPurchasePrice = strikePrice * sharesIssued;
      const equityPercent = formValues.equity_percent || 0;
      const annualSalary = formValues.annual_salary || 0;

      // Check incorporation status to determine which document to use
      const incorporationStatus = await getIncorporationStatus();

      // Generate each document
      for (const docType of CSUITE_DOC_TYPES) {
        try {
          // Skip deferred_comp_addendum if salary is not deferred
          if (docType.id === 'deferred_comp_addendum' && !formValues.defer_salary) {
            console.log(`Skipping ${docType.title} - salary is not deferred`);
            continue;
          }

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

          // Prepare document data based on template type
          const docData = await prepareDocumentData(
            formValues,
            actualDocType,
            appointmentDate,
            strikePrice,
            sharesIssued,
            totalPurchasePrice,
            equityPercent,
            annualSalary
          );

          // Generate HTML using template from database (or fallback to hardcoded)
          const html_content = await renderDocumentHtml(actualDocType, docData, actualDocType);

          // Call document-generate edge function
          const resp = await docsAPI.post('/documents/generate', {
            template_id: actualDocType,
            officer_name: formValues.full_name,
            role: formValues.position_title === 'CXO' ? 'Chief Experience Officer' : formValues.position_title,
            equity: actualDocType.includes('equity') || actualDocType === 'stock_issuance' ? equityPercent : undefined,
            data: docData,
            html_content,
            executive_id: executiveId, // Link document to executive for signature portal
          });

          if (!resp?.ok || !resp?.document) {
            console.warn(`Failed to generate ${actualDocTitle}:`, resp?.error);
          } else {
            console.log(`✓ Generated ${actualDocTitle}`);
          }
        } catch (error: any) {
          console.error(`Error generating ${docType.title}:`, error);
          // Continue with other documents even if one fails
        }
      }
    } catch (error: any) {
      console.error('Error generating documents:', error);
      message.warning('Officer appointed but some documents may not have been generated. You can regenerate them from the document dashboard.');
    }
  };

  const prepareDocumentData = async (
    formValues: OfficerFormData,
    docType: string,
    appointmentDate: string,
    strikePrice: number,
    sharesIssued: number,
    totalPurchasePrice: number,
    equityPercent: number,
    annualSalary: number
  ) => {
    // Fetch company settings
    const companyName = await getCompanySetting('company_name', "Crave'n, Inc.");
    const stateOfIncorporation = await getCompanySetting('state_of_incorporation', 'Ohio');
    const registeredOffice = await getCompanySetting('registered_office', '123 Main St, Cleveland, OH 44101');
    const stateFilingOffice = await getCompanySetting('state_filing_office', 'Ohio Secretary of State');
    const registeredAgentName = await getCompanySetting('registered_agent_name', 'Torrance Stroman');
    const registeredAgentAddress = await getCompanySetting('registered_agent_address', '123 Main St, Cleveland, OH 44101');
    const fiscalYearEnd = await getCompanySetting('fiscal_year_end', 'December 31');
    const incorporatorName = await getCompanySetting('incorporator_name', 'Torrance Stroman');
    const incorporatorAddress = await getCompanySetting('incorporator_address', '123 Main St, Cleveland, OH 44101');
    const incorporatorEmail = await getCompanySetting('incorporator_email', 'craven@usa.com');
    const county = await getCompanySetting('county', 'Cuyahoga');

    const baseData: Record<string, any> = {
      company_name: companyName,
      state_of_incorporation: stateOfIncorporation,
      state: stateOfIncorporation,
      registered_office: registeredOffice,
      state_filing_office: stateFilingOffice,
      registered_agent_name: registeredAgentName,
      registered_agent_address: registeredAgentAddress,
      fiscal_year_end: fiscalYearEnd,
      incorporator_name: incorporatorName,
      incorporator_address: incorporatorAddress,
      incorporator_email: incorporatorEmail,
      county: county,
      full_name: formValues.full_name,
      role: formValues.position_title === 'CXO' ? 'Chief Experience Officer' : formValues.position_title,
      effective_date: appointmentDate,
      date: appointmentDate,
      adoption_date: appointmentDate,
      funding_trigger: formValues.funding_trigger || "Upon Series A funding or significant investment event",
      governing_law: `State of ${stateOfIncorporation}`,
      governing_law_state: stateOfIncorporation,
      equity_percentage: equityPercent.toString(),
      annual_salary: annualSalary.toLocaleString(),
      vesting_schedule: formValues.vesting_schedule || '4 years with 1 year cliff',
      strike_price: strikePrice.toFixed(4),
      price_per_share: strikePrice.toFixed(4),
      share_count: sharesIssued.toLocaleString(),
      shares_issued: sharesIssued.toLocaleString(),
      total_purchase_price: totalPurchasePrice.toFixed(2),
      company_address: registeredOffice,
    };

    // Template-specific data
    switch (docType) {
      case 'pre_incorporation_consent': {
        // Fetch all executives to populate officers and directors
        const allExecutives = await getExecutiveData();
        const formattedExecs = allExecutives.map(e => formatExecutiveForDocuments(e));
        
        // Get CEO, CFO, CXO, and Secretary
        const ceo = formattedExecs.find(e => e.role === 'ceo');
        const cfo = formattedExecs.find(e => e.role === 'cfo');
        const cxo = formattedExecs.find(e => e.role === 'cxo');
        const secretary = formattedExecs.find(e => e.role === 'secretary') || formattedExecs.find(e => e.role === 'ceo');
        
        // Directors (typically CEO + 2 others, or first 2 executives)
        const directors = formattedExecs.slice(0, 2);
        
        const consentDate = appointmentDate;
        const notaryDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Determine officer positions based on current appointment
        const currentOfficer = {
          name: formValues.full_name,
          title: formValues.position_title === 'CEO' ? 'Chief Executive Officer (CEO)' :
                 formValues.position_title === 'CFO' ? 'Chief Financial Officer (CFO)' :
                 formValues.position_title === 'CXO' ? 'Chief Experience Officer (CXO)' :
                 formValues.position_title === 'COO' ? 'Chief Operating Officer (COO)' :
                 formValues.position_title === 'CTO' ? 'Chief Technology Officer (CTO)' :
                 formValues.position_title,
          email: formValues.email,
        };

        return {
          ...baseData,
          // Directors
          director_1_name: directors[0]?.full_name || incorporatorName,
          director_1_address: directors[0]?.full_name ? registeredOffice : incorporatorAddress,
          director_1_email: directors[0]?.email || incorporatorEmail,
          director_2_name: directors[1]?.full_name || 'Board Member 2',
          director_2_address: registeredOffice,
          director_2_email: directors[1]?.email || 'board@cravenusa.com',
          // Officers - use current appointment where applicable, otherwise existing executives
          officer_1_name: formValues.position_title === 'CEO' ? currentOfficer.name : (ceo?.full_name || incorporatorName),
          officer_1_title: formValues.position_title === 'CEO' ? currentOfficer.title : 'Chief Executive Officer (CEO)',
          officer_1_email: formValues.position_title === 'CEO' ? currentOfficer.email : (ceo?.email || incorporatorEmail),
          officer_2_name: formValues.position_title === 'CFO' ? currentOfficer.name : (cfo?.full_name || ''),
          officer_2_title: formValues.position_title === 'CFO' ? currentOfficer.title : 'Chief Financial Officer (CFO)',
          officer_2_email: formValues.position_title === 'CFO' ? currentOfficer.email : (cfo?.email || ''),
          officer_3_name: formValues.position_title === 'CXO' ? currentOfficer.name : (cxo?.full_name || ''),
          officer_3_title: formValues.position_title === 'CXO' ? currentOfficer.title : 'Chief Experience Officer (CXO)',
          officer_3_email: formValues.position_title === 'CXO' ? currentOfficer.email : (cxo?.email || ''),
          officer_4_name: secretary?.full_name || incorporatorName,
          officer_4_title: 'Corporate Secretary',
          officer_4_email: secretary?.email || incorporatorEmail,
          // Acceptance page appointees (same as officers)
          appointee_1_name: formValues.position_title === 'CEO' ? currentOfficer.name : (ceo?.full_name || incorporatorName),
          appointee_1_role: formValues.position_title === 'CEO' ? currentOfficer.title : 'Chief Executive Officer (CEO)',
          appointee_1_email: formValues.position_title === 'CEO' ? currentOfficer.email : (ceo?.email || incorporatorEmail),
          appointee_2_name: formValues.position_title === 'CFO' ? currentOfficer.name : (cfo?.full_name || ''),
          appointee_2_role: formValues.position_title === 'CFO' ? currentOfficer.title : 'Chief Financial Officer (CFO)',
          appointee_2_email: formValues.position_title === 'CFO' ? currentOfficer.email : (cfo?.email || ''),
          appointee_3_name: formValues.position_title === 'CXO' ? currentOfficer.name : (cxo?.full_name || ''),
          appointee_3_role: formValues.position_title === 'CXO' ? currentOfficer.title : 'Chief Experience Officer (CXO)',
          appointee_3_email: formValues.position_title === 'CXO' ? currentOfficer.email : (cxo?.email || ''),
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
      case 'board_resolution':
        return {
          ...baseData,
          directors: "Board of Directors",
          officer_name: formValues.full_name,
          officer_title: baseData.role,
          ceo_name: formValues.position_title === 'CEO' ? formValues.full_name : '',
          cfo_name: formValues.position_title === 'CFO' ? formValues.full_name : '',
          cxo_name: formValues.position_title === 'CXO' ? formValues.full_name : '',
          equity_ceo: formValues.position_title === 'CEO' ? equityPercent.toString() : '0',
          equity_cfo: formValues.position_title === 'CFO' ? equityPercent.toString() : '0',
          equity_cxo: formValues.position_title === 'CXO' ? equityPercent.toString() : '0',
        };
      case 'stock_issuance':
        return {
          ...baseData,
          subscriber_name: formValues.full_name,
          subscriber_address: "TBD",
          subscriber_email: formValues.email,
          share_class: 'Common Stock',
          consideration_type: 'Founder/Officer Appointment',
          currency: 'USD',
        };
      case 'offer_letter': {
        const firstName = formValues.full_name?.split(' ')[0] || '';
        const sched = baseData.vesting_schedule || '';
        const yearsMatch = sched.match(/(\d+)\s*year/);
        const cliffMatch = sched.match(/(\d+)\s*(month|year)s?\s*cliff/i);
        const vesting_period = yearsMatch ? yearsMatch[1] : '4';
        const vesting_cliff = cliffMatch ? `${cliffMatch[1]} ${cliffMatch[2]}${cliffMatch[1] === '1' ? '' : 's'}` : '1 year';
        return {
          ...baseData,
          offer_date: appointmentDate,
          executive_name: formValues.full_name,
          executive_first_name: firstName,
          executive_address: '',
          executive_email: formValues.email,
          position_title: baseData.role,
          reporting_to_title: 'Board of Directors',
          work_location: 'Cleveland, Ohio',
          start_date: appointmentDate,
          annual_base_salary: annualSalary.toLocaleString(),
          currency: 'USD',
          funding_trigger_amount: formValues.funding_trigger ? formValues.funding_trigger.replace(/\D/g, '') : '0',
          share_count: sharesIssued.toLocaleString(),
          share_class: 'Common Stock',
          ownership_percent: equityPercent.toString(),
          vesting_period,
          vesting_cliff,
          bonus_structure: 'Discretionary performance bonus as determined by the Board',
          employment_country: 'United States',
          signatory_name: 'Torrance Stroman',
          signatory_title: 'CEO',
          company_mission_statement: 'deliver delightful food experiences to every neighborhood',
        };
      }
      case 'founders_agreement':
        return {
          ...baseData,
          founders_table_html: `<tr><td>${formValues.full_name}</td><td>${baseData.role}</td><td>${equityPercent}%</td></tr>`,
          vesting_years: '4',
          cliff_months: '12',
        };
      case 'deferred_comp_addendum':
        return {
          ...baseData,
          defer_until: baseData.funding_trigger,
        };
      case 'bylaws_officers_excerpt':
        return {
          ...baseData,
          execution_date: appointmentDate,
          secretary_name: 'Torrance Stroman',
        };
      default:
        return baseData;
    }
  };

  const handleNext = async () => {
    try {
      // Validate only fields in the current step
      const fieldNames = 
        currentStep === 0 
          ? ['full_name', 'email', 'position_title', 'appointment_date']
          : currentStep === 1
          ? ['equity_percent', 'share_count', 'vesting_schedule', 'strike_price']
          : currentStep === 2
          ? ['defer_salary', 'annual_salary', ...(form.getFieldValue('defer_salary') ? ['funding_trigger'] : [])]
          : currentStep === 3
          ? ['date_of_birth', 'address_line1', 'city', 'state', 'postal_code', 'ssn1', 'ssn2', 'ssn3']
          : [];
      
      await form.validateFields(fieldNames);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
      // Show validation errors to user
      const errorInfo = error as any;
      if (errorInfo?.errorFields?.length > 0) {
        const firstError = errorInfo.errorFields[0];
        message.error(firstError.errors[0] || 'Please fill in all required fields');
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue() as OfficerFormData;

      // Upload photo if provided
      let uploadedPhotoUrl = photoUrl;
      if (photoFile && photoFile.originFileObj) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('executive-photos')
          .upload(filePath, photoFile.originFileObj);

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('executive-photos')
          .getPublicUrl(filePath);

        uploadedPhotoUrl = publicUrl;
      }

      // Format appointment_date for submission
      const appointmentDateStr = typeof values.appointment_date === 'string' 
        ? values.appointment_date 
        : (values.appointment_date as any).format('YYYY-MM-DD');

      // Call edge function to appoint officer
      console.log('Calling appoint-corporate-officer edge function with payload:', {
        executive_name: values.full_name,
        executive_email: values.email,
        executive_title: values.position_title,
        appointment_date: appointmentDateStr,
        equity_percent: values.equity_percent.toString(),
        shares_issued: values.share_count.toString(),
        vesting_schedule: values.vesting_schedule,
        strike_price: values.strike_price?.toString() || '0.0001',
        annual_salary: values.annual_salary?.toString(),
        defer_salary: values.defer_salary,
        funding_trigger: values.funding_trigger,
        photo_url: uploadedPhotoUrl,
      });

      const { data, error } = await supabase.functions.invoke('appoint-corporate-officer', {
        body: {
          executive_name: values.full_name,
          executive_email: values.email,
          executive_title: values.position_title,
          appointment_date: appointmentDateStr,
          equity_percent: values.equity_percent.toString(),
          shares_issued: values.share_count.toString(),
          vesting_schedule: values.vesting_schedule,
          strike_price: values.strike_price?.toString() || '0.0001',
          annual_salary: values.annual_salary?.toString(),
          defer_salary: values.defer_salary,
          funding_trigger: values.funding_trigger,
          photo_url: uploadedPhotoUrl,
        },
      });

      if (error) {
        console.error('Edge function error details:', {
          error,
          message: error.message,
          context: error.context,
          status: error.status,
        });
        throw error;
      }

      console.log('Edge function response:', data);
      
      // Save SSN securely via edge function (if provided)
      if (data.officer_id) {
        const ssnRaw = `${values.ssn1 || ''}${values.ssn2 || ''}${values.ssn3 || ''}`.replace(/\D/g, '');
        
        if (ssnRaw.length === 9) {
          try {
            const dob = values.date_of_birth 
              ? (dayjs.isDayjs(values.date_of_birth) 
                  ? values.date_of_birth.format('YYYY-MM-DD')
                  : typeof values.date_of_birth === 'string'
                  ? values.date_of_birth
                  : dayjs(values.date_of_birth).format('YYYY-MM-DD'))
              : undefined;

            if (dob) {
              await supabase.functions.invoke('save-executive-identity', {
                body: {
                  executiveId: data.officer_id,
                  fullName: values.full_name,
                  dateOfBirth: dob,
                  addressLine1: values.address_line1,
                  addressLine2: values.address_line2,
                  city: values.city,
                  state: values.state,
                  postalCode: values.postal_code,
                  country: 'US',
                  ssn: ssnRaw,
                },
              });
              console.log('✓ SSN saved securely');
            }
          } catch (ssnError: any) {
            console.error('Failed to save SSN (non-blocking):', ssnError);
            // Don't block appointment if SSN save fails - can be added later
            message.warning('Officer appointed, but SSN could not be saved. Please add it later via the identity portal.');
          }
        }
      }
      
      // Generate documents using templates from src/lib/templates.ts
      if (data.officer_id) {
        message.info('Generating documents...', 2);
        await generateDocumentsForOfficer(values, data.officer_id, data.equity_grant_id);
      }
      
      // Show success message with details
      message.success({
        content: `${values.full_name} has been successfully appointed as ${values.position_title}. Documents have been generated. Price per Share: $${data.price_per_share || '0.0000'}, Total Purchase Price: $${data.total_purchase_price || '0.00'}`,
        duration: 6,
      });
      
      // Reset form and return to first step instead of navigating away
      form.resetFields();
      setPhotoFile(null);
      setPhotoUrl('');
      setCurrentStep(0);
    } catch (error: any) {
      console.error('Error appointing officer:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to appoint officer';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.context?.message) {
        errorMessage = error.context.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for common edge function errors
      if (errorMessage.includes('Failed to send a request') || 
          errorMessage.includes('Edge Function') ||
          error?.status === 404) {
        errorMessage = 'Edge function not found or not deployed. Please deploy the appoint-corporate-officer function to Supabase.';
      } else if (error?.status === 500) {
        errorMessage = 'Server error in edge function. Check Supabase logs for details.';
      } else if (error?.status === 401 || error?.status === 403) {
        errorMessage = 'Authentication error. Please check your permissions.';
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    // Get current form values for review step
    const values = form.getFieldsValue() as OfficerFormData;
    
    return (
      <>
        {/* Step 0: Officer Details - Always rendered but hidden when not current step */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          <Form.Item
            name="full_name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter officer name' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' },
            ]}
          >
            <Input placeholder="john@company.com" />
          </Form.Item>
          <Form.Item
            name="position_title"
            label="Officer Title"
            rules={[{ required: true, message: 'Please select title' }]}
          >
            <Select placeholder="Select officer position">
              <Select.Option value="CEO">Chief Executive Officer (CEO)</Select.Option>
              <Select.Option value="CFO">Chief Financial Officer (CFO)</Select.Option>
              <Select.Option value="COO">Chief Operating Officer (COO)</Select.Option>
              <Select.Option value="CTO">Chief Technology Officer (CTO)</Select.Option>
              <Select.Option value="CXO">Chief Experience Officer (CXO)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="appointment_date"
            label="Appointment Date"
            rules={[{ required: true, message: 'Please select appointment date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="photo"
            label="Executive Photo (Optional)"
          >
            <Upload
              maxCount={1}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('You can only upload image files!');
                  return false;
                }
                const isLt5M = file.size / 1024 / 1024 < 5;
                if (!isLt5M) {
                  message.error('Image must be smaller than 5MB!');
                  return false;
                }
                setPhotoFile(file as any);
                
                // Create preview URL
                const reader = new FileReader();
                reader.onload = (e) => {
                  setPhotoUrl(e.target?.result as string);
                };
                reader.readAsDataURL(file);
                
                return false; // Prevent auto upload
              }}
              onRemove={() => {
                setPhotoFile(null);
                setPhotoUrl('');
              }}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Upload Photo</Button>
            </Upload>
          </Form.Item>
        </div>

        {/* Step 1: Equity Allocation - Always rendered but hidden when not current step */}
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          <Form.Item
            name="equity_percent"
            label="Equity Percentage"
            rules={[{ required: true, message: 'Please enter equity percentage' }]}
          >
            <InputNumber
              min={0}
              max={100}
              precision={2}
              style={{ width: '100%' }}
              placeholder="10.00"
              addonAfter="%"
            />
          </Form.Item>
          <Form.Item
            name="share_count"
            label="Number of Shares"
            rules={[{ required: true, message: 'Please enter share count' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="1000000"
            />
          </Form.Item>
          <Form.Item
            name="vesting_schedule"
            label="Vesting Schedule"
            rules={[{ required: true, message: 'Please enter vesting schedule' }]}
          >
            <Select placeholder="Select vesting schedule">
              <Select.Option value="4 years, 1 year cliff">4 years, 1 year cliff (Standard)</Select.Option>
              <Select.Option value="3 years, 6 month cliff">3 years, 6 month cliff</Select.Option>
              <Select.Option value="4 years, no cliff">4 years, no cliff</Select.Option>
              <Select.Option value="Immediate">Immediate (No vesting)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="strike_price"
            label="Price per Share (Strike Price)"
            rules={[{ required: true, message: 'Please enter price per share' }]}
            tooltip="The price per share for the equity grant. Typically $0.0001 for founder/officer grants."
          >
            <InputNumber
              min={0}
              precision={4}
              style={{ width: '100%' }}
              placeholder="0.0001"
              formatter={value => `$ ${value}`}
              parser={value => Number(value!.replace(/\$\s?/g, '')) as any}
            />
          </Form.Item>
        </div>

        {/* Step 2: Compensation - Always rendered but hidden when not current step */}
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          <Form.Item
            name="defer_salary"
            label="Defer Salary Until Funding?"
            rules={[{ required: true }]}
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>Yes - Defer salary (Pre-funding startup)</Select.Option>
              <Select.Option value={false}>No - Pay salary immediately (Funded)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.defer_salary !== currentValues.defer_salary}
          >
            {({ getFieldValue }) =>
              getFieldValue('defer_salary') ? (
                <Form.Item
                  name="funding_trigger"
                  label="Salary Activation Trigger"
                  rules={[{ required: true }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="e.g., Upon raising $500,000 in Series Seed funding or achieving $100,000 in monthly recurring revenue"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="annual_salary"
            label="Annual Base Salary (USD)"
            rules={[{ required: true, message: 'Please enter annual salary' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="120000"
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
            />
          </Form.Item>
        </div>

        {/* Step 3: Identity Verification - Always rendered but hidden when not current step */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          <div style={{ marginBottom: 24, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <SafetyCertificateOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <h4 style={{ margin: 0 }}>Executive Identity Verification</h4>
            </div>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              To finalize your appointment with <strong>Crave'n, Inc.</strong>, we securely collect your SSN for IRS, payroll, and equity compliance.
              Your SSN is <em>encrypted with AES-256-GCM</em> and stored in a restricted vault.
            </Text>
            <ul style={{ margin: '8px 0', color: '#666', paddingLeft: 20 }}>
              <li>Used only for required filings (e.g., W-2/1099, equity registrar, banking authorization)</li>
              <li>We store only the last four digits in plaintext for reference</li>
              <li>Do not email or text your SSN</li>
            </ul>
          </div>

          <Form.Item
            name="date_of_birth"
            label="Date of Birth"
            rules={[{ required: true, message: 'Please enter date of birth' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d && d.isAfter(dayjs())} />
          </Form.Item>

          <Form.Item
            name="address_line1"
            label="Address Line 1"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <Input placeholder="Street address" autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="address_line2"
            label="Address Line 2"
          >
            <Input placeholder="Apt, suite, etc. (optional)" autoComplete="off" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="state"
                label="State"
                rules={[{ required: true, message: 'Please enter state' }]}
              >
                <Input maxLength={2} placeholder="OH" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="postal_code"
                label="Postal Code"
                rules={[{ required: true, message: 'Please enter postal code' }]}
              >
                <Input maxLength={10} autoComplete="off" />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <h4>Social Security Number</h4>
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            We only store an encrypted vault copy and the last 4 digits for reference.
          </Text>

          <Row gutter={8}>
            <Col span={6}>
              <Form.Item
                name="ssn1"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^\d{3}$/, message: 'Must be 3 digits' }
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={3}
                  placeholder="XXX"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="ssn2"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^\d{2}$/, message: 'Must be 2 digits' }
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={2}
                  placeholder="XX"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ssn3"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^\d{4}$/, message: 'Must be 4 digits' }
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={4}
                  placeholder="XXXX"
                  autoComplete="off"
                />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Step 4: Review & Appoint - Always rendered but hidden when not current step */}
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          <Form.Item noStyle shouldUpdate>
            {() => {
              const reviewValues = form.getFieldsValue() as OfficerFormData;
              
              // Format appointment date
              const appointmentDate = reviewValues.appointment_date 
                ? (dayjs.isDayjs(reviewValues.appointment_date) 
                    ? reviewValues.appointment_date.format('MMMM D, YYYY')
                    : typeof reviewValues.appointment_date === 'string'
                    ? dayjs(reviewValues.appointment_date).format('MMMM D, YYYY')
                    : (reviewValues.appointment_date as any)?.format?.('MMMM D, YYYY') || String(reviewValues.appointment_date))
                : 'TBD';
              
              return (
                <div style={{ padding: '24px', background: '#fafafa', borderRadius: '8px' }}>
                  <h3 style={{ marginTop: 0 }}>Review Officer Appointment</h3>
                  {photoUrl && (
                    <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                      <img 
                        src={photoUrl} 
                        alt={reviewValues.full_name} 
                        style={{ 
                          width: '128px', 
                          height: '128px', 
                          borderRadius: '50%', 
                          objectFit: 'cover',
                          border: '4px solid white',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                    </div>
                  )}
                  <p><strong>Officer:</strong> {reviewValues.full_name || '(not provided)'}</p>
                  <p><strong>Title:</strong> {reviewValues.position_title || '(not provided)'}</p>
                  <p><strong>Email:</strong> {reviewValues.email || '(not provided)'}</p>
                  <p><strong>Appointment Date:</strong> {appointmentDate}</p>
                  <p><strong>Equity:</strong> {reviewValues.equity_percent || 0}% ({reviewValues.share_count?.toLocaleString() || 0} shares)</p>
                  <p><strong>Price per Share:</strong> ${reviewValues.strike_price ? reviewValues.strike_price.toFixed(4) : '0.0001'}</p>
                  <p><strong>Total Purchase Price:</strong> ${reviewValues.strike_price && reviewValues.share_count ? (reviewValues.strike_price * reviewValues.share_count).toFixed(2) : '0.00'}</p>
                  <p><strong>Vesting:</strong> {reviewValues.vesting_schedule || '(not provided)'}</p>
                  <p><strong>Annual Salary:</strong> ${reviewValues.annual_salary ? reviewValues.annual_salary.toLocaleString() : '0'}</p>
                  <p><strong>Salary Status:</strong> {reviewValues.defer_salary ? 'Deferred until funding' : 'Active immediately'}</p>
                  {reviewValues.defer_salary && reviewValues.funding_trigger && (
                    <p><strong>Activation Trigger:</strong> {reviewValues.funding_trigger}</p>
                  )}
                  <div style={{ marginTop: '24px', padding: '16px', background: '#fff', borderRadius: '4px', border: '1px solid #d9d9d9' }}>
                    <h4 style={{ marginTop: 0 }}>Documents to be Generated:</h4>
                    <ul>
                      <li>Executive Employment Agreement</li>
                      <li>{incorporationStatus === 'pre_incorporation' 
                        ? 'Pre-Incorporation Consent (Conditional Appointments)' 
                        : 'Board Resolution – Officer Appointment'}</li>
                      <li>Founders' / Shareholders' Agreement</li>
                      <li>Stock Subscription/Issuance Agreement</li>
                      <li>Executive Offer Letter</li>
                      <li>Confidentiality & IP Assignment Agreement</li>
                      {reviewValues.defer_salary && <li>Deferred Compensation Addendum</li>}
                      <li>Bylaws – Officers Excerpt</li>
                    </ul>
                  </div>
                </div>
              );
            }}
          </Form.Item>
        </div>
      </>
    );
  };

  return (
    <Card title="Appoint Corporate Officer" style={{ maxWidth: 900, margin: '0 auto' }}>
      <Steps current={currentStep} style={{ marginBottom: 32 }}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} description={item.description} />
        ))}
      </Steps>

      <Form form={form} layout="vertical" preserve={true}>
        {renderStepContent()}
      </Form>

      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        {currentStep > 0 && (
          <Button onClick={handlePrevious}>Previous</Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={handleNext}>
            Next
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            Appoint Officer & Generate Documents
          </Button>
        )}
      </div>
    </Card>
  );
};
