// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Result, Button, Alert, Statistic, Row, Col, Tag } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, EnvironmentOutlined, TeamOutlined, BellOutlined, LoadingOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface WaitlistInfo {
  position: number;
  zoneCity: string;
  zoneState: string;
  zoneCapacity: number;
  currentDrivers: number;
}

export const WaitlistReveal: React.FC = () => {
  const [driverId, setDriverId] = useState<string>('');
  const [waitlistInfo, setWaitlistInfo] = useState<WaitlistInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const id = location.state?.driverId;
    if (!id) {
      navigate('/driver-onboarding/signup');
      return;
    }
    setDriverId(id);
    fetchWaitlistInfo(id);
  }, [location, navigate]);

  const fetchWaitlistInfo = async (id: string) => {
    try {
      // Get driver and zone info
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id, zone_id')
        .eq('id', id)
        .single();

      if (driverError || !driver) {
        throw new Error('Driver not found');
      }

      // Get waitlist position
      const { data: waitlist, error: waitlistError } = await supabase
        .from('driver_waitlist')
        .select('position, zone_id')
        .eq('driver_id', id)
        .single();

      if (waitlistError) {
        console.error('Waitlist error:', waitlistError);
      }

      // Get zone details
      const { data: zone, error: zoneError } = await supabase
        .from('zones')
        .select('city, state, capacity, active_drivers')
        .eq('id', driver.zone_id)
        .single();

      if (zoneError) {
        throw zoneError;
      }

      setWaitlistInfo({
        position: waitlist?.position || 1,
        zoneCity: zone.city,
        zoneState: zone.state,
        zoneCapacity: zone.capacity,
        currentDrivers: zone.active_drivers
      });

    } catch (error: any) {
      console.error('Fetch waitlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card>
          <Space>
            <LoadingOutlined style={{ fontSize: 24 }} spin />
            <Text>Loading waitlist information...</Text>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <Card
        style={{
          maxWidth: '700px',
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Result
            icon={<ClockCircleOutlined style={{ color: '#faad14', fontSize: '72px' }} />}
            title="You're approved and signed!"
            subTitle={`Your area is currently full. You're on our priority waitlist.`}
            extra={
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Card style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                      <Statistic
                        title="Waitlist Position"
                        value={waitlistInfo?.position}
                        prefix="#"
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                      <Statistic
                        title="Zone Capacity"
                        value={`${waitlistInfo?.currentDrivers}/${waitlistInfo?.zoneCapacity}`}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                      <div style={{ padding: '8px 0' }}>
                        <EnvironmentOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>{waitlistInfo?.zoneCity}, {waitlistInfo?.zoneState}</Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Alert
                  message="What happens next?"
                  description={
                    <ul style={{ textAlign: 'left', margin: '8px 0', paddingLeft: '20px' }}>
                      <li>You'll receive email notifications when new spots open</li>
                      <li>Drivers are activated in waitlist order</li>
                      <li>Most drivers are activated within 2-4 weeks</li>
                      <li>You can check your status anytime in your driver dashboard</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />

                <div style={{ 
                  padding: '20px',
                  background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                  borderRadius: '12px',
                  border: '1px solid #0ea5e9'
                }}>
                  <Space direction="vertical" align="center">
                    <BellOutlined style={{ fontSize: '32px', color: '#0ea5e9' }} />
                    <Text strong style={{ fontSize: '16px', color: '#0c4a6e' }}>
                      We'll notify you immediately when a spot opens!
                    </Text>
                    <Text type="secondary">
                      Check your email regularly for updates
                    </Text>
                  </Space>
                </div>

                <Button 
                  type="primary" 
                  size="large"
                  onClick={() => navigate('/driver-dashboard')}
                  style={{
                    height: '50px',
                    fontSize: '16px',
                    borderRadius: '8px'
                  }}
                >
                  Go to Driver Dashboard
                </Button>
              </Space>
            }
          />
        </Space>
      </Card>
    </div>
  );
};

