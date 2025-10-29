import React, { useEffect, useState } from 'react';
import { ConfigProvider, Card, Row, Col, Statistic, Badge, Avatar, Spin, Tabs, Button, Space } from 'antd';
import {
  ArrowUpOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ExecutiveDirectory } from '@/components/board/ExecutiveDirectory';
import { ExecutiveComms } from '@/components/board/ExecutiveComms';
import { executiveTheme } from '@/config/antd-theme';
import { useExecAuth } from '@/hooks/useExecAuth';

interface DashboardMetrics {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersChange: number;
  activeFeeders: number;
  feedersChange: number;
  profitMargin: number;
  utilization: number;
  totalEmployees: number;
  pendingApprovals: number;
}

const BoardPortal: React.FC = () => {
  const navigate = useNavigate();
  const { loading, user, execUser, isAuthorized, signOut } = useExecAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('communications');

  useEffect(() => {
    if (isAuthorized) {
      fetchDashboardMetrics();
    }
  }, [isAuthorized]);

  const fetchDashboardMetrics = async () => {
    try {
      // Simplified metrics - only fetch what exists
      setMetrics({
        revenue: 0,
        revenueChange: 0,
        orders: 0,
        ordersChange: 0,
        activeFeeders: 0,
        feedersChange: 0,
        profitMargin: 0,
        utilization: 0,
        totalEmployees: 0,
        pendingApprovals: 0,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics({
        revenue: 0,
        revenueChange: 0,
        orders: 0,
        ordersChange: 0,
        activeFeeders: 0,
        feedersChange: 0,
        profitMargin: 0,
        utilization: 0,
        totalEmployees: 0,
        pendingApprovals: 0,
      });
    }
  };

  if (loading) {
    return (
      <ConfigProvider theme={executiveTheme}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Spin size="large" />
            <p className="mt-4 text-slate-600 dark:text-slate-400">Loading Executive Portal...</p>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  if (!isAuthorized) {
    return (
      <ConfigProvider theme={executiveTheme}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-2xl">
            <SafetyOutlined className="text-6xl text-red-500 mb-6" />
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Executive Access Required
            </h1>
            <p className="text-slate-600 text-lg mb-4">
              This portal is restricted to board members and C-suite executives only.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Logged in as: <span className="font-semibold">{user?.email}</span>
            </p>
            <Space>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Return Home
              </button>
              <button
                onClick={signOut}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Sign Out
              </button>
            </Space>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={executiveTheme}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Executive Board Portal
                </h1>
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  Welcome back, <strong>{execUser?.title || user?.email?.split('@')[0]}</strong> • {execUser?.role?.toUpperCase()}
                  <Badge status="processing" text="Live Data" />
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button type="default" onClick={() => navigate('/ceo')}>
                  CEO Portal
                </Button>
                <Button onClick={signOut}>Sign Out</Button>
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
              <Card bordered={false} className="shadow-lg hover:shadow-xl transition-all duration-300">
                <Statistic
                  title={<span className="text-slate-600 font-medium text-sm">Total Revenue</span>}
                  value={metrics?.revenue}
                  precision={2}
                  prefix={<DollarOutlined className="text-blue-600" />}
                  valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}
                  suffix={
                    <span className="text-sm text-green-600 font-semibold ml-2">
                      <ArrowUpOutlined /> {metrics?.revenueChange}%
                    </span>
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-lg hover:shadow-xl transition-all duration-300">
                <Statistic
                  title={<span className="text-slate-600 font-medium text-sm">Total Orders</span>}
                  value={metrics?.orders}
                  prefix={<ShoppingOutlined className="text-purple-600" />}
                  valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}
                  suffix={
                    <span className="text-sm text-green-600 font-semibold ml-2">
                      <ArrowUpOutlined /> {metrics?.ordersChange}%
                    </span>
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-lg hover:shadow-xl transition-all duration-300">
                <Statistic
                  title={<span className="text-slate-600 font-medium text-sm">Employees</span>}
                  value={metrics?.totalEmployees}
                  prefix={<TeamOutlined className="text-orange-600" />}
                  valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card bordered={false} className="shadow-lg hover:shadow-xl transition-all duration-300">
                <Statistic
                  title={<span className="text-slate-600 font-medium text-sm">Net Profit Margin</span>}
                  value={metrics?.profitMargin}
                  precision={1}
                  suffix="%"
                  valueStyle={{ fontSize: '28px', fontWeight: 'bold', color: '#059669' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Tabbed Interface */}
          <Card className="shadow-2xl">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size="large"
              items={[
                {
                  key: 'communications',
                  label: (
                    <span>
                      <UserOutlined />
                      Communications
                    </span>
                  ),
                  children: <ExecutiveComms />,
                },
                {
                  key: 'dashboard',
                  label: (
                    <span>
                      <BarChartOutlined />
                      Dashboard
                    </span>
                  ),
                  children: (
                    <div className="p-4">
                      <h3 className="text-xl font-bold mb-4">Company Overview</h3>
                      <div className="text-center py-12">
                        <p className="text-slate-600 mb-4">Dashboard metrics will be available once the database tables are configured.</p>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'directory',
                  label: (
                    <span>
                      <TeamOutlined />
                      Directory
                    </span>
                  ),
                  children: <ExecutiveDirectory />,
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default BoardPortal;
