// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Result, Button, Alert, Row, Col, Statistic } from 'antd';
import { CheckCircleOutlined, ThunderboltOutlined, DollarOutlined, TrophyOutlined, RocketOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

export const ActivationReady: React.FC = () => {
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = location.state?.driverId;
    if (!id) {
      navigate('/driver-onboarding/signup');
      return;
    }
    setDriverId(id);
    fetchDriverInfo(id);
  }, [location, navigate]);

  const fetchDriverInfo = async (id: string) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('full_name, status')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Fetch driver error:', error);
      return;
    }

    setDriverName(data.full_name);

    // If not yet active, activate them now
    if (data.status !== 'active') {
      await activateDriver(id);
    }
  };

  const activateDriver = async (id: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Activation error:', error);
    }
  };

  const startDelivering = async () => {
    setLoading(true);
    // In real app, this would configure their driver profile and navigate to driver app
    setTimeout(() => {
      navigate('/driver-dashboard');
    }, 1000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
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
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: '96px' }} />}
            title={
              <Title level={1} style={{ color: '#22c55e', margin: '16px 0' }}>
                Welcome aboard, {driverName?.split(' ')[0] || 'Driver'}!
              </Title>
            }
            subTitle={
              <Text style={{ fontSize: '18px', color: '#595959' }}>
                You're ready to start accepting orders
              </Text>
            }
            extra={
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* Key Stats */}
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card style={{ background: '#f0f9ff', border: '1px solid #91d5ff', borderRadius: '8px' }}>
                      <Statistic
                        title="Average Earnings"
                        value={24}
                        prefix={<DollarOutlined />}
                        suffix="/hour"
                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: '8px' }}>
                      <Statistic
                        title="Peak Hours"
                        value="11AM-2PM"
                        valueStyle={{ color: '#f59e0b', fontSize: '20px' }}
                        prefix={<ThunderboltOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px' }}>
                      <Statistic
                        title="Bonus Available"
                        value="$500"
                        valueStyle={{ color: '#ef4444', fontSize: '24px' }}
                        prefix={<TrophyOutlined />}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Getting Started Guide */}
                <Alert
                  message="Getting Started - First 3 Steps"
                  description={
                    <ol style={{ textAlign: 'left', margin: '12px 0', paddingLeft: '20px' }}>
                      <li style={{ marginBottom: '8px' }}>
                        <Text strong>Download the Crave'n Driver App</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Available on iOS and Android</Text>
                      </li>
                      <li style={{ marginBottom: '8px' }}>
                        <Text strong>Complete Your Profile</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Add vehicle info, bank details, and profile photo</Text>
                      </li>
                      <li style={{ marginBottom: '8px' }}>
                        <Text strong>Go Online</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>Start accepting deliveries immediately</Text>
                      </li>
                    </ol>
                  }
                  type="success"
                  showIcon
                  icon={<RocketOutlined />}
                />

                {/* Pro Tips */}
                <div style={{ 
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  borderRadius: '12px',
                  border: '1px solid #0ea5e9',
                  textAlign: 'left'
                }}>
                  <Text strong style={{ fontSize: '16px', color: '#0c4a6e' }}>
                    💡 Pro Tips for Success
                  </Text>
                  <ul style={{ margin: '12px 0', paddingLeft: '20px' }}>
                    <li><Text type="secondary">Work during lunch and dinner rushes for maximum earnings</Text></li>
                    <li><Text type="secondary">Maintain a 4.8+ rating to receive priority deliveries</Text></li>
                    <li><Text type="secondary">Complete 100 deliveries in your first month for a $500 bonus</Text></li>
                  </ul>
                </div>

                <Button 
                  type="primary" 
                  size="large"
                  loading={loading}
                  onClick={startDelivering}
                  icon={<ThunderboltOutlined />}
                  block
                  style={{
                    height: '60px',
                    fontSize: '20px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #ff7a00, #ff9f40)',
                    border: 'none'
                  }}
                >
                  Start Delivering
                </Button>

                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Need help? Contact support at <Button type="link" style={{ padding: 0 }}>support@cravenusa.com</Button>
                </Text>
              </Space>
            }
          />
        </Space>
      </Card>
    </div>
  );
};

