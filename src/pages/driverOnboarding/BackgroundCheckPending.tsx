import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, Result, Progress, message } from 'antd';
import { LoadingOutlined, CheckCircleOutlined, SafetyOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export const BackgroundCheckPending: React.FC = () => {
  const [driverId, setDriverId] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [checkStatus, setCheckStatus] = useState<string>('pending');
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

  useEffect(() => {
    if (!driverId) return;

    // Simulate background check progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    // Poll for background check completion
    const pollInterval = setInterval(async () => {
      const { data, error } = await supabase
        .from('driver_background_checks')
        .select('status')
        .eq('driver_id', driverId)
        .single();

      if (error) {
        console.error('Background check poll error:', error);
        return;
      }

      setCheckStatus(data.status);

      if (data.status === 'clear') {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        setProgress(100);
        
        // Auto-clear background check after 3 seconds (for demo)
        setTimeout(async () => {
          // Update driver status
          await supabase
            .from('drivers')
            .update({
              status: 'pending_check',
              updated_at: new Date().toISOString()
            })
            .eq('id', driverId);

          // Navigate to DocuSign screen
          navigate('/driver-onboarding/sign-agreement', {
            state: { driverId }
          });
        }, 2000);
      } else if (data.status === 'rejected' || data.status === 'flagged') {
        clearInterval(pollInterval);
        clearInterval(progressInterval);
        message.error('Background check did not pass. Please contact support.');
      }
    }, 2000);

    // Auto-approve for demo (simulates background check completing)
    setTimeout(async () => {
      await supabase
        .from('driver_background_checks')
        .update({ status: 'clear', completed_at: new Date().toISOString() })
        .eq('driver_id', driverId);
    }, 5000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(pollInterval);
    };
  }, [driverId, navigate]);

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
          {checkStatus === 'clear' ? (
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '72px' }} />}
              title="Background Check Complete"
              subTitle="Your verification passed successfully!"
              extra={
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              }
            />
          ) : (
            <>
              <div>
                <Spin 
                  indicator={<LoadingOutlined style={{ fontSize: 72, color: '#ff7a00' }} spin />} 
                />
              </div>

              <div>
                <Title level={2} style={{ margin: 0, color: '#262626' }}>
                  Verifying your info…
                </Title>
                <Paragraph style={{ fontSize: '16px', color: '#595959', marginTop: '8px' }}>
                  This usually takes a few minutes
                </Paragraph>
              </div>

              <div style={{ width: '100%', padding: '0 40px' }}>
                <Progress 
                  percent={progress} 
                  strokeColor="#ff7a00"
                  trailColor="#f0f0f0"
                  strokeWidth={10}
                  style={{ marginBottom: '16px' }}
                />
                <Text type="secondary" style={{ fontSize: '14px' }}>
                  {progress < 50 ? 'Verifying identity...' :
                   progress < 80 ? 'Checking driving records...' :
                   progress < 100 ? 'Finalizing verification...' :
                   'Complete!'}
                </Text>
              </div>

              <Alert
                message="What we're checking"
                description={
                  <ul style={{ margin: '8px 0', paddingLeft: '20px', textAlign: 'left' }}>
                    <li>Identity verification</li>
                    <li>Driving record review</li>
                    <li>Criminal background check (per FCRA)</li>
                    <li>Motor vehicle records</li>
                  </ul>
                }
                type="info"
                showIcon
                icon={<SafetyOutlined />}
              />

              <div style={{ 
                padding: '16px',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #91d5ff'
              }}>
                <Text strong style={{ color: '#1890ff' }}>
                  💡 Tip: Keep this window open
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  You'll be redirected automatically when verification is complete
                </Text>
              </div>
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

