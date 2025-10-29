import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, message, Result, Alert, Spin } from 'antd';
import { FileTextOutlined, SendOutlined, MailOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export const SignAgreement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [driverId, setDriverId] = useState<string>('');
  const [driverEmail, setDriverEmail] = useState<string>('');
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

  useEffect(() => {
    if (!sent || !driverId) return;

    // Poll for contract signature status
    const pollInterval = setInterval(async () => {
      setChecking(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('status, contract_signed_at')
        .eq('id', driverId)
        .single();

      if (error) {
        console.error('Status poll error:', error);
        return;
      }

      if (data.status === 'contract_signed') {
        clearInterval(pollInterval);
        setChecking(false);
        message.success('Contract signed successfully!');
        
        // Wait a moment then redirect
        setTimeout(() => {
          // Check if they got waitlisted or eligible
          if (data.status === 'waitlisted_contract_signed') {
            navigate('/driver-onboarding/waitlist', { state: { driverId } });
          } else {
            navigate('/driver-onboarding/activation', { state: { driverId } });
          }
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [sent, driverId, navigate]);

  const fetchDriverDetails = async (id: string) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('email, docusign_envelope_id, status')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch driver error:', error);
      return;
    }

    setDriverEmail(data.email);

    // Check if envelope already sent
    if (data.docusign_envelope_id) {
      setSent(true);
    }

    // Check if already signed
    if (data.status === 'contract_signed') {
      navigate('/driver-onboarding/activation', { state: { driverId: id } });
    }
  };

  const sendAgreement = async () => {
    setLoading(true);
    try {
      // Call create-docusign-envelope Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('create-docusign-envelope', {
        body: { driverId }
      });

      if (functionError) {
        throw functionError;
      }

      if (!functionData.success) {
        throw new Error(functionData.error || 'Failed to send agreement');
      }

      message.success(`Agreement sent to ${driverEmail}`);
      setSent(true);

    } catch (error: any) {
      console.error('Send agreement error:', error);
      message.error(error.message || 'Failed to send agreement');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
            maxWidth: '600px',
            width: '100%',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}
        >
          <Result
            icon={<MailOutlined style={{ color: '#1890ff', fontSize: '72px' }} />}
            title="Check Your Email"
            subTitle={`We've sent your Independent Contractor Agreement to ${driverEmail}`}
            extra={
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Alert
                  message="Next Steps"
                  description={
                    <ol style={{ textAlign: 'left', paddingLeft: '20px', margin: '8px 0' }}>
                      <li>Check your email inbox</li>
                      <li>Open the DocuSign email from Crave'n</li>
                      <li>Review and sign the agreement</li>
                      <li>Return here once signed</li>
                    </ol>
                  }
                  type="info"
                  showIcon
                />
                
                {checking && (
                  <div style={{ 
                    padding: '16px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #91d5ff'
                  }}>
                    <Space direction="vertical" align="center">
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                      <Text style={{ color: '#1890ff' }}>
                        Waiting for signature...
                      </Text>
                    </Space>
                  </div>
                )}

                <Button type="link" onClick={() => window.open(`mailto:${driverEmail}`)}>
                  Resend Email
                </Button>
              </Space>
            }
          />
        </Card>
      </div>
    );
  }

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
          maxWidth: '600px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <FileTextOutlined style={{ fontSize: '72px', color: '#ff7a00', marginBottom: '16px' }} />
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              Sign your Crave'n Driver Agreement
            </Title>
            <Paragraph style={{ fontSize: '16px', color: '#595959', marginTop: '8px' }}>
              Review and sign your Independent Contractor Agreement via DocuSign
            </Paragraph>
          </div>

          <Alert
            message="What's in the agreement?"
            description={
              <ul style={{ textAlign: 'left', margin: '8px 0', paddingLeft: '20px' }}>
                <li>Independent contractor relationship terms</li>
                <li>Payment structure and schedule</li>
                <li>Service expectations and standards</li>
                <li>Insurance and liability requirements</li>
                <li>Termination and dispute resolution</li>
              </ul>
            }
            type="info"
            showIcon
          />

          <div style={{ 
            padding: '20px',
            background: '#fffbeb',
            borderRadius: '8px',
            border: '1px solid #fde047'
          }}>
            <Text strong style={{ color: '#854d0e' }}>
              ✨ Digital Signature
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '14px' }}>
              We use DocuSign for secure, legally-binding electronic signatures. 
              The agreement will be sent to your email.
            </Text>
          </div>

          <Button 
            type="primary" 
            size="large"
            loading={loading}
            onClick={sendAgreement}
            icon={<SendOutlined />}
            block
            style={{
              height: '60px',
              fontSize: '20px',
              fontWeight: 'bold',
              borderRadius: '8px'
            }}
          >
            Sign Agreement
          </Button>

          <Text type="secondary" style={{ fontSize: '12px' }}>
            By clicking "Sign Agreement", a DocuSign envelope will be sent to {driverEmail || 'your email'}
          </Text>
        </Space>
      </Card>
    </div>
  );
};

