import React, { useState } from 'react';
import { Card, Steps, Form, Input, Select, DatePicker, InputNumber, Button, message } from 'antd';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

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
  annual_salary?: number;
  defer_salary: boolean;
  funding_trigger?: string;
}

export const OfficerAppointmentWorkflow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { title: 'Officer Details', description: 'Name, title, email' },
    { title: 'Equity Allocation', description: 'Shares and vesting' },
    { title: 'Compensation', description: 'Salary structure' },
    { title: 'Review & Appoint', description: 'Generate documents' },
  ];

  const handleNext = async () => {
    try {
      await form.validateFields();
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = form.getFieldsValue() as OfficerFormData;

      // Format appointment_date for submission
      const appointmentDateStr = typeof values.appointment_date === 'string' 
        ? values.appointment_date 
        : (values.appointment_date as any).format('YYYY-MM-DD');

      // Call edge function to appoint officer
      const { data, error } = await supabase.functions.invoke('appoint-corporate-officer', {
        body: {
          executive_name: values.full_name,
          executive_email: values.email,
          executive_title: values.position_title,
          appointment_date: appointmentDateStr,
          equity_percent: values.equity_percent.toString(),
          shares_issued: values.share_count.toString(),
          vesting_schedule: values.vesting_schedule,
          annual_salary: values.annual_salary?.toString(),
          defer_salary: values.defer_salary,
          funding_trigger: values.funding_trigger,
        },
      });

      if (error) throw error;

      message.success('Officer appointed successfully! Documents generated.');
      navigate('/board-portal');
    } catch (error: any) {
      console.error('Error appointing officer:', error);
      message.error(error.message || 'Failed to appoint officer');
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
                  <p><strong>Officer:</strong> {reviewValues.full_name || '(not provided)'}</p>
                  <p><strong>Title:</strong> {reviewValues.position_title || '(not provided)'}</p>
                  <p><strong>Email:</strong> {reviewValues.email || '(not provided)'}</p>
                  <p><strong>Appointment Date:</strong> {appointmentDate}</p>
                  <p><strong>Equity:</strong> {reviewValues.equity_percent || 0}% ({reviewValues.share_count?.toLocaleString() || 0} shares)</p>
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
