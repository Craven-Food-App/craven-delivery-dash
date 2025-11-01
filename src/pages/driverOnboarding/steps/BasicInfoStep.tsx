// @ts-nocheck
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

const { Title, Text, Paragraph } = Typography;

interface BasicInfoStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  applicationData: any;
}

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ onNext, onBack, applicationData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            phone: values.phone,
            user_type: 'driver'
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      // 2. Determine region based on ZIP
      let regionId = null;
      const { data: regionsData } = await supabase
        .from('regions')
        .select('id, zip_prefix')
        .order('created_at');

      // Find matching region by zip_prefix
      if (regionsData && regionsData.length > 0) {
        const matchingRegion = regionsData.find(r => 
          values.zip.startsWith(r.zip_prefix)
        );
        regionId = matchingRegion?.id || regionsData[0].id; // Default to first region if no match
      }

      // 3. Parse full name
      const nameParts = values.fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 4. Create craver application (waitlisted)
      const { data: appData, error: appError } = await supabase
        .from('craver_applications')
        .insert({
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: values.email,
          phone: values.phone,
          city: values.city,
          state: 'OH', // TODO: determine from ZIP
          zip_code: values.zip,
          status: 'waitlist',
          region_id: regionId,
          points: 0,
          priority_score: 0,
          waitlist_joined_at: new Date().toISOString(),
          tos_accepted: applicationData?.termsAccepted || false,
          privacy_accepted: applicationData?.privacyAccepted || false
        })
        .select()
        .single();

      if (appError) {
        console.error('Application creation error:', appError);
        throw appError;
      }

      // 5. Create user profile
      await supabase.from('user_profiles').insert({
        user_id: authData.user.id,
        full_name: values.fullName,
        phone: values.phone,
        role: 'driver'
      });

      message.success('Application submitted successfully!');

      // Continue to success step
      onNext({
        applicationId: appData.id,
        driverId: appData.id,
        email: values.email,
        city: values.city,
        regionId,
        ...values
      });

    } catch (error: any) {
      console.error('Application error:', error);
      message.error(error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: 'none'
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#ff7a00' }} />
          <Title level={2} style={{ marginTop: '16px' }}>
            Tell Us About Yourself
          </Title>
          <Paragraph style={{ fontSize: '16px', color: '#595959' }}>
            We need some basic information to get started
          </Paragraph>
        </div>

        {/* Form */}
        <Form
          form={form}
          name="basic_info"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark="optional"
          autoComplete="off"
        >
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[
              { required: true, message: 'Please enter your full name' },
              { min: 3, message: 'Name must be at least 3 characters' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#ff7a00' }} />}
              placeholder="John Smith"
              size="large"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Invalid email format' }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: '#ff7a00' }} />}
                  placeholder="john@example.com"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Phone"
                name="phone"
                rules={[
                  { required: true, message: 'Please enter your phone number' },
                  { pattern: /^[\d\s\-()+]+$/, message: 'Invalid phone format' }
                ]}
              >
                <Input
                  prefix={<PhoneOutlined style={{ color: '#ff7a00' }} />}
                  placeholder="(555) 123-4567"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="City"
                name="city"
                rules={[{ required: true, message: 'Please enter your city' }]}
              >
                <Input
                  prefix={<EnvironmentOutlined style={{ color: '#ff7a00' }} />}
                  placeholder="Columbus"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="ZIP Code"
                name="zip"
                rules={[
                  { required: true, message: 'Please enter your ZIP code' },
                  { pattern: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP format' }
                ]}
              >
                <Input
                  placeholder="43210"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: 'Please enter a password' },
                  { min: 8, message: 'Password must be at least 8 characters' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#ff7a00' }} />}
                  placeholder="Create password"
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    }
                  })
                ]}
              >
                <Input.Password
                  placeholder="Confirm password"
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Action Buttons */}
          <Form.Item style={{ marginTop: '24px' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Button
                  size="large"
                  block
                  onClick={onBack}
                  icon={<ArrowLeftOutlined />}
                  style={{ height: '50px' }}
                >
                  Back
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  type="primary"
                  size="large"
                  block
                  htmlType="submit"
                  loading={loading}
                  style={{
                    height: '50px',
                    backgroundColor: '#ff7a00',
                    borderColor: '#ff7a00'
                  }}
                >
                  Submit Application
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
};

