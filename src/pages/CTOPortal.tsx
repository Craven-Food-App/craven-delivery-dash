// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Statistic, Tabs, Table, Badge, Card, Button, Space, Progress, Alert, Modal, Form, Input, InputNumber, Select, message, Popconfirm } from 'antd';
import { CloudOutlined, BugOutlined, LockOutlined, DatabaseOutlined, DashboardOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('it_infrastructure').select('*').order('created_at', { ascending: false });
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      message.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingService(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingService(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('it_infrastructure').delete().eq('id', id);
      if (error) throw error;
      message.success('Service deleted successfully');
      fetchServices();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      message.error(error.message || 'Failed to delete service');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingService) {
        const { error } = await supabase.from('it_infrastructure').update(values).eq('id', editingService.id);
        if (error) throw error;
        message.success('Service updated successfully');
      } else {
        const { error } = await supabase.from('it_infrastructure').insert(values);
        if (error) throw error;
        message.success('Service created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      message.error(error.message || 'Failed to save service');
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Typography.Title level={4} className="m-0">IT Infrastructure</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Service
        </Button>
      </div>

      <Table 
        loading={loading}
        dataSource={services}
        rowKey="id"
        columns={[
          { title: 'Service', dataIndex: 'service_name', key: 'service_name' },
          { title: 'Provider', dataIndex: 'service_provider', key: 'service_provider' },
          { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Badge status={status === 'operational' ? 'success' : 'error'} text={status} /> },
          { title: 'Uptime %', dataIndex: 'uptime_percent', key: 'uptime_percent' },
          { title: 'Response (ms)', dataIndex: 'response_time_ms', key: 'response_time_ms' },
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Delete this service?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editingService ? 'Edit Service' : 'Add Service'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="service_name" label="Service Name" rules={[{ required: true }]}>
            <Input placeholder="API Gateway" />
          </Form.Item>
          <Form.Item name="service_provider" label="Provider" rules={[{ required: true }]}>
            <Input placeholder="Supabase" />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="operational">Operational</Select.Option>
              <Select.Option value="degraded">Degraded</Select.Option>
              <Select.Option value="down">Down</Select.Option>
              <Select.Option value="maintenance">Maintenance</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="uptime_percent" label="Uptime %">
                <InputNumber min={0} max={100} placeholder="99.9" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="response_time_ms" label="Response Time (ms)">
                <InputNumber min={0} placeholder="45" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

function IncidentsDashboard() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [form] = Form.useForm();

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
      message.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingIncident(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingIncident(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('it_incidents').delete().eq('id', id);
      if (error) throw error;
      message.success('Incident deleted successfully');
      fetchIncidents();
    } catch (error: any) {
      console.error('Error deleting incident:', error);
      message.error(error.message || 'Failed to delete incident');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingIncident) {
        const { error } = await supabase.from('it_incidents').update(values).eq('id', editingIncident.id);
        if (error) throw error;
        message.success('Incident updated successfully');
      } else {
        const { error } = await supabase.from('it_incidents').insert(values);
        if (error) throw error;
        message.success('Incident created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchIncidents();
    } catch (error: any) {
      console.error('Error saving incident:', error);
      message.error(error.message || 'Failed to save incident');
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Typography.Title level={4} className="m-0">Incident Management</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Report Incident
        </Button>
      </div>

      <Table 
        loading={loading}
        dataSource={incidents}
        rowKey="id"
        columns={[
          { title: 'Title', dataIndex: 'title', key: 'title' },
          { title: 'Type', dataIndex: 'incident_type', key: 'incident_type' },
          { title: 'Severity', dataIndex: 'severity', key: 'severity', render: (sev) => <Badge status={sev === 'critical' ? 'error' : sev === 'high' ? 'warning' : 'default'} text={sev} /> },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Reported', dataIndex: 'created_at', key: 'created_at' },
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Delete this incident?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editingIncident ? 'Edit Incident' : 'Report Incident'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Service outage in production" />
          </Form.Item>
          <Form.Item name="incident_type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="outage">Outage</Select.Option>
              <Select.Option value="bug">Bug</Select.Option>
              <Select.Option value="security">Security</Select.Option>
              <Select.Option value="performance">Performance</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="critical">Critical</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="open">Open</Select.Option>
                  <Select.Option value="investigating">Investigating</Select.Option>
                  <Select.Option value="resolved">Resolved</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

function SecurityDashboard() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAudit, setEditingAudit] = useState<any>(null);
  const [form] = Form.useForm();

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
      message.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAudit(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingAudit(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('security_audits').delete().eq('id', id);
      if (error) throw error;
      message.success('Audit deleted successfully');
      fetchAudits();
    } catch (error: any) {
      console.error('Error deleting audit:', error);
      message.error(error.message || 'Failed to delete audit');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingAudit) {
        const { error } = await supabase.from('security_audits').update(values).eq('id', editingAudit.id);
        if (error) throw error;
        message.success('Audit updated successfully');
      } else {
        const { error } = await supabase.from('security_audits').insert(values);
        if (error) throw error;
        message.success('Audit created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchAudits();
    } catch (error: any) {
      console.error('Error saving audit:', error);
      message.error(error.message || 'Failed to save audit');
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Typography.Title level={4} className="m-0">Security Audits</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          New Audit
        </Button>
      </div>

      <Table 
        loading={loading}
        dataSource={audits}
        rowKey="id"
        columns={[
          { title: 'Finding', dataIndex: 'finding', key: 'finding' },
          { title: 'Type', dataIndex: 'audit_type', key: 'audit_type' },
          { title: 'Severity', dataIndex: 'severity', key: 'severity' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Date', dataIndex: 'created_at', key: 'created_at' },
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Delete this audit?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editingAudit ? 'Edit Audit' : 'New Audit'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="finding" label="Finding" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Describe the security finding..." />
          </Form.Item>
          <Form.Item name="audit_type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="vulnerability">Vulnerability</Select.Option>
              <Select.Option value="compliance">Compliance</Select.Option>
              <Select.Option value="penetration">Penetration Test</Select.Option>
              <Select.Option value="code-review">Code Review</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="severity" label="Severity" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="critical">Critical</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="open">Open</Select.Option>
                  <Select.Option value="in-progress">In Progress</Select.Option>
                  <Select.Option value="resolved">Resolved</Select.Option>
                  <Select.Option value="accepted">Accepted Risk</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

function AssetManagement() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('it_assets').select('*').order('created_at', { ascending: false }).limit(100);
      setAssets(data || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      message.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingAsset(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingAsset(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('it_assets').delete().eq('id', id);
      if (error) throw error;
      message.success('Asset deleted successfully');
      fetchAssets();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      message.error(error.message || 'Failed to delete asset');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingAsset) {
        const { error } = await supabase.from('it_assets').update(values).eq('id', editingAsset.id);
        if (error) throw error;
        message.success('Asset updated successfully');
      } else {
        const { error } = await supabase.from('it_assets').insert(values);
        if (error) throw error;
        message.success('Asset created successfully');
      }
      setModalVisible(false);
      form.resetFields();
      fetchAssets();
    } catch (error: any) {
      console.error('Error saving asset:', error);
      message.error(error.message || 'Failed to save asset');
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <Typography.Title level={4} className="m-0">IT Assets</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Add Asset
        </Button>
      </div>

      <Table 
        loading={loading}
        dataSource={assets}
        rowKey="id"
        columns={[
          { title: 'Asset Name', dataIndex: 'asset_name', key: 'asset_name' },
          { title: 'Type', dataIndex: 'asset_type', key: 'asset_type' },
          { title: 'Status', dataIndex: 'status', key: 'status' },
          { title: 'Purchase Date', dataIndex: 'purchase_date', key: 'purchase_date' },
          { title: 'Warranty Expires', dataIndex: 'warranty_expiry', key: 'warranty_expiry' },
          {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (_, record) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                <Popconfirm title="Delete this asset?" onConfirm={() => handleDelete(record.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            )
          }
        ]}
      />

      <Modal
        title={editingAsset ? 'Edit Asset' : 'Add Asset'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="asset_name" label="Asset Name" rules={[{ required: true }]}>
            <Input placeholder="MacBook Pro 16" />
          </Form.Item>
          <Form.Item name="asset_type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="hardware">Hardware</Select.Option>
              <Select.Option value="software">Software</Select.Option>
              <Select.Option value="server">Server</Select.Option>
              <Select.Option value="network">Network</Select.Option>
              <Select.Option value="mobile">Mobile</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="retired">Retired</Select.Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="purchase_date" label="Purchase Date">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warranty_expiry" label="Warranty Expires">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
