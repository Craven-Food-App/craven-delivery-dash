import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Badge, Button, Space, Tabs, Alert } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  RocketOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FileTextOutlined,
  BarChartOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PersonnelManager } from '@/components/ceo/PersonnelManager';
import { FinancialApprovals } from '@/components/ceo/FinancialApprovals';
import { EmergencyControls } from '@/components/ceo/EmergencyControls';
import { StrategicPlanning } from '@/components/ceo/StrategicPlanning';
import { AuditTrail } from '@/components/ceo/AuditTrail';
import { QuickActions } from '@/components/ceo/QuickActions';
import { CEOPinAuth } from '@/components/ceo/CEOPinAuth';

const { TabPane } = Tabs;

interface CEOMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  cashFlow: number;
  burnRate: number;
  runway: number;
  totalEmployees: number;
  admins: number;
  feeders: number;
  merchants: number;
  pendingApprovals: number;
  criticalAlerts: number;
}

const CEOPortal: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pinAuthenticated, setPinAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [metrics, setMetrics] = useState<CEOMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || !user.email) {
        navigate('/auth');
        return;
      }

      // Check if user is authorized CEO (email in whitelist)
      const { data: credentials } = await supabase
        .from('ceo_access_credentials')
        .select('user_email')
        .eq('user_email', user.email)
        .single();

      if (!credentials) {
        // Not authorized
        navigate('/');
        return;
      }

      setUserEmail(user.email);
      setUserName(user.email.split('@')[0] || 'CEO');
      setLoading(false);
    } catch (error) {
      console.error('Error checking initial auth:', error);
      navigate('/');
    }
  };

  const handlePinSuccess = async () => {
    setPinAuthenticated(true);
    await fetchCEOMetrics();
  };

  const fetchCEOMetrics = async () => {
    try {
      // In production, these would be real-time queries
      // For now, using calculated/mock data
      setMetrics({
        totalRevenue: 2450680,
        revenueGrowth: 15.2,
        cashFlow: 847000,
        burnRate: 124000,
        runway: 18,
        totalEmployees: 234,
        admins: 12,
        feeders: 487,
        merchants: 156,
        pendingApprovals: 3,
        criticalAlerts: 0,
      });
    } catch (error) {
      console.error('Error fetching CEO metrics:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Initializing Security Protocol...</p>
        </div>
      </div>
    );
  }

  // Show PIN authentication screen if not authenticated
  if (!pinAuthenticated) {
    return <CEOPinAuth onSuccess={handlePinSuccess} userEmail={userEmail} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header - Command Center Style */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 border-b-4 border-blue-500 shadow-2xl">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ThunderboltOutlined className="text-4xl text-yellow-400" />
                <h1 className="text-4xl font-bold text-white">
                  CEO COMMAND CENTER
                </h1>
              </div>
              <p className="text-blue-200 flex items-center gap-3 text-lg">
                <span>Welcome back, <strong>{userName}</strong></span>
                <Badge status="processing" text="System Operational" className="text-white" />
                <span className="text-sm">• All Systems Online</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="primary"
                danger
                size="large"
                icon={<WarningOutlined />}
                className="bg-red-600 hover:bg-red-700"
              >
                Emergency
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/admin')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Admin Portal
              </Button>
              <Button
                type="default"
                size="large"
                onClick={() => navigate('/board')}
                className="bg-slate-700 hover:bg-slate-600 text-white"
              >
                Board Portal
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts */}
      {metrics?.criticalAlerts! > 0 && (
        <div className="container mx-auto px-6 py-4">
          <Alert
            message={`${metrics?.criticalAlerts} Critical Alert${metrics?.criticalAlerts! > 1 ? 's' : ''}`}
            description="Immediate action required. Click to view details."
            type="error"
            showIcon
            icon={<WarningOutlined />}
            className="border-2 border-red-500"
            action={
              <Button size="small" danger>
                View Now
              </Button>
            }
          />
        </div>
      )}

      {/* Main Dashboard */}
      <div className="container mx-auto px-6 py-8">
        {/* Key Metrics - Company Health */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col xs={24} sm={12} lg={4}>
            <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <Statistic
                title={<span className="text-white font-semibold">Total Revenue</span>}
                value={metrics?.totalRevenue}
                precision={0}
                prefix="$"
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                suffix={
                  <span className="text-sm text-green-100 ml-2">
                    ↑ {metrics?.revenueGrowth}%
                  </span>
                }
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <Statistic
                title={<span className="text-white font-semibold">Cash Flow</span>}
                value={metrics?.cashFlow}
                precision={0}
                prefix="$"
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              />
              <div className="text-xs text-blue-100 mt-2">
                Burn: ${metrics?.burnRate.toLocaleString()}/mo
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <Statistic
                title={<span className="text-white font-semibold">Runway</span>}
                value={metrics?.runway}
                suffix="months"
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              />
              <div className="text-xs text-purple-100 mt-2">
                Financial Health: Excellent
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <Statistic
                title={<span className="text-white font-semibold">Total Employees</span>}
                value={metrics?.totalEmployees}
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              />
              <div className="text-xs text-orange-100 mt-2">
                Admins: {metrics?.admins} • Feeders: {metrics?.feeders}
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="bg-gradient-to-br from-yellow-600 to-yellow-700 border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <Statistic
                title={<span className="text-white font-semibold">Pending Approvals</span>}
                value={metrics?.pendingApprovals}
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              />
              <div className="text-xs text-yellow-100 mt-2">
                Requires your attention
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={4}>
            <Card className="bg-gradient-to-br from-teal-600 to-teal-700 border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <Statistic
                title={<span className="text-white font-semibold">Merchants</span>}
                value={metrics?.merchants}
                valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
              />
              <div className="text-xs text-teal-100 mt-2">
                Active partners
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tabbed Interface */}
        <Card className="shadow-2xl">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="large"
            tabBarStyle={{ borderBottom: '2px solid #e2e8f0' }}
          >
            <TabPane
              tab={
                <span>
                  <BarChartOutlined />
                  Quick Actions
                </span>
              }
              key="overview"
            >
              <QuickActions />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <TeamOutlined />
                  Personnel ({metrics?.totalEmployees})
                </span>
              }
              key="personnel"
            >
              <PersonnelManager />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <DollarOutlined />
                  Financial Approvals
                  {metrics?.pendingApprovals! > 0 && (
                    <Badge count={metrics?.pendingApprovals} className="ml-2" />
                  )}
                </span>
              }
              key="financial"
            >
              <FinancialApprovals />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <RocketOutlined />
                  Strategic Planning
                </span>
              }
              key="strategic"
            >
              <StrategicPlanning />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <SafetyOutlined />
                  Emergency Controls
                </span>
              }
              key="emergency"
            >
              <EmergencyControls />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <FileTextOutlined />
                  Audit Trail
                </span>
              }
              key="audit"
            >
              <AuditTrail />
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default CEOPortal;

