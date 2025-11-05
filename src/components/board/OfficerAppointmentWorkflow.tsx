import React, { useState } from 'react';
import { Card, Steps, Form, Input, Select, DatePicker, InputNumber, Button, message, Upload } from 'antd';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { renderHtml } from '@/lib/templates';
import { docsAPI } from '../hr/api';

const { Step } = Steps;
const { TextArea } = Input;

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
}

export const OfficerAppointmentWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<UploadFile | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const steps = [
    { title: 'Officer Details', description: 'Name, title, email' },
    { title: 'Equity Allocation', description: 'Shares and vesting' },
    { title: 'Compensation', description: 'Salary structure' },
    { title: 'Review & Appoint', description: 'Generate documents' },
  ];

  // Document types to generate during appointment
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

      // Generate each document
      for (const docType of CSUITE_DOC_TYPES) {
        try {
          // Skip deferred_comp_addendum if salary is not deferred
          if (docType.id === 'deferred_comp_addendum' && !formValues.defer_salary) {
            console.log(`Skipping ${docType.title} - salary is not deferred`);
            continue;
          }

          // Prepare document data based on template type
          const docData = prepareDocumentData(
            formValues,
            docType.id,
            appointmentDate,
            strikePrice,
            sharesIssued,
            totalPurchasePrice,
            equityPercent,
            annualSalary
          );

          // Generate HTML using template
          const html_content = renderHtml(docType.id, docData);

          // Call document-generate edge function
          const resp = await docsAPI.post('/documents/generate', {
            template_id: docType.id,
            officer_name: formValues.full_name,
            role: formValues.position_title === 'CXO' ? 'Chief Experience Officer' : formValues.position_title,
            equity: docType.id.includes('equity') || docType.id === 'stock_issuance' ? equityPercent : undefined,
            data: docData,
            html_content,
            executive_id: executiveId, // Link document to executive for signature portal
          });

          if (!resp?.ok || !resp?.document) {
            console.warn(`Failed to generate ${docType.title}:`, resp?.error);
          } else {
            console.log(`✓ Generated ${docType.title}`);
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

  const prepareDocumentData = (
    formValues: OfficerFormData,
    docType: string,
    appointmentDate: string,
    strikePrice: number,
    sharesIssued: number,
    totalPurchasePrice: number,
    equityPercent: number,
    annualSalary: number
  ) => {
    const baseData: Record<string, any> = {
      company_name: "Crave'n, Inc.",
      state_of_incorporation: "Ohio",
      full_name: formValues.full_name,
      role: formValues.position_title === 'CXO' ? 'Chief Experience Officer' : formValues.position_title,
      effective_date: appointmentDate,
      date: appointmentDate,
      adoption_date: appointmentDate,
      funding_trigger: formValues.funding_trigger || "Upon Series A funding or significant investment event",
      governing_law: "State of Ohio",
      governing_law_state: "Ohio",
      equity_percentage: equityPercent.toString(),
      annual_salary: annualSalary.toLocaleString(),
      vesting_schedule: formValues.vesting_schedule || '4 years with 1 year cliff',
      strike_price: strikePrice.toFixed(4),
      price_per_share: strikePrice.toFixed(4),
      share_count: sharesIssued.toLocaleString(),
      shares_issued: sharesIssued.toLocaleString(),
      total_purchase_price: totalPurchasePrice.toFixed(2),
      company_address: "123 Main St, Cleveland, OH 44101",
    };

    // Template-specific data
    switch (docType) {
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

        {/* Step 3: Review & Appoint - Always rendered but hidden when not current step */}
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
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
                      <li>Board Resolution – Officer Appointment</li>
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
