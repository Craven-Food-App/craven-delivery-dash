// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Typography, Space, message, Checkbox, Alert, Divider } from 'antd';
import { SafetyOutlined, FileProtectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface ConsentFormData {
  termsOfService: boolean;
  privacyPolicy: boolean;
  fcraAuthorization: boolean;
}

export const LegalConsent: React.FC = () => {
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

  const onFinish = async (values: ConsentFormData) => {
    if (!values.termsOfService || !values.privacyPolicy || !values.fcraAuthorization) {
      message.error('You must accept all agreements to continue');
      return;
    }

    setLoading(true);
    try {
      const now = new Date().toISOString();

      // Save consents to database
      const { error: consentError } = await supabase
        .from('driver_consents')
        .insert({
          driver_id: driverId,
          terms_of_service_accepted: true,
          terms_of_service_accepted_at: now,
          privacy_policy_accepted: true,
          privacy_policy_accepted_at: now,
          fcra_authorization_accepted: true,
          fcra_authorization_accepted_at: now,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent
        });

      if (consentError) {
        throw consentError;
      }

      // Update driver status
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          status: 'consents_ok',
          updated_at: now
        })
        .eq('id', driverId);

      if (updateError) {
        throw updateError;
      }

      message.success('Legal consents recorded successfully');
      
      // Navigate to identity form
      navigate('/driver-onboarding/identity', {
        state: { driverId }
      });

    } catch (error: any) {
      console.error('Consent error:', error);
      message.error(error.message || 'Failed to record consents');
    } finally {
      setLoading(false);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
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
          maxWidth: '800px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <SafetyOutlined style={{ fontSize: '48px', color: '#ff7a00', marginBottom: '16px' }} />
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Before we get started…
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#595959', marginTop: '8px' }}>
              Please review and agree to our Terms, Privacy Policy, and Background Check Authorization
            </Paragraph>
          </div>

          <Alert
            message="Important Legal Documents"
            description="These agreements are required to continue with your driver application. Please read each document carefully."
            type="info"
            showIcon
            icon={<FileProtectOutlined />}
          />

          {/* Legal Consent Form */}
          <Form
            form={form}
            name="legal_consent"
            onFinish={onFinish}
            layout="vertical"
            requiredMark="optional"
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Terms of Service */}
              <Card 
                size="small" 
                style={{ 
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>Terms of Service</Text>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    padding: '12px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>1. Independent Contractor Relationship:</strong> You acknowledge that you are an independent contractor, not an employee of Crave'n.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>2. Service Standards:</strong> You agree to provide courteous, professional service to all customers.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>3. Insurance Requirements:</strong> You must maintain valid auto insurance at all times.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px' }}>
                      <strong>4. Payment Terms:</strong> Payments are processed weekly via direct deposit.
                    </Paragraph>
                  </div>
                  <Form.Item
                    name="termsOfService"
                    valuePropName="checked"
                    rules={[{ required: true, message: 'You must accept the Terms of Service' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>
                      I have read and agree to the <Button 
                        type="link" 
                        style={{ padding: 0 }} 
                        onClick={(e) => {
                          e.preventDefault();
                          window.open('/terms-of-service', '_blank');
                        }}
                      >
                        Terms of Service
                      </Button>
                    </Checkbox>
                  </Form.Item>
                </Space>
              </Card>

              {/* Privacy Policy */}
              <Card 
                size="small" 
                style={{ 
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>Privacy Policy</Text>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    padding: '12px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>Data Collection:</strong> We collect personal information including name, contact details, and location data to provide our services.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>Data Usage:</strong> Your information is used to facilitate deliveries, process payments, and improve our platform.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px' }}>
                      <strong>Data Security:</strong> We use industry-standard encryption to protect your personal information.
                    </Paragraph>
                  </div>
                  <Form.Item
                    name="privacyPolicy"
                    valuePropName="checked"
                    rules={[{ required: true, message: 'You must accept the Privacy Policy' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>
                      I have read and agree to the <Button 
                        type="link" 
                        style={{ padding: 0 }} 
                        onClick={(e) => {
                          e.preventDefault();
                          window.open('/privacy-policy', '_blank');
                        }}
                      >
                        Privacy Policy
                      </Button>
                    </Checkbox>
                  </Form.Item>
                </Space>
              </Card>

              {/* FCRA Authorization */}
              <Card 
                size="small" 
                style={{ 
                  background: '#fafafa',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px'
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>Background Check Authorization (FCRA)</Text>
                  <div style={{ 
                    maxHeight: '120px', 
                    overflowY: 'auto', 
                    padding: '12px',
                    background: 'white',
                    borderRadius: '4px',
                    border: '1px solid #e0e0e0'
                  }}>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>Authorization:</strong> I authorize Crave'n and its designated agents to conduct a comprehensive background check as permitted by the Fair Credit Reporting Act (FCRA).
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <strong>Scope:</strong> This check may include criminal records, driving history, and employment verification.
                    </Paragraph>
                    <Paragraph style={{ fontSize: '12px' }}>
                      <strong>Rights:</strong> You have the right to request a copy of the report and dispute any inaccuracies.
                    </Paragraph>
                  </div>
                  <Form.Item
                    name="fcraAuthorization"
                    valuePropName="checked"
                    rules={[{ required: true, message: 'Background check authorization is required' }]}
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>
                      I authorize Crave'n to conduct a <Button type="link" style={{ padding: 0 }}>background check</Button>
                    </Checkbox>
                  </Form.Item>
                </Space>
              </Card>
            </Space>

            <Divider />

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

