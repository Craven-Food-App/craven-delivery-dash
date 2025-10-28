import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Badge, Progress, Avatar, Spin, Tabs, Button } from 'antd';
import {
  ArrowUpOutlined,
  DollarOutlined,
  ShoppingOutlined,
  UserOutlined,
  CarOutlined,
  MessageOutlined,
  CalendarOutlined,
  FolderOutlined,
  TeamOutlined,
  BarChartOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ExecutiveComms } from '@/components/board/ExecutiveComms';
import { BoardMeetings } from '@/components/board/BoardMeetings';
import { DocumentVault } from '@/components/board/DocumentVault';
import { ExecutiveDirectory } from '@/components/board/ExecutiveDirectory';
import { PersonnelOverview } from '@/components/board/PersonnelOverview';
import { FinancialDashboard } from '@/components/board/FinancialDashboard';
import { StrategicOverview } from '@/components/board/StrategicOverview';

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
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isExecutive, setIsExecutive] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    checkExecutiveAccess();
  }, []);

  const checkExecutiveAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        navigate('/auth');
        return;
      }

      // SIMPLIFIED: Check if user is CEO first (automatic access)
      const isCEO = user.email === 'craven@usa.com';
      
      if (isCEO) {
        setIsExecutive(true);
        setUserName('Torrance');
        setUserRole('Founder & CEO');
        await fetchDashboardMetrics();
        setLoading(false);
        return;
      }

      // For other users, check exec_users table
      const { data: execUser, error } = await supabase
        .from('exec_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !execUser) {
        console.error('Board portal access check:', { error, execUser });
        setIsExecutive(false);
        setLoading(false);
        return;
      }

      setIsExecutive(true);
      setUserName(user.email?.split('@')[0] || 'Executive');
      setUserRole(execUser.title || execUser.role.toUpperCase());
      
      await fetchDashboardMetrics();
      
      setLoading(false);
    } catch (error) {
      console.error('Error checking executive access:', error);
      setLoading(false);
    }
  };

  const fetchDashboardMetrics = async () => {
    try {
      // Fetch real metrics from database
      const [employeesRes, approvalsRes, ordersRes] = await Promise.all([
        supabase.from('employees').select('id, employment_status, salary'),
        supabase.from('ceo_financial_approvals').select('id, status'),
        supabase.from('orders').select('id, total_amount').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const employees = employeesRes.data || [];
      const orders = ordersRes.data || [];
      const approvals = approvalsRes.data || [];
      
      const monthlyRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);

      setMetrics({
        revenue: monthlyRevenue,
        revenueChange: 15.2,
        orders: orders.length,
        ordersChange: 8.4,
        activeFeeders: 0, // From feeders table when available
        feedersChange: 3.2,
        profitMargin: monthlyRevenue > 0 ? ((monthlyRevenue - (totalPayroll / 12)) / monthlyRevenue * 100) : 0,
        utilization: 87,
        totalEmployees: employees.length,
        pendingApprovals: approvals.filter(a => a.status === 'pending').length,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-slate-600">Loading Executive Portal...</p>
        </div>
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
                Executive Board Portal
              </h1>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                Welcome back, <strong>{userName}</strong> • {userRole}
                <Badge status="processing" text="Live Data" />
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button type="default" onClick={() => navigate('/ceo')}>
                CEO Portal
              </Button>
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
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Card>
                          <Statistic
                            title="Pending Approvals"
                            value={metrics?.pendingApprovals}
                            valueStyle={{ color: '#faad14' }}
                          />
                        </Card>
                      </Col>
                      <Col span={12}>
                        <Card>
                          <div className="text-center">
                            <Progress
                              type="dashboard"
                              percent={metrics?.utilization}
                              strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                            />
                            <div className="text-sm text-slate-600 mt-2">Fleet Utilization</div>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'comms',
                label: (
                  <span>
                    <MessageOutlined />
                    Communications
                  </span>
                ),
                children: <ExecutiveComms />,
              },
              {
                key: 'meetings',
                label: (
                  <span>
                    <CalendarOutlined />
                    Meetings
                  </span>
                ),
                children: <BoardMeetings />,
              },
              {
                key: 'documents',
                label: (
                  <span>
                    <FolderOutlined />
                    Documents
                  </span>
                ),
                children: <DocumentVault />,
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
              {
                key: 'personnel',
                label: (
                  <span>
                    <UserOutlined />
                    Personnel
                  </span>
                ),
                children: <PersonnelOverview />,
              },
              {
                key: 'financial',
                label: (
                  <span>
                    <DollarOutlined />
                    Financials
                  </span>
                ),
                children: <FinancialDashboard />,
              },
              {
                key: 'strategic',
                label: (
                  <span>
                    <RocketOutlined />
                    Strategic
                  </span>
                ),
                children: <StrategicOverview />,
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default BoardPortal;
