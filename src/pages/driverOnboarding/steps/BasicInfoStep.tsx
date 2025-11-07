// @ts-nocheck
import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Row, Col, Checkbox } from 'antd';
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
  const [detectedLocation, setDetectedLocation] = useState<{ city: string; state: string; zip: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  // Detect location on mount
  React.useEffect(() => {
    const detectLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Reverse geocode using Nominatim (free, no API key needed)
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
              );
              const data = await response.json();
              
              if (data.address) {
                const city = data.address.city || data.address.town || data.address.village || '';
                const state = data.address.state || '';
                const zip = data.address.postcode || '';
                
                // Convert state name to abbreviation
                const stateAbbr = getStateAbbreviation(state);
                
                const location = { city, state: stateAbbr, zip };
                setDetectedLocation(location);
                form.setFieldsValue({ zip });
                message.success(`Location detected: ${city}, ${stateAbbr}`);
              }
              setLocationLoading(false);
            },
            (error) => {
              console.error('Geolocation error:', error);
              message.warning('Could not detect location. Using IP-based detection...');
              fallbackToIPLocation();
            }
          );
        } else {
          fallbackToIPLocation();
        }
      } catch (error) {
        console.error('Location detection error:', error);
        setLocationLoading(false);
        message.error('Location detection failed');
      }
    };

    const fallbackToIPLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const location = {
          city: data.city || '',
          state: data.region_code || '',
          zip: data.postal || ''
        };
        setDetectedLocation(location);
        form.setFieldsValue({ zip: location.zip });
        message.success(`Location detected: ${location.city}, ${location.state}`);
      } catch (error) {
        console.error('IP location error:', error);
        message.error('Could not detect location automatically');
      } finally {
        setLocationLoading(false);
      }
    };

    detectLocation();
  }, [form]);

  // Helper function to convert state names to abbreviations
  const getStateAbbreviation = (stateName: string): string => {
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
      'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
      'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
      'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
      'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
      'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
      'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
      'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateMap[stateName] || stateName.substring(0, 2).toUpperCase();
  };

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
      let regionName = '';
      const { data: regionsData } = await supabase
        .from('regions')
        .select('id, zip_prefix, name')
        .order('created_at');

      // Find matching region by zip_prefix
      if (regionsData && regionsData.length > 0) {
        const matchingRegion = regionsData.find(r => 
          values.zip.startsWith(r.zip_prefix)
        );
        regionId = matchingRegion?.id || regionsData[0].id; // Default to first region if no match
        regionName = matchingRegion?.name || regionsData[0].name || '';
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
          city: detectedLocation?.city || '',
          state: detectedLocation?.state || '',
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

      // 6. Send waitlist email
      try {
        const emailResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-driver-waitlist-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            driverName: values.fullName,
            driverEmail: values.email,
            city: detectedLocation?.city || '',
            state: detectedLocation?.state || '',
            waitlistPosition: appData.waitlist_position,
            location: regionName,
            emailType: 'waitlist'
          }),
        });

        if (!emailResponse.ok) {
          console.log('Warning: Waitlist email sending failed');
        }
      } catch (emailError) {
        console.log('Warning: Waitlist email sending error:', emailError);
      }

      message.success('Application submitted successfully!');

      // Continue to success step
      onNext({
        applicationId: appData.id,
        driverId: appData.id,
        email: values.email,
        city: detectedLocation?.city || '',
        state: detectedLocation?.state || '',
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
          {locationLoading && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '8px' }}>
              <Text>📍 Detecting your location...</Text>
            </div>
          )}
          {detectedLocation && (
            <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '8px', border: '1px solid #b7eb8f' }}>
              <Text style={{ color: '#52c41a', fontWeight: 500 }}>
                ✓ Location Detected: {detectedLocation.city}, {detectedLocation.state}
              </Text>
            </div>
          )}
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
            <Col xs={24}>
              <Form.Item
                label="ZIP Code (Auto-detected)"
                name="zip"
                rules={[
                  { required: true, message: 'Please confirm your ZIP code' },
                  { pattern: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP format' }
                ]}
              >
                <Input
                  prefix={<EnvironmentOutlined style={{ color: '#ff7a00' }} />}
                  placeholder="ZIP code will be auto-detected"
                  size="large"
                  disabled={locationLoading}
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

          {/* Age Verification */}
          <Form.Item
            name="ageVerified"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(new Error('You must confirm you are 18+ to apply'))
              }
            ]}
          >
            <div style={{
              padding: '16px',
              backgroundColor: '#fffbe6',
              borderRadius: '8px',
              border: '1px solid #ffd666'
            }}>
              <Checkbox style={{ width: '100%' }}>
                <Text style={{ fontSize: '14px' }}>
                  I confirm that I am at least 18 years of age and legally authorized to work as a delivery driver.
                </Text>
              </Checkbox>
            </div>
          </Form.Item>

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

