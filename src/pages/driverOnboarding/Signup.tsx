import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Row, Col } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, LockOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface SignupFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  city: string;
  zip: string;
}

export const DriverSignup: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: SignupFormData) => {
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

      // 2. Create driver record
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .insert({
          auth_user_id: authData.user.id,
          full_name: values.fullName,
          email: values.email,
          phone: values.phone,
          city: values.city,
          zip: values.zip,
          status: 'started'
        })
        .select()
        .single();

      if (driverError) {
        console.error('Driver creation error:', driverError);
        throw driverError;
      }

      message.success('Account created successfully!');
      
      // Navigate to legal consent screen
      navigate('/driver-onboarding/consent', {
        state: { driverId: driverData.id }
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      message.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ff7a00 0%, #ff9f40 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth < 768 ? '12px' : '24px'
    }}>
      <Card
        style={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <Title level={1} style={{ 
              margin: 0, 
              color: '#ff7a00', 
              fontSize: window.innerWidth < 768 ? '24px' : '36px'
            }}>
              Start Driving with Crave'n Today
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#595959', marginTop: '8px' }}>
              Join thousands of drivers earning with Crave'n
            </Paragraph>
          </div>

          {/* Signup Form */}
          <Form
            form={form}
            name="driver_signup"
            onFinish={onFinish}
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

            <Row gutter={[16, 0]}>
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
                    { required: true, message: 'Please enter your phone' },
                    { pattern: /^\d{10}$/, message: 'Enter 10 digits' }
                  ]}
                >
                  <Input 
                    prefix={<PhoneOutlined style={{ color: '#ff7a00' }} />}
                    placeholder="4195551234"
                    size="large"
                    maxLength={10}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="City"
                  name="city"
                  rules={[{ required: true, message: 'Please enter your city' }]}
                >
                  <Input 
                    prefix={<EnvironmentOutlined style={{ color: '#ff7a00' }} />}
                    placeholder="Toledo"
                    size="large"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="ZIP Code"
                  name="zip"
                  rules={[
                    { required: true, message: 'Please enter your ZIP' },
                    { pattern: /^\d{5}$/, message: 'Enter 5 digits' }
                  ]}
                >
                  <Input 
                    placeholder="43615"
                    size="large"
                    maxLength={5}
                  />
                </Form.Item>
              </Col>
            </Row>

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
                placeholder="Create a strong password"
                size="large"
              />
            </Form.Item>

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
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined style={{ color: '#ff7a00' }} />}
                placeholder="Re-enter your password"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                loading={loading}
                block
                style={{
                  height: '50px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  borderRadius: '8px'
                }}
              >
                Start Now
              </Button>
            </Form.Item>
          </Form>

          {/* Footer */}
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              Already have an account?{' '}
              <Button type="link" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

