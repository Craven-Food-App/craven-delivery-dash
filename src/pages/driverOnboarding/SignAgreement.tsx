// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, message, Checkbox, Alert, Row, Col, Spin, Input } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, SafetyOutlined, LoadingOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICAViewer } from '@/components/driver/ICAViewer';

const { Title, Text, Paragraph } = Typography;

export const SignAgreement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverEmail, setDriverEmail] = useState<string>('');
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [typedName, setTypedName] = useState<string>('');
  const [signing, setSigning] = useState(false);
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
    fetchDriverDetails(id);
  }, [location, navigate]);

  const fetchDriverDetails = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('full_name, email, status')
        .eq('id', id)
        .single();

      if (error) throw error;

      setDriverName(data.full_name);
      setDriverEmail(data.email);

      // Check if already signed
      if (data.status === 'contract_signed' || data.status === 'eligible' || data.status === 'active') {
        // Already signed, check zone status
        checkZoneAndRedirect(id);
      }
    } catch (error: any) {
      console.error('Fetch driver error:', error);
      message.error('Failed to load driver details');
    }
  };

  const submitAgreement = async () => {
    // Prevent double-submission
    if (signing) return;

    if (!hasReadAgreement) {
      message.error('Please confirm you have read the agreement');
      return;
    }

    if (!typedName || typedName.trim() === '') {
      message.error('Please type your full name to sign');
      return;
    }

    // Check name matches driver name
    if (typedName.toLowerCase() !== driverName.toLowerCase()) {
      message.error('Name does not match driver account name');
      return;
    }

    setSigning(true);
    try {
      // Get client info for legal tracking
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;
      const location = await getClientLocation();

      // Check if signature already exists
      const { data: existingSig } = await supabase
        .from('driver_signatures')
        .select('id')
        .eq('driver_id', driverId)
        .eq('agreement_type', 'ICA')
        .single();

      let sigError;
      if (existingSig) {
        // Update existing signature
        ({ error: sigError } = await supabase
          .from('driver_signatures')
          .update({
            agreement_version: '2025-10-29',
            typed_name: typedName,
            ip_address: ipAddress,
            user_agent: userAgent,
            latitude: location.latitude,
            longitude: location.longitude,
            signed_at: new Date().toISOString()
          })
          .eq('driver_id', driverId)
          .eq('agreement_type', 'ICA'));
      } else {
        // Insert new signature
        ({ error: sigError } = await supabase
          .from('driver_signatures')
          .insert({
            driver_id: driverId,
            agreement_type: 'ICA',
            agreement_version: '2025-10-29',
            typed_name: typedName,
            ip_address: ipAddress,
            user_agent: userAgent,
            latitude: location.latitude,
            longitude: location.longitude,
            signed_at: new Date().toISOString()
          }));
      }

      if (sigError) {
        console.error('Signature record error:', sigError);
        throw sigError;
      }

      // Update driver status
      const { error: updateError } = await supabase
        .from('drivers')
        .update({
          status: 'contract_signed',
          contract_signed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) throw updateError;

      message.success('Agreement signed successfully!');

      // Check zone capacity and redirect
      setTimeout(() => {
        checkZoneAndRedirect(driverId);
      }, 1500);

    } catch (error: any) {
      console.error('Sign agreement error:', error);
      message.error(error.message || 'Failed to sign agreement');
    } finally {
      setSigning(false);
    }
  };

  const checkZoneAndRedirect = async (id: string) => {
    try {
      // Call start-onboarding function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('start-onboarding', {
        body: { driverId: id }
      });

      if (functionError) {
        console.error('Onboarding function error:', functionError);
        // If function fails, default to eligible
        navigate('/driver-onboarding/activation', { state: { driverId: id } });
        return;
      }

      if (functionData.status === 'waitlisted') {
        navigate('/driver-onboarding/waitlist', { state: { driverId: id } });
      } else {
        navigate('/driver-onboarding/activation', { state: { driverId: id } });
      }

    } catch (error) {
      console.error('Zone check error:', error);
      navigate('/driver-onboarding/activation', { state: { driverId: id } });
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

  const getClientLocation = async (): Promise<{ latitude: number | null; longitude: number | null }> => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          () => {
            resolve({ latitude: null, longitude: null });
          }
        );
      } else {
        resolve({ latitude: null, longitude: null });
      }
    });
  };

  if (signing) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <Card style={{ textAlign: 'center', borderRadius: '16px' }}>
          <Space direction="vertical" size="large">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#ff7a00' }} spin />} />
            <Text strong style={{ fontSize: '18px' }}>Processing your agreement...</Text>
            <Text type="secondary">Saving signature and finalizing contract</Text>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#ff7a00', marginBottom: '16px' }} />
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Review and Sign Your Agreement
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#595959', marginTop: '8px' }}>
              Please read the Independent Contractor Agreement carefully before signing
            </Paragraph>
          </div>

          {/* Agreement Document */}
          <ICAViewer />

          {/* Acknowledgment Checkbox */}
          <Card style={{ borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde047' }}>
            <Checkbox
              checked={hasReadAgreement}
              onChange={(e) => setHasReadAgreement(e.target.checked)}
              style={{ fontSize: '16px' }}
            >
              <Text strong>
                I have read and understand the Independent Contractor Agreement and agree to its terms
              </Text>
            </Checkbox>
          </Card>

          {/* Signature Section */}
          {hasReadAgreement && (
            <Card style={{ borderRadius: '12px', background: '#f0f9ff', border: '1px solid #91d5ff' }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Title level={4} style={{ marginBottom: '8px', color: '#262626' }}>
                  Type Your Full Name to Sign
                </Title>
                <Paragraph type="secondary" style={{ fontSize: '14px', marginBottom: '16px' }}>
                  Please type your full legal name exactly as it appears on your account: <Text strong>{driverName}</Text>
                </Paragraph>
                <Input 
                  size="large"
                  placeholder="Enter your full name"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  style={{ fontSize: '16px' }}
                />
              </Space>
            </Card>
          )}

          {/* Submit Button */}
          <Card style={{ borderRadius: '12px', background: '#f0f9ff', border: '1px solid #91d5ff' }}>
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                    Ready to Sign?
                  </Text>
                  <Text type="secondary" style={{ fontSize: '13px' }}>
                    {driverName} • {driverEmail}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Button 
                  type="primary" 
                  size="large"
                  loading={signing}
                  disabled={!hasReadAgreement || !typedName || signing}
                  onClick={submitAgreement}
                  icon={<CheckCircleOutlined />}
                  style={{
                    height: '50px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    minWidth: '180px'
                  }}
                >
                  Sign Agreement
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Legal Notice */}
          <Alert
            message="Electronic Signature Legal Notice"
            description="Your electronic signature is legally binding under the ESIGN Act of 2000 and has the same legal effect as a handwritten signature. This agreement will be stored securely and you will receive a copy via email."
            type="info"
            showIcon
            icon={<SafetyOutlined />}
          />
        </Space>
      </div>
    </div>
  );
};
