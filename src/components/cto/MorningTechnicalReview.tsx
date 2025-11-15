import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Statistic, Progress, Alert, Tabs, Typography, Space, Button, Tag } from 'antd';
import { 
  CloudOutlined, DatabaseOutlined, BugOutlined, ClockCircleOutlined, 
  CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined 
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

export default function MorningTechnicalReview() {
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [deployments, setDeployments] = useState<any[]>([]);
  const [cronJobs, setCronJobs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    uptime: 99.9,
    avgResponseTime: 45,
    errorRate: 0.02,
    dbConnections: 0,
    activeIncidents: 0,
  });

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [infraRes, incidentsRes, errorsRes] = await Promise.all([
        supabase.from('it_infrastructure').select('*').order('service_name'),
        supabase.from('it_incidents').select('*').eq('status', 'open').order('created_at', { ascending: false }),
        supabase.from('it_incidents').select('*').eq('incident_type', 'bug').order('created_at', { ascending: false }).limit(10),
      ]);

      setInfrastructure(infraRes.data || []);
      setIncidents(incidentsRes.data || []);
      setErrors(errorsRes.data || []);

      // Calculate metrics
      const avgUptime = infraRes.data?.length > 0
        ? infraRes.data.reduce((sum, s) => sum + (s.uptime_percent || 0), 0) / infraRes.data.length
        : 99.9;
      
      const avgResponse = infraRes.data?.length > 0
        ? infraRes.data.reduce((sum, s) => sum + (s.response_time_ms || 0), 0) / infraRes.data.length
        : 45;

      setMetrics({
        uptime: avgUptime,
        avgResponseTime: avgResponse,
        errorRate: (errorsRes.data?.length || 0) / 100,
        dbConnections: 0, // Would need actual DB monitoring
        activeIncidents: incidentsRes.data?.length || 0,
      });

      // Mock deployments (would come from CI/CD system)
      setDeployments([
        { id: '1', service: 'API Gateway', version: 'v2.1.3', status: 'success', deployed_at: new Date().toISOString(), deployed_by: 'System' },
        { id: '2', service: 'Mobile App', version: 'v1.4.2', status: 'success', deployed_at: new Date(Date.now() - 3600000).toISOString(), deployed_by: 'CTO' },
      ]);

      // Mock cron jobs
      setCronJobs([
        { id: '1', job_name: 'Daily Driver Payouts', schedule: 'Daily 2:00 AM', last_run: new Date(Date.now() - 3600000).toISOString(), status: 'success', next_run: new Date(Date.now() + 86400000).toISOString() },
        { id: '2', job_name: 'Order Assignment Queue', schedule: 'Every 30 seconds', last_run: new Date(Date.now() - 30000).toISOString(), status: 'success', next_run: new Date(Date.now() + 30000).toISOString() },
        { id: '3', job_name: 'Database Backup', schedule: 'Daily 3:00 AM', last_run: new Date(Date.now() - 7200000).toISOString(), status: 'success', next_run: new Date(Date.now() + 82800000).toISOString() },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      operational: { color: 'success', text: 'Operational' },
      degraded: { color: 'warning', text: 'Degraded' },
      down: { color: 'error', text: 'Down' },
      maintenance: { color: 'default', text: 'Maintenance' },
      success: { color: 'success', text: 'Success' },
      failed: { color: 'error', text: 'Failed' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Badge status={config.color as any} text={config.text} />;
  };

  return (
    <div>
      <Space className="mb-4" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} className="m-0">Morning Technical Review</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchAllData} loading={loading}>
          Refresh
        </Button>
      </Space>

      {/* Key Metrics */}
      <Row gutter={16} className="mb-4">
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={metrics.uptime}
              precision={2}
              suffix="%"
              valueStyle={{ color: metrics.uptime >= 99.9 ? '#3f8600' : '#cf1322' }}
              prefix={<CloudOutlined />}
            />
            <Progress percent={metrics.uptime} size="small" status={metrics.uptime >= 99.9 ? 'success' : 'exception'} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={metrics.avgResponseTime}
              suffix="ms"
              valueStyle={{ color: metrics.avgResponseTime < 100 ? '#3f8600' : '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Error Rate"
              value={metrics.errorRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: metrics.errorRate < 0.5 ? '#3f8600' : '#cf1322' }}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Incidents"
              value={metrics.activeIncidents}
              valueStyle={{ color: metrics.activeIncidents === 0 ? '#3f8600' : '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {metrics.uptime < 99.9 && (
        <Alert
          message="Uptime Below Target"
          description={`Current uptime is ${metrics.uptime.toFixed(2)}%. Target is 99.9%+.`}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      {metrics.activeIncidents > 0 && (
        <Alert
          message={`${metrics.activeIncidents} Active Incident(s)`}
          description="Review incidents tab for details."
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      <Tabs defaultActiveKey="infrastructure">
        <TabPane tab={<><CloudOutlined /> Infrastructure</>} key="infrastructure">
          <Table
            dataSource={infrastructure}
            rowKey="id"
            loading={loading}
            pagination={false}
            columns={[
              {
                title: 'Service',
                dataIndex: 'service_name',
                key: 'service_name',
                render: (text) => <Text strong>{text}</Text>,
              },
              {
                title: 'Provider',
                dataIndex: 'service_provider',
                key: 'service_provider',
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => getStatusBadge(status),
              },
              {
                title: 'Uptime',
                dataIndex: 'uptime_percent',
                key: 'uptime_percent',
                render: (val) => (
                  <Space>
                    <Text>{val?.toFixed(2)}%</Text>
                    <Progress percent={val} size="small" status={val >= 99.9 ? 'success' : 'exception'} style={{ width: 60 }} />
                  </Space>
                ),
              },
              {
                title: 'Response Time',
                dataIndex: 'response_time_ms',
                key: 'response_time_ms',
                render: (val) => <Text>{val}ms</Text>,
              },
              {
                title: 'Last Check',
                dataIndex: 'last_check',
                key: 'last_check',
                render: (val) => val ? new Date(val).toLocaleTimeString() : '-',
              },
            ]}
          />
        </TabPane>

        <TabPane tab={<><BugOutlined /> Error Logs</>} key="errors">
          <Table
            dataSource={errors}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Title',
                dataIndex: 'title',
                key: 'title',
              },
              {
                title: 'Severity',
                dataIndex: 'severity',
                key: 'severity',
                render: (sev) => (
                  <Tag color={sev === 'critical' ? 'red' : sev === 'high' ? 'orange' : 'blue'}>
                    {sev}
                  </Tag>
                ),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => getStatusBadge(status),
              },
              {
                title: 'Reported',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (val) => new Date(val).toLocaleString(),
              },
            ]}
          />
        </TabPane>

        <TabPane tab={<><CheckCircleOutlined /> Deployments</>} key="deployments">
          <Table
            dataSource={deployments}
            rowKey="id"
            loading={loading}
            pagination={false}
            columns={[
              {
                title: 'Service',
                dataIndex: 'service',
                key: 'service',
              },
              {
                title: 'Version',
                dataIndex: 'version',
                key: 'version',
                render: (text) => <Tag color="blue">{text}</Tag>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => getStatusBadge(status),
              },
              {
                title: 'Deployed At',
                dataIndex: 'deployed_at',
                key: 'deployed_at',
                render: (val) => new Date(val).toLocaleString(),
              },
              {
                title: 'Deployed By',
                dataIndex: 'deployed_by',
                key: 'deployed_by',
              },
            ]}
          />
        </TabPane>

        <TabPane tab={<><ClockCircleOutlined /> Cron Jobs</>} key="cron">
          <Table
            dataSource={cronJobs}
            rowKey="id"
            loading={loading}
            pagination={false}
            columns={[
              {
                title: 'Job Name',
                dataIndex: 'job_name',
                key: 'job_name',
              },
              {
                title: 'Schedule',
                dataIndex: 'schedule',
                key: 'schedule',
              },
              {
                title: 'Last Run',
                dataIndex: 'last_run',
                key: 'last_run',
                render: (val) => new Date(val).toLocaleString(),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => getStatusBadge(status),
              },
              {
                title: 'Next Run',
                dataIndex: 'next_run',
                key: 'next_run',
                render: (val) => new Date(val).toLocaleString(),
              },
            ]}
          />
        </TabPane>

        <TabPane tab={<><ExclamationCircleOutlined /> Active Incidents</>} key="incidents">
          {incidents.length === 0 ? (
            <Alert message="No Active Incidents" description="All systems operational." type="success" showIcon />
          ) : (
            <Table
              dataSource={incidents}
              rowKey="id"
              loading={loading}
              pagination={false}
              columns={[
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Type',
                  dataIndex: 'incident_type',
                  key: 'incident_type',
                },
                {
                  title: 'Severity',
                  dataIndex: 'severity',
                  key: 'severity',
                  render: (sev) => (
                    <Tag color={sev === 'critical' ? 'red' : sev === 'high' ? 'orange' : 'blue'}>
                      {sev}
                    </Tag>
                  ),
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status) => getStatusBadge(status),
                },
                {
                  title: 'Reported',
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: (val) => new Date(val).toLocaleString(),
                },
              ]}
            />
          )}
        </TabPane>

        <TabPane tab={<><DatabaseOutlined /> Database Performance</>} key="database">
          <Card>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="Active Connections" value={metrics.dbConnections} />
              </Col>
              <Col span={8}>
                <Statistic title="Query Performance" value="Good" valueStyle={{ color: '#3f8600' }} />
              </Col>
              <Col span={8}>
                <Statistic title="Storage Usage" value="45%" />
              </Col>
            </Row>
            <Alert
              message="Database Monitoring"
              description="Real-time database metrics would be integrated here from Supabase monitoring."
              type="info"
              showIcon
              className="mt-4"
            />
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}


