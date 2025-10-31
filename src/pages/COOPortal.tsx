// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Statistic, Tabs, Table, Badge, Card, Button, Space, Divider } from 'antd';
import { DashboardOutlined, CarOutlined, ShopOutlined, FileProtectOutlined, AlertOutlined } from '@ant-design/icons';
import { useExecAuth } from '@/hooks/useExecAuth';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { TabPane } = Tabs;

export default function COOPortal() {
  const { loading, user, execUser, isAuthorized, signOut } = useExecAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    activeOrders: 0,
    driversOnRoad: 0,
    avgDeliveryTime: 0,
    zonesCovered: 0,
    vendorScore: 95,
    complianceStatus: 'compliant',
    vehiclesInService: 0,
    pendingCompliance: 0
  });

  useEffect(() => {
    if (isAuthorized) {
      fetchMetrics();
    }
  }, [isAuthorized]);

  const fetchMetrics = async () => {
    try {
      const [ordersRes, driversRes, vehiclesRes, complianceRes] = await Promise.all([
        supabase.from('orders').select('id').eq('order_status', 'active'),
        supabase.from('driver_profiles').select('id').eq('is_available', true),
        supabase.from('fleet_vehicles').select('id').eq('status', 'active'),
        supabase.from('compliance_records').select('id').eq('status', 'valid')
      ]);

      setMetrics({
        activeOrders: ordersRes.data?.length || 0,
        driversOnRoad: driversRes.data?.length || 0,
        avgDeliveryTime: 25,
        zonesCovered: 8,
        vendorScore: 95,
        complianceStatus: 'compliant',
        vehiclesInService: vehiclesRes.data?.length || 0,
        pendingCompliance: complianceRes.data?.length || 0
      });
    } catch (error) {
      console.error('Error fetching COO metrics:', error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthorized) return <div className="flex items-center justify-center h-screen">Access Denied - COO Portal</div>;

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white border-b flex items-center justify-between px-6">
        <Typography.Title level={3} className="m-0">COO Operations Command</Typography.Title>
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
              <Statistic title="Active Orders" value={metrics.activeOrders} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Drivers Active" value={metrics.driversOnRoad} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Avg Delivery Time" value={metrics.avgDeliveryTime} suffix="min" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Zones Covered" value={metrics.zonesCovered} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="mb-6">
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Vehicles Active" value={metrics.vehiclesInService} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Vendor Score" value={metrics.vendorScore} suffix="%" />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Compliance Records" value={metrics.pendingCompliance} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className={metrics.complianceStatus === 'compliant' ? 'bg-green-50' : 'bg-red-50'}>
              <Statistic title="Compliance" value={metrics.complianceStatus} />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="fleet">
          <TabPane tab={<><CarOutlined /> Fleet Management</>} key="fleet">
            <FleetDashboard />
          </TabPane>
          <TabPane tab={<><ShopOutlined /> Partners & Vendors</>} key="partners">
            <PartnerManagement />
          </TabPane>
          <TabPane tab={<><FileProtectOutlined /> Compliance</>} key="compliance">
            <ComplianceDashboard />
          </TabPane>
          <TabPane tab={<><DashboardOutlined /> Operations Analytics</>} key="analytics">
            <OperationsAnalytics />
          </TabPane>
        </Tabs>
      </Content>
    </Layout>
  );
}

function FleetDashboard() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('fleet_vehicles').select('*').limit(100);
      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={vehicles}
        rowKey="id"
        columns={[
          { title: 'Vehicle Type', dataIndex: 'vehicle_type', key: 'vehicle_type' },
          { title: 'License Plate', dataIndex: 'license_plate', key: 'license_plate' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Badge status={status === 'active' ? 'success' : 'default'} text={status} /> },
          { title: 'Registration Expires', dataIndex: 'registration_expiry', key: 'registration_expiry' },
          { title: 'Insurance Expires', dataIndex: 'insurance_expiry', key: 'insurance_expiry' }
        ]}
      />
    </div>
  );
}

function PartnerManagement() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('partner_vendors').select('*').limit(100);
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={partners}
        rowKey="id"
        columns={[
          { title: 'Vendor Name', dataIndex: 'vendor_name', key: 'vendor_name' },
          { title: 'Type', dataIndex: 'vendor_type', key: 'vendor_type' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Performance Rating', dataIndex: 'performance_rating', key: 'performance_rating' },
          { title: 'Contact Email', dataIndex: 'contact_email', key: 'contact_email' }
        ]}
      />
    </div>
  );
}

function ComplianceDashboard() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('compliance_records').select('*').limit(100);
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Table 
        loading={loading}
        dataSource={records}
        rowKey="id"
        columns={[
          { title: 'Type', dataIndex: 'record_type', key: 'record_type' },
          { title: 'Entity Type', dataIndex: 'entity_type', key: 'entity_type' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Expiry Date', dataIndex: 'expiry_date', key: 'expiry_date' },
          { title: 'Issued By', dataIndex: 'issued_by', key: 'issued_by' }
        ]}
      />
    </div>
  );
}

function OperationsAnalytics() {
  return (
    <div className="text-center p-12 text-gray-500">
      Operations analytics dashboard coming soon...
    </div>
  );
}

