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

export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({ onNext, onBack }) => {
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

      // 2. Find or create zone for this ZIP
      const { data: zoneData } = await supabase
        .from('zones')
        .select('id')
        .eq('zip_code', values.zip)
        .single();

      let zoneId = zoneData?.id;

      // If no zone exists, create one
      if (!zoneId) {
        // Determine state from ZIP (simple logic - can be improved)
        const stateMap: Record<string, string> = {
          '43': 'OH', '45': 'OH', '44': 'OH', // Columbus, Cincinnati, Cleveland
          '48': 'MI', '49': 'MI', '50': 'MI', // Detroit areas
          '30': 'GA', '31': 'GA', '32': 'GA', // Atlanta areas
          '33': 'FL', '34': 'FL', '32': 'FL', // Florida areas
        };
        const stateCode = stateMap[values.zip.substring(0, 2)] || 'OH';

        const { data: newZone } = await supabase
          .from('zones')
          .insert({
            zip_code: values.zip,
            city: values.city,
            state: stateCode,
            capacity: 50,
            is_active: true
          })
          .select()
          .single();
        
        zoneId = newZone?.id;
      }

      // 3. Create driver record
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .insert({
          auth_user_id: authData.user.id,
          full_name: values.fullName,
          email: values.email,
          phone: values.phone,
          city: values.city,
          zip: values.zip,
          zone_id: zoneId,
          status: 'started'
        })
        .select()
        .single();

      if (driverError) {
        console.error('Driver creation error:', driverError);
        throw driverError;
      }

      // 4. Place on waitlist if zoneId exists
      if (zoneId) {
        const { error: waitlistError } = await supabase
          .from('driver_waitlist')
          .insert({
            driver_id: driverData.id,
            zone_id: zoneId,
            added_at: new Date().toISOString()
          });

        if (waitlistError) {
          console.error('Waitlist error:', waitlistError);
          // Don't fail if waitlist insert fails - driver is still created
        }
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
        driverId: driverData.id,
        email: values.email,
        city: values.city,
        zoneId,
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

