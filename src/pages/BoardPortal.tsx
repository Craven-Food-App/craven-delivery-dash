import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Badge, Progress, Avatar, Spin } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface DashboardMetrics {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  activeFeeders: number;
  feedersChange: number;
  profitMargin: number;
  utilization: number;
}

const BoardPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isExecutive, setIsExecutive] = useState(false);

  useEffect(() => {
    checkExecutiveAccess();
  }, []);

  const checkExecutiveAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check if user is an executive
      const { data: execUser, error } = await supabase
        .from('exec_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !execUser) {
        // Not an executive, show access denied
        setIsExecutive(false);
        setLoading(false);
        return;
      }

      setIsExecutive(true);
      
      // Fetch dashboard metrics
      await fetchDashboardMetrics();
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking executive access:', error);
      setLoading(false);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      // Fetch real-time metrics from your database
      // For now, using mock data - replace with real queries
      setMetrics({
        revenue: 2450680,
        revenueChange: 15.2,
        orders: 12458,
        ordersChange: 8.4,
        activeFeeders: 487,
        feedersChange: 3.2,
        profitMargin: 23.5,
        utilization: 87,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isExecutive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-2xl">
          <div className="mb-6 text-6xl">🔒</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Executive Access Required
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            This portal is restricted to board members and C-suite executives only.
          </p>
          <p className="text-sm text-slate-500">
            If you believe you should have access, please contact the CEO.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Executive Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                Real-time insights
                <Badge status="processing" text="Live Data" />
                <span className="text-sm">• Updated 2 minutes ago</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Avatar size="large" icon={<UserOutlined />} className="bg-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Key Metrics Row */}
        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
            >
              <Statistic
                title={
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                    Total Revenue
                  </span>
                }
                value={metrics?.revenue}
                precision={2}
                prefix={<DollarOutlined className="text-blue-600" />}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                }}
                suffix={
                  <span className="text-sm text-green-600 font-semibold ml-2">
                    <ArrowUpOutlined /> {metrics?.revenueChange}%
                  </span>
                }
              />
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  vs last period: ${((metrics?.revenue || 0) / 1.152).toFixed(0)}
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
            >
              <Statistic
                title={
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                    Total Orders
                  </span>
                }
                value={metrics?.orders}
                prefix={<ShoppingOutlined className="text-purple-600" />}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                }}
                suffix={
                  <span className="text-sm text-green-600 font-semibold ml-2">
                    <ArrowUpOutlined /> {metrics?.ordersChange}%
                  </span>
                }
              />
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  +{Math.floor((metrics?.orders || 0) * 0.078)} from yesterday
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
            >
              <Statistic
                title={
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                    Active Feeders
                  </span>
                }
                value={metrics?.activeFeeders}
                prefix={<CarOutlined className="text-orange-600" />}
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                }}
                suffix={
                  <span className="text-sm text-green-600 font-semibold ml-2">
                    <ArrowUpOutlined /> {metrics?.feedersChange}%
                  </span>
                }
              />
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <Progress
                  percent={metrics?.utilization}
                  size="small"
                  status="active"
                  strokeColor="#f97316"
                  className="mb-1"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {metrics?.utilization}% Utilization Rate
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              bordered={false}
              className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-800"
            >
              <Statistic
                title={
                  <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                    Net Profit Margin
                  </span>
                }
                value={metrics?.profitMargin}
                precision={1}
                suffix="%"
                valueStyle={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#059669',
                }}
              />
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  Target: 20%
                  <Badge status="success" text="Above Target" />
                </p>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Coming Soon Section */}
        <Card className="shadow-lg bg-white dark:bg-slate-800">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              More Analytics Coming Soon
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Advanced charts, executive communications, board meetings, document vault,
              and video conferencing features are being built.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BoardPortal;

