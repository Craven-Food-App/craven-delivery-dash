import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, DatePicker, Select, Alert, Row, Col } from 'antd';
import { SafetyOutlined, IdcardOutlined, LockOutlined, CarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface IdentityFormData {
  dateOfBirth: any;
  ssn: string;
  ssnConfirm: string;
  dlNumber: string;
  dlState: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const IdentityForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = location.state?.driverId;
    if (!id) {
      message.error('Invalid session - please start over');
      navigate('/driver-onboarding/signup');
      return;
    }
    setDriverId(id);
  }, [location, navigate]);

  const onFinish = async (values: IdentityFormData) => {
    setLoading(true);
    try {
      // Format SSN (remove dashes)
      const ssnClean = values.ssn.replace(/-/g, '');

      // Call intake-identity Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('intake-identity', {
        body: {
          driverId: driverId,
          dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
          ssn: ssnClean,
          dlNumber: values.dlNumber,
          dlState: values.dlState
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (!functionData.success) {
        throw new Error(functionData.error || 'Failed to submit identity');
      }

      message.success('Identity verified and securely stored');
      
      // Navigate to background check pending screen
      navigate('/driver-onboarding/background-check', {
        state: { driverId }
      });

    } catch (error: any) {
      console.error('Identity submission error:', error);
      message.error(error.message || 'Failed to submit identity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Card
        style={{
          maxWidth: '700px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <IdcardOutlined style={{ fontSize: '48px', color: '#ff7a00', marginBottom: '16px' }} />
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Tell us about yourself
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#595959', marginTop: '8px' }}>
              Enter your legal details so we can verify eligibility
            </Paragraph>
          </div>

          <Alert
            message="Your information is secure"
            description="All sensitive data is encrypted using bank-level security. We never share your SSN or driver's license number."
            type="success"
            showIcon
            icon={<LockOutlined />}
          />

          {/* Identity Form */}
          <Form
            form={form}
            name="identity_form"
            onFinish={onFinish}
            layout="vertical"
            requiredMark="optional"
          >
            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
              rules={[
                { required: true, message: 'Please enter your date of birth' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const age = dayjs().diff(value, 'year');
                    if (age < 18) {
                      return Promise.reject('You must be at least 18 years old');
                    }
                    if (age > 100) {
                      return Promise.reject('Please enter a valid date');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                size="large"
                format="MM/DD/YYYY"
                placeholder="Select your date of birth"
                disabledDate={(current) => current && current > dayjs().subtract(18, 'years')}
              />
            </Form.Item>

            <Form.Item
              label="Social Security Number"
              name="ssn"
              rules={[
                { required: true, message: 'Please enter your SSN' },
                { 
                  pattern: /^\d{3}-?\d{2}-?\d{4}$/,
                  message: 'Enter SSN in format XXX-XX-XXXX or XXXXXXXXX'
                }
              ]}
              extra="Format: XXX-XX-XXXX (encrypted and secured)"
            >
              <Input 
                placeholder="123-45-6789"
                size="large"
                maxLength={11}
                prefix={<LockOutlined style={{ color: '#ff7a00' }} />}
              />
            </Form.Item>

            <Form.Item
              label="Confirm Social Security Number"
              name="ssnConfirm"
              dependencies={['ssn']}
              rules={[
                { required: true, message: 'Please confirm your SSN' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('ssn') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject('SSN numbers do not match');
                  },
                }),
              ]}
            >
              <Input 
                placeholder="Re-enter your SSN"
                size="large"
                maxLength={11}
                prefix={<LockOutlined style={{ color: '#ff7a00' }} />}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  label="Driver's License Number"
                  name="dlNumber"
                  rules={[
                    { required: true, message: 'Please enter your DL number' },
                    { min: 5, message: 'DL must be at least 5 characters' }
                  ]}
                >
                  <Input 
                    placeholder="DL123456789"
                    size="large"
                    prefix={<CarOutlined style={{ color: '#ff7a00' }} />}
                    maxLength={20}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label="State"
                  name="dlState"
                  rules={[{ required: true, message: 'Select state' }]}
                >
                  <Select 
                    placeholder="State"
                    size="large"
                    showSearch
                  >
                    {US_STATES.map(state => (
                      <Option key={state} value={state}>{state}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Alert
              message="Why we need this information"
              description="Federal and state law requires us to verify your identity and driving eligibility before you can deliver with Crave'n."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                loading={loading}
                block
                icon={<CheckCircleOutlined />}
                style={{
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '8px'
                }}
              >
                Continue
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
};

