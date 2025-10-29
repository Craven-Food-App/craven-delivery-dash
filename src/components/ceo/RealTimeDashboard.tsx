import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Statistic, Typography, Space, Progress, 
  Badge, Alert, Timeline, Avatar, Tag, Button, Tooltip,
  Table, Divider
} from 'antd';
import {
  ThunderboltOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  MobileOutlined,
  DesktopOutlined,
  HeartOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface LiveMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

interface SystemAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export const RealTimeDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<LiveMetric[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(dayjs());

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    setLoading(true);
    try {
      // Fetch real-time metrics
      const [ordersRes, employeesRes, revenueRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, created_at').gte('created_at', dayjs().subtract(1, 'hour').toISOString()),
        supabase.from('employees').select('id, employment_status').eq('employment_status', 'active'),
        supabase.from('orders').select('total_amount').gte('created_at', dayjs().subtract(24, 'hours').toISOString())
      ]);

      const orders = ordersRes.data || [];
      const employees = employeesRes.data || [];
      const revenue = revenueRes.data || [];

      const liveMetrics: LiveMetric[] = [
        {
          id: 'revenue',
          name: 'Hourly Revenue',
          value: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          change: 12.5,
          trend: 'up',
          status: 'good',
          lastUpdated: dayjs().format('HH:mm:ss')
        },
        {
          id: 'orders',
          name: 'Orders/Hour',
          value: orders.length,
          change: 8.3,
          trend: 'up',
          status: 'good',
          lastUpdated: dayjs().format('HH:mm:ss')
        },
        {
          id: 'employees',
          name: 'Active Staff',
          value: employees.length,
          change: 0,
          trend: 'stable',
          status: 'good',
          lastUpdated: dayjs().format('HH:mm:ss')
        },
        {
          id: 'system',
          name: 'System Health',
          value: 99.2,
          change: -0.1,
          trend: 'down',
          status: 'warning',
          lastUpdated: dayjs().format('HH:mm:ss')
        }
      ];

      setMetrics(liveMetrics);

      // Generate sample alerts
      const sampleAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'success',
          title: 'Peak Performance',
          message: 'Revenue exceeded target by 15% this hour',
          timestamp: dayjs().subtract(5, 'minutes').format('HH:mm'),
          resolved: false
        },
        {
          id: '2',
          type: 'warning',
          title: 'High Load',
          message: 'Server response time increased to 2.3s',
          timestamp: dayjs().subtract(12, 'minutes').format('HH:mm'),
          resolved: false
        },
        {
          id: '3',
          type: 'info',
          title: 'New Employee',
          message: 'Justin Sweet joined as CFO',
          timestamp: dayjs().subtract(1, 'hour').format('HH:mm'),
          resolved: true
        }
      ];

      setAlerts(sampleAlerts);
      setLastRefresh(dayjs());
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'good': return '#52c41a';
      case 'warning': return '#faad14';
      case 'critical': return '#f5222d';
      default: return '#1890ff';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUpOutlined style={{ color: '#52c41a' }} />;
      case 'down': return <TrendingDownOutlined style={{ color: '#f5222d' }} />;
      default: return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'error': return <FireOutlined style={{ color: '#f5222d' }} />;
      default: return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              <ThunderboltOutlined style={{ marginRight: '8px', color: '#faad14' }} />
              Real-Time Dashboard
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Live business metrics and system monitoring
            </Text>
          </div>
          <Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last updated: {lastRefresh.format('HH:mm:ss')}
            </Text>
            <Button 
              type="primary" 
              size="small" 
              onClick={fetchLiveData}
              loading={loading}
              style={{ borderRadius: '6px' }}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Live Metrics Grid */}
        <Row gutter={[16, 16]}>
          {metrics.map(metric => (
            <Col xs={24} sm={12} lg={6} key={metric.id}>
              <Card 
                hoverable
                style={{ 
                  borderRadius: '12px',
                  border: `2px solid ${getMetricColor(metric.status)}20`,
                  background: `linear-gradient(135deg, ${getMetricColor(metric.status)}10, ${getMetricColor(metric.status)}05)`
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {metric.name}
                    </Text>
                    <Badge 
                      dot 
                      style={{ backgroundColor: getMetricColor(metric.status) }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <Text strong style={{ fontSize: '32px', color: getMetricColor(metric.status) }}>
                      {metric.id === 'revenue' ? `$${metric.value.toLocaleString()}` : 
                       metric.id === 'system' ? `${metric.value}%` : metric.value}
                    </Text>
                    <Space size={4}>
                      {getTrendIcon(metric.trend)}
                      <Text 
                        type={metric.trend === 'up' ? 'success' : metric.trend === 'down' ? 'danger' : 'secondary'}
                        style={{ fontSize: '12px' }}
                      >
                        {metric.change > 0 ? '+' : ''}{metric.change}%
                      </Text>
                    </Space>
                  </div>

                  {metric.id === 'system' && (
                    <Progress 
                      percent={metric.value} 
                      showInfo={false} 
                      strokeColor={getMetricColor(metric.status)}
                      style={{ marginTop: '8px' }}
                    />
                  )}

                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Updated: {metric.lastUpdated}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* System Status Overview */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card 
              title={
                <Space>
                  <GlobalOutlined style={{ color: '#1890ff' }} />
                  <Text strong>System Status</Text>
                </Space>
              }
              style={{ borderRadius: '12px' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={48} 
                      style={{ backgroundColor: '#52c41a', marginBottom: '8px' }}
                      icon={<DesktopOutlined />}
                    />
                    <div>
                      <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>99.9%</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Web Platform</Text>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={48} 
                      style={{ backgroundColor: '#52c41a', marginBottom: '8px' }}
                      icon={<MobileOutlined />}
                    />
                    <div>
                      <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>99.7%</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>Mobile App</Text>
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Avatar 
                      size={48} 
                      style={{ backgroundColor: '#faad14', marginBottom: '8px' }}
                      icon={<HeartOutlined />}
                    />
                    <div>
                      <Text strong style={{ fontSize: '18px', color: '#faad14' }}>98.2%</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>API Services</Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card 
              title={
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  <Text strong>Live Alerts</Text>
                </Space>
              }
              style={{ borderRadius: '12px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {alerts.slice(0, 3).map(alert => (
                  <Alert
                    key={alert.id}
                    type={alert.type}
                    message={alert.title}
                    description={alert.message}
                    icon={getAlertIcon(alert.type)}
                    showIcon
                    style={{ fontSize: '12px' }}
                    action={
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        {alert.timestamp}
                      </Text>
                    }
                  />
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Performance Timeline */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#722ed1' }} />
              <Text strong>Performance Timeline</Text>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Timeline
            items={[
              {
                color: 'green',
                children: (
                  <div>
                    <Text strong>Revenue Peak</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      $12,450 in the last hour - 15% above target
                    </Text>
                  </div>
                ),
              },
              {
                color: 'blue',
                children: (
                  <div>
                    <Text strong>New Employee Onboarded</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Justin Sweet joined as CFO
                    </Text>
                  </div>
                ),
              },
              {
                color: 'orange',
                children: (
                  <div>
                    <Text strong>System Maintenance</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Scheduled maintenance completed successfully
                    </Text>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </div>
  );
};
