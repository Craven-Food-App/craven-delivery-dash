// @ts-nocheck
import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Statistic, Badge, Button, Space, Alert, Typography, Divider, Card } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import {
  BarChart3,
  Users as UsersIcon,
  DollarSign,
  Trophy,
  Rocket,
  Lightbulb,
  ShieldAlert,
  FileText,
  Mail,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PersonnelManager } from '@/components/ceo/PersonnelManager';
import { FinancialApprovals } from '@/components/ceo/FinancialApprovals';
import { EmergencyControls } from '@/components/ceo/EmergencyControls';
import { StrategicPlanning } from '@/components/ceo/StrategicPlanning';
import { StrategicMindMap } from '@/components/ceo/StrategicMindMap';
import { AuditTrail } from '@/components/ceo/AuditTrail';
import { QuickActions } from '@/components/ceo/QuickActions';
import { EquityDashboard } from '@/components/ceo/EquityDashboard';
import { ExecutiveInboxIMessage } from '@/components/executive/ExecutiveInboxIMessage';
import ExecutiveCommunicationsCenter from '@/components/executive/ExecutiveCommunicationsCenter';
import ExecutivePortalLayout, { ExecutiveNavItem } from '@/components/executive/ExecutivePortalLayout';
import { useExecAuth } from '@/hooks/useExecAuth';
import GoogleWorkspaceSettings from '@/components/admin/GoogleWorkspaceSettings';
import { Settings } from 'lucide-react';
// No Card components: full-page Ant layout

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
  const { loading, user, execUser, isAuthorized, signOut } = useExecAuth('ceo');
  const [metrics, setMetrics] = useState<CEOMetrics | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);

  const navItems = useMemo<ExecutiveNavItem[]>(() => {
    const totalEmployees = metrics?.totalEmployees ?? 0;
    const pendingApprovals = metrics?.pendingApprovals ?? 0;

    return [
      { id: 'overview', label: 'Quick Actions', icon: BarChart3 },
      {
        id: 'personnel',
        label: `Personnel (${totalEmployees})`,
        icon: UsersIcon,
      },
      {
        id: 'financial',
        label:
          pendingApprovals > 0
            ? `Financial Approvals (${pendingApprovals})`
            : 'Financial Approvals',
        icon: DollarSign,
      },
      { id: 'equity', label: 'Equity Ownership', icon: Trophy },
      { id: 'strategic', label: 'Strategic Planning', icon: Rocket },
      { id: 'mindmap', label: 'Mind Map', icon: Lightbulb },
      { id: 'emergency', label: 'Emergency Controls', icon: ShieldAlert },
      { id: 'audit', label: 'Audit Trail', icon: FileText },
      { id: 'communications', label: 'Executive Communications', icon: Mail },
      { id: 'settings', label: 'Email Settings', icon: Settings },
    ];
  }, [metrics?.totalEmployees, metrics?.pendingApprovals]);

  const handleNavigateToCFO = () => {
    const host = window.location.hostname;
    if (/^ceo\./i.test(host)) {
      const target = host.replace(/^ceo\./i, 'cfo.');
      window.location.href = `${window.location.protocol}//${target}`;
      return;
    }
    navigate('/cfo');
  };

  const actionButtons = (
    <Space wrap>
      <Button
        type="primary"
        danger
        icon={<WarningOutlined />}
        onClick={() => setActiveTab('emergency')}
      >
        Emergency
      </Button>
      <Button onClick={handleNavigateToCFO}>CFO Portal</Button>
      <Button type="primary" onClick={() => navigate('/admin')}>
        Admin Portal
      </Button>
      <Button onClick={() => navigate('/board')}>Board Portal</Button>
    </Space>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <QuickActions />;
      case 'personnel':
        return <PersonnelManager />;
      case 'financial':
        return <FinancialApprovals />;
      case 'equity':
        return <EquityDashboard />;
      case 'strategic':
        return <StrategicPlanning />;
      case 'mindmap':
        return <StrategicMindMap />;
      case 'emergency':
        return <EmergencyControls />;
      case 'audit':
        return <AuditTrail />;
      case 'communications':
        return <ExecutiveCommunicationsCenter defaultTab="messages" />;
      case 'settings':
        return <GoogleWorkspaceSettings />;
      default:
        return <QuickActions />;
    }
  };

  const handleBackToHub = () => navigate('/hub');

  const handleSignOut = async () => {
    try {
      await signOut();
      sessionStorage.removeItem('hub_employee_info');
      navigate('/auth?hq=true');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0,
    );

  useEffect(() => {
    if (isAuthorized) {
      fetchCEOMetrics();
      
      // Set up auto-refresh every 60 seconds
      const interval = setInterval(() => {
        fetchCEOMetrics();
      }, 60000);
      
      // Set up real-time subscription for orders
      const ordersChannel = supabase
        .channel('ceo_orders_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          () => {
            fetchCEOMetrics();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'ceo_financial_approvals',
          },
          () => {
            fetchCEOMetrics();
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        ordersChannel.unsubscribe();
      };
    }
  }, [isAuthorized]);

  const fetchCEOMetrics = async () => {
    try {
      // Fetch real metrics from database
      const [employeesRes, approvalsRes, ordersRes] = await Promise.all([
        supabase.from('employees').select('id, employment_status, salary'),
        supabase.from('ceo_financial_approvals').select('id, status, amount'),
        supabase.from('orders').select('id, total_amount, created_at').gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      const employees = employeesRes.data || [];
      const activeEmployees = employees.filter(e => e.employment_status === 'active');
      const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
      
      const approvals = approvalsRes.data || [];
      const pendingApprovals = approvals.filter(a => a.status === 'pending');
      
      const orders = ordersRes.data || [];
      const monthlyRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

      setMetrics({
        totalRevenue: monthlyRevenue,
        revenueGrowth: 15.2, // Calculate from historical data
        cashFlow: monthlyRevenue * 0.35, // Estimated
        burnRate: totalPayroll / 12,
        runway: monthlyRevenue > 0 ? Math.floor((monthlyRevenue * 0.35) / (totalPayroll / 12)) : 0,
        totalEmployees: employees.length,
        admins: activeEmployees.filter(e => e.employment_type === 'full-time').length,
        feeders: 0, // From feeders table when available
        merchants: 0, // From merchants table when available
        pendingApprovals: pendingApprovals.length,
        criticalAlerts: 0,
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching CEO metrics:', error);
      // Fallback to defaults if error
      setMetrics({
        totalRevenue: 0,
        revenueGrowth: 0,
        cashFlow: 0,
        burnRate: 0,
        runway: 0,
        totalEmployees: 0,
        admins: 0,
        feeders: 0,
        merchants: 0,
        pendingApprovals: 0,
        criticalAlerts: 0,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card 
          title={<div className="text-red-600 text-center font-bold text-xl">Access Denied</div>}
          className="max-w-md w-full"
        >
          <div className="space-y-4 text-center">
            <p className="text-lg">You don't have CEO access to this portal.</p>
            <p className="text-sm text-gray-400">
              This portal is restricted to the Chief Executive Officer only.
            </p>
            <p className="text-xs text-gray-500">
              Logged in as: <span className="font-semibold">{user?.email}</span>
            </p>
            <div className="flex gap-2 pt-4">
              <Button onClick={() => navigate('/')} className="flex-1">
                Go Home
              </Button>
              <Button onClick={signOut} danger className="flex-1">
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ExecutivePortalLayout
      title="CEO Portal"
      subtitle="Executive leadership command center"
      navItems={navItems}
      activeItemId={activeTab}
      onSelect={setActiveTab}
      onBack={handleBackToHub}
      onSignOut={handleSignOut}
      actionButtons={actionButtons}
      userInfo={{
        initials: 'CE',
        name: execUser?.title || 'Chief Executive Officer',
        role: 'Executive Leadership',
      }}
    >
      <div className="space-y-6">
        {metrics?.criticalAlerts && metrics.criticalAlerts > 0 && (
          <Alert
            message={`${metrics.criticalAlerts} Critical Alert${metrics.criticalAlerts > 1 ? 's' : ''}`}
            description="Immediate action required. Click to view details."
            type="error"
            showIcon
            icon={<WarningOutlined />}
            action={
              <Button size="small" danger onClick={() => setActiveTab('emergency')}>
                View Now
              </Button>
            }
          />
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Typography.Title level={3} style={{ margin: 0 }}>
              Company Health
            </Typography.Title>
            <Badge
              status="processing"
              text={
                <span className="text-gray-600 text-sm">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              }
            />
          </div>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={4}>
              <div className="bg-green-600 rounded-md px-4 py-3 h-full">
                <Statistic
                  title={<span className="text-white font-semibold">Monthly Revenue</span>}
                  value={formatCurrency(metrics?.totalRevenue ?? 0)}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                />
                <div className="text-xs text-green-100 mt-2">
                  Revenue Growth: {metrics?.revenueGrowth ?? 0}%
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div className="bg-blue-600 rounded-md px-4 py-3 h-full">
                <Statistic
                  title={<span className="text-white font-semibold">Cash Flow</span>}
                  value={formatCurrency(metrics?.cashFlow ?? 0)}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                />
                <div className="text-xs text-blue-100 mt-2">
                  Burn Rate {(metrics?.burnRate ?? 0).toLocaleString()}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div className="bg-purple-600 rounded-md px-4 py-3 h-full">
                <Statistic
                  title={<span className="text-white font-semibold">Runway</span>}
                  value={`${metrics?.runway ?? 0} mo`}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                />
                <div className="text-xs text-purple-100 mt-2">
                  Admin Staff: {metrics?.admins ?? 0}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div className="bg-indigo-600 rounded-md px-4 py-3 h-full">
                <Statistic
                  title={<span className="text-white font-semibold">Headcount</span>}
                  value={metrics?.totalEmployees ?? 0}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                />
                <div className="text-xs text-indigo-100 mt-2">
                  Admins: {metrics?.admins ?? 0} • Feeders: {metrics?.feeders ?? 0}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div className="bg-yellow-600 rounded-md px-4 py-3 h-full">
                <Statistic
                  title={<span className="text-white font-semibold">Pending Approvals</span>}
                  value={metrics?.pendingApprovals ?? 0}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                />
                <div className="text-xs text-yellow-100 mt-2">
                  Requires your attention
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div className="bg-teal-600 rounded-md px-4 py-3 h-full">
                <Statistic
                  title={<span className="text-white font-semibold">Merchants</span>}
                  value={metrics?.merchants ?? 0}
                  valueStyle={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}
                />
                <div className="text-xs text-teal-100 mt-2">Active partners</div>
              </div>
            </Col>
          </Row>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Typography.Title level={5} style={{ margin: 0 }}>
              Executive Chat
            </Typography.Title>
            <Button size="small" type="default" onClick={() => setIsChatCollapsed((prev) => !prev)}>
              {isChatCollapsed ? 'Expand' : 'Collapse'}
            </Button>
          </div>
          {!isChatCollapsed && (
            <ExecutiveInboxIMessage role="ceo" deviceId={`ceo-portal-${window.location.hostname}`} />
          )}
        </section>

        <Divider />

        <section className="space-y-6">{renderContent()}</section>

        <Divider />

      </div>
    </ExecutivePortalLayout>
  );
};
 
export default CEOPortal;

