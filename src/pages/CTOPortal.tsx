// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Statistic, Tabs, Table, Badge, Card, Button, Space, Progress, Alert } from 'antd';
import { CloudOutlined, BugOutlined, LockOutlined, DatabaseOutlined, DashboardOutlined } from '@ant-design/icons';
import { useExecAuth } from '@/hooks/useExecAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

export default function CTOPortal() {
  const { loading, user, execUser, isAuthorized, signOut } = useExecAuth();
  const navigate = useNavigate();
  const [infra, setInfra] = useState({
    uptime: 99.9,
    responseTime: 45,
    errorsPerHour: 2,
    securityScore: 95,
    activeIncidents: 0,
    assetsTotal: 0,
    licensesExpiring: 0
  });

  useEffect(() => {
    if (isAuthorized) {
      fetchInfra();
    }
  }, [isAuthorized]);

  const fetchInfra = async () => {
    try {
      const [incidentsRes, assetsRes, infraRes] = await Promise.all([
        supabase.from('it_incidents').select('id').eq('status', 'open'),
        supabase.from('it_assets').select('id'),
        supabase.from('it_infrastructure').select('*').limit(10)
      ]);

      const latestInfra = infraRes.data?.[0];
      setInfra({
        uptime: latestInfra?.uptime_percent || 99.9,
        responseTime: latestInfra?.response_time_ms || 45,
        errorsPerHour: 2,
        securityScore: 95,
        activeIncidents: incidentsRes.data?.length || 0,
        assetsTotal: assetsRes.data?.length || 0,
        licensesExpiring: 0
      });
    } catch (error) {
      console.error('Error fetching CTO metrics:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthorized) return <div className="flex items-center justify-center h-screen">Access Denied - CTO Portal</div>;

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white border-b flex items-center justify-between px-6">
        <Typography.Title level={3} className="m-0">CTO Technology Command</Typography.Title>
        <Space>
          <Button onClick={() => navigate('/ceo')}>CEO Portal</Button>
          <Button onClick={() => navigate('/cfo')}>CFO Portal</Button>
          <Button onClick={signOut}>Sign Out</Button>
        </Space>
      </Header>
      
      <Content className="p-6 bg-gray-50">
        <Row gutter={16} className="mb-6">
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="System Uptime" value={infra.uptime} suffix="%" />
              <Progress percent={infra.uptime} status="success" className="mt-2" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Response Time" value={infra.responseTime} suffix="ms" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Errors/Hour" value={infra.errorsPerHour} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Security Score" value={infra.securityScore} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="mb-6">
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Active Incidents" value={infra.activeIncidents} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Total Assets" value={infra.assetsTotal} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Licenses Expiring" value={infra.licensesExpiring} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className={infra.uptime >= 99 ? 'bg-green-50' : 'bg-yellow-50'}>
              <Statistic title="System Health" value="Operational" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="infra">
          <TabPane tab={<><CloudOutlined /> Infrastructure</>} key="infra">
            <InfrastructureHealth />
          </TabPane>
          <TabPane tab={<><BugOutlined /> Incidents</>} key="incidents">
            <IncidentsDashboard />
          </TabPane>
          <TabPane tab={<><LockOutlined /> Security</>} key="security">
            <SecurityDashboard />
          </TabPane>
          <TabPane tab={<><DatabaseOutlined /> Assets</>} key="assets">
            <AssetManagement />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
}

function InfrastructureHealth() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('it_infrastructure').select('*');
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={services}
        rowKey="id"
        columns={[
          { title: 'Service', dataIndex: 'service_name', key: 'service_name' },
          { title: 'Provider', dataIndex: 'service_provider', key: 'service_provider' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Badge status={status === 'operational' ? 'success' : 'error'} text={status} /> },
          { title: 'Uptime %', dataIndex: 'uptime_percent', key: 'uptime_percent' },
          { title: 'Response (ms)', dataIndex: 'response_time_ms', key: 'response_time_ms' }
        ]}
      />
    </div>
  );
}

function IncidentsDashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('it_incidents').select('*').order('created_at', { ascending: false }).limit(50);
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={incidents}
        rowKey="id"
        columns={[
          { title: 'Title', dataIndex: 'title', key: 'title' },
          { title: 'Type', dataIndex: 'incident_type', key: 'incident_type' },
          { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (sev) => <Badge status={sev === 'critical' ? 'error' : sev === 'high' ? 'warning' : 'default'} text={sev} /> },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Reported', dataIndex: 'created_at', key: 'created_at' }
        ]}
      />
    </div>
  );
}

function SecurityDashboard() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('security_audits').select('*').order('created_at', { ascending: false }).limit(50);
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={audits}
        rowKey="id"
        columns={[
          { title: 'Finding', dataIndex: 'finding', key: 'finding' },
          { title: 'Type', dataIndex: 'audit_type', key: 'audit_type' },
          { title: 'Severity', dataIndex: 'severity', key: 'severity' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Date', dataIndex: 'created_at', key: 'created_at' }
        ]}
      />
    </div>
  );
}

function AssetManagement() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('it_assets').select('*').limit(100);
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={assets}
        rowKey="id"
        columns={[
          { title: 'Asset Name', dataIndex: 'asset_name', key: 'asset_name' },
          { title: 'Type', dataIndex: 'asset_type', key: 'asset_type' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Purchase Date', dataIndex: 'purchase_date', key: 'purchase_date' },
          { title: 'Warranty Expires', dataIndex: 'warranty_expiry', key: 'warranty_expiry' }
        ]}
      />
    </div>
  );
}

