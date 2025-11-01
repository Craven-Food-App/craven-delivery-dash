// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, message, Checkbox, Alert, Row, Col, Spin } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, SafetyOutlined, LoadingOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICAViewer } from '@/components/driver/ICAViewer';
import { DriverSignatureCanvas } from '@/components/driver/SignatureCanvas';

const { Title, Text, Paragraph } = Typography;

export const SignAgreement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [driverEmail, setDriverEmail] = useState<string>('');
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
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

  const handleSignatureSaved = (dataUrl: string) => {
    setSignatureData(dataUrl);
    message.success('Signature captured successfully');
  };

  const submitAgreement = async () => {
    // Prevent double-submission
    if (signing) return;

    if (!hasReadAgreement) {
      message.error('Please confirm you have read the agreement');
      return;
    }

    if (!signatureData) {
      message.error('Please provide your signature');
      return;
    }

    setSigning(true);
    try {
      // Get client info for legal tracking
      const ipAddress = await getClientIP();
      const userAgent = navigator.userAgent;
      const location = await getClientLocation();

      // Convert base64 to blob
      const blob = dataURLtoBlob(signatureData);
      const fileName = `${driverId}-ica-signature-${Date.now()}.png`;

      // Upload signature to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver-signatures')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload signature');
      }

      // Get public URL for signature
      const { data: urlData } = supabase.storage
        .from('driver-signatures')
        .getPublicUrl(fileName);

      // Use upsert to handle both insert and update cases
      const { error: sigError } = await supabase
        .from('driver_signatures')
        .upsert({
          driver_id: driverId,
          agreement_type: 'ICA',
          agreement_version: '2025-10-29',
          signature_image_url: urlData.publicUrl,
          ip_address: ipAddress,
          user_agent: userAgent,
          latitude: location.latitude,
          longitude: location.longitude,
          signed_at: new Date().toISOString()
        }, {
          onConflict: 'driver_id,agreement_type'
        });

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

  const dataURLtoBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
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
            <div>
              <Title level={4} style={{ marginBottom: '16px', color: '#262626' }}>
                Your Signature
              </Title>
              <DriverSignatureCanvas 
                onSave={handleSignatureSaved}
                disabled={!hasReadAgreement}
              />
            </div>
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
                  disabled={!hasReadAgreement || !signatureData || signing}
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
