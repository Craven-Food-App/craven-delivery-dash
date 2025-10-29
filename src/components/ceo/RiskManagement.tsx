import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Space, Progress, 
  Table, Tag, Button, Select, Alert, Timeline, 
  Modal, Form, Input, Rate, Divider, Tooltip, Statistic
} from 'antd';
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ShieldOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  UserOutlined,
  GlobalOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface Risk {
  id: string;
  title: string;
  category: 'financial' | 'operational' | 'strategic' | 'compliance' | 'technology';
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  impact: number;
  status: 'identified' | 'assessed' | 'mitigated' | 'monitoring' | 'resolved';
  description: string;
  mitigation: string;
  owner: string;
  dueDate: string;
  createdAt: string;
}

interface RiskMitigation {
  id: string;
  riskId: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  dueDate: string;
}

export const RiskManagement: React.FC = () => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [mitigations, setMitigations] = useState<RiskMitigation[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      // Generate sample risk data
      const sampleRisks: Risk[] = [
        {
          id: '1',
          title: 'Cybersecurity Breach',
          category: 'technology',
          severity: 'critical',
          probability: 85,
          impact: 95,
          status: 'assessed',
          description: 'Potential data breach affecting customer information and company reputation',
          mitigation: 'Implement multi-factor authentication, regular security audits, and employee training',
          owner: 'CTO',
          dueDate: dayjs().add(30, 'days').format('YYYY-MM-DD'),
          createdAt: dayjs().subtract(5, 'days').format('YYYY-MM-DD')
        },
        {
          id: '2',
          title: 'Cash Flow Shortage',
          category: 'financial',
          severity: 'high',
          probability: 60,
          impact: 80,
          status: 'mitigated',
          description: 'Potential liquidity issues during seasonal downturns',
          mitigation: 'Establish credit line, optimize payment terms, and maintain cash reserves',
          owner: 'CFO',
          dueDate: dayjs().add(60, 'days').format('YYYY-MM-DD'),
          createdAt: dayjs().subtract(10, 'days').format('YYYY-MM-DD')
        },
        {
          id: '3',
          title: 'Key Employee Departure',
          category: 'operational',
          severity: 'medium',
          probability: 40,
          impact: 70,
          status: 'monitoring',
          description: 'Risk of losing critical team members to competitors',
          mitigation: 'Implement retention programs, competitive compensation, and career development',
          owner: 'CEO',
          dueDate: dayjs().add(90, 'days').format('YYYY-MM-DD'),
          createdAt: dayjs().subtract(15, 'days').format('YYYY-MM-DD')
        },
        {
          id: '4',
          title: 'Regulatory Compliance',
          category: 'compliance',
          severity: 'high',
          probability: 70,
          impact: 85,
          status: 'identified',
          description: 'Changes in food safety regulations affecting operations',
          mitigation: 'Regular compliance audits, legal consultation, and staff training',
          owner: 'COO',
          dueDate: dayjs().add(45, 'days').format('YYYY-MM-DD'),
          createdAt: dayjs().subtract(3, 'days').format('YYYY-MM-DD')
        }
      ];

      setRisks(sampleRisks);

      // Generate sample mitigations
      const sampleMitigations: RiskMitigation[] = [
        {
          id: '1',
          riskId: '1',
          action: 'Deploy endpoint protection software',
          status: 'completed',
          assignedTo: 'IT Team',
          dueDate: dayjs().subtract(2, 'days').format('YYYY-MM-DD')
        },
        {
          id: '2',
          riskId: '1',
          action: 'Conduct security awareness training',
          status: 'in_progress',
          assignedTo: 'HR Team',
          dueDate: dayjs().add(7, 'days').format('YYYY-MM-DD')
        },
        {
          id: '3',
          riskId: '2',
          action: 'Establish $500K credit line',
          status: 'completed',
          assignedTo: 'CFO',
          dueDate: dayjs().subtract(5, 'days').format('YYYY-MM-DD')
        }
      ];

      setMitigations(sampleMitigations);

    } catch (error) {
      console.error('Error fetching risks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#f5222d';
      case 'high': return '#fa541c';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#1890ff';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'green';
      case 'mitigated': return 'blue';
      case 'monitoring': return 'orange';
      case 'assessed': return 'purple';
      case 'identified': return 'red';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial': return <DollarOutlined />;
      case 'operational': return <UserOutlined />;
      case 'strategic': return <GlobalOutlined />;
      case 'compliance': return <FileTextOutlined />;
      case 'technology': return <ThunderboltOutlined />;
      default: return <ExclamationCircleOutlined />;
    }
  };

  const calculateRiskScore = (probability: number, impact: number) => {
    return Math.round((probability * impact) / 100);
  };

  const riskColumns = [
    {
      title: 'Risk',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Risk) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getCategoryIcon(record.category)} {record.category.toUpperCase()}
          </Text>
        </Space>
      )
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>
          {severity.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Risk Score',
      key: 'score',
      render: (record: Risk) => {
        const score = calculateRiskScore(record.probability, record.impact);
        return (
          <Space direction="vertical" size={0}>
            <Text strong style={{ color: getSeverityColor(record.severity) }}>
              {score}/100
            </Text>
            <Progress 
              percent={score} 
              size="small" 
              strokeColor={getSeverityColor(record.severity)}
              showInfo={false}
            />
          </Space>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      key: 'owner',
      render: (owner: string) => (
        <Space>
          <UserOutlined />
          <Text>{owner}</Text>
        </Space>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date: string) => (
        <Text type="secondary">
          {dayjs(date).format('MMM DD, YYYY')}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Risk) => (
        <Space>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedRisk(record);
              setIsModalVisible(true);
            }}
          >
            View
          </Button>
        </Space>
      )
    }
  ];

  const criticalRisks = risks.filter(r => r.severity === 'critical').length;
  const highRisks = risks.filter(r => r.severity === 'high').length;
  const resolvedRisks = risks.filter(r => r.status === 'resolved').length;
  const mitigationProgress = Math.round((mitigations.filter(m => m.status === 'completed').length / mitigations.length) * 100);

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              <ShieldOutlined style={{ marginRight: '8px', color: '#f5222d' }} />
              Risk Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Comprehensive risk assessment and mitigation strategies
            </Text>
          </div>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedRisk(null);
                setIsModalVisible(true);
              }}
            >
              Add Risk
            </Button>
            <Button 
              icon={<ExclamationCircleOutlined />}
              onClick={fetchRisks}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Risk Overview Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                border: '1px solid #ef4444',
                borderRadius: '12px'
              }}
            >
              <Statistic
                title={<Text type="secondary">Critical Risks</Text>}
                value={criticalRisks}
                prefix={<ExclamationCircleOutlined style={{ color: '#ef4444' }} />}
                valueStyle={{ color: '#dc2626', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Immediate attention required
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                border: '1px solid #f59e0b',
                borderRadius: '12px'
              }}
            >
              <Statistic
                title={<Text type="secondary">High Risks</Text>}
                value={highRisks}
                prefix={<WarningOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#d97706', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Monitor closely
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1px solid #22c55e',
                borderRadius: '12px'
              }}
            >
              <Statistic
                title={<Text type="secondary">Resolved</Text>}
                value={resolvedRisks}
                prefix={<CheckCircleOutlined style={{ color: '#22c55e' }} />}
                valueStyle={{ color: '#15803d', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Successfully mitigated
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                border: '1px solid #0ea5e9',
                borderRadius: '12px'
              }}
            >
              <Statistic
                title={<Text type="secondary">Mitigation Progress</Text>}
                value={mitigationProgress}
                prefix={<ClockCircleOutlined style={{ color: '#0ea5e9' }} />}
                suffix="%"
                valueStyle={{ color: '#0c4a6e', fontSize: '28px' }}
              />
              <Progress 
                percent={mitigationProgress} 
                showInfo={false} 
                strokeColor="#0ea5e9"
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Risk Alerts */}
        {criticalRisks > 0 && (
          <Alert
            message="Critical Risk Alert"
            description={`${criticalRisks} critical risk(s) require immediate attention. Review mitigation strategies and assign resources.`}
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            action={
              <Button size="small" danger>
                Review Now
              </Button>
            }
          />
        )}

        {/* Risk Management Table */}
        <Card 
          title={
            <Space>
              <ExclamationCircleOutlined style={{ color: '#722ed1' }} />
              <Text strong>Risk Register</Text>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Table
            columns={riskColumns}
            dataSource={risks}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        </Card>

        {/* Mitigation Timeline */}
        <Card 
          title={
            <Space>
              <ClockCircleOutlined style={{ color: '#faad14' }} />
              <Text strong>Mitigation Timeline</Text>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Timeline
            items={mitigations.map(mitigation => ({
              color: mitigation.status === 'completed' ? 'green' : 
                     mitigation.status === 'in_progress' ? 'blue' : 'gray',
              children: (
                <div>
                  <Text strong>{mitigation.action}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Assigned to: {mitigation.assignedTo} | Due: {dayjs(mitigation.dueDate).format('MMM DD')}
                  </Text>
                  <Tag 
                    color={mitigation.status === 'completed' ? 'green' : 
                           mitigation.status === 'in_progress' ? 'blue' : 'default'}
                    style={{ marginLeft: '8px' }}
                  >
                    {mitigation.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                </div>
              ),
            }))}
          />
        </Card>
      </Space>

      {/* Risk Detail Modal */}
      <Modal
        title={selectedRisk ? `Risk: ${selectedRisk.title}` : 'Add New Risk'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedRisk(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedRisk ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Category:</Text>
                <br />
                <Tag color="blue">{selectedRisk.category.toUpperCase()}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>Severity:</Text>
                <br />
                <Tag color={getSeverityColor(selectedRisk.severity)}>
                  {selectedRisk.severity.toUpperCase()}
                </Tag>
              </Col>
            </Row>
            <Divider />
            <div>
              <Text strong>Description:</Text>
              <br />
              <Text>{selectedRisk.description}</Text>
            </div>
            <Divider />
            <div>
              <Text strong>Mitigation Strategy:</Text>
              <br />
              <Text>{selectedRisk.mitigation}</Text>
            </div>
            <Divider />
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Probability:</Text>
                <br />
                <Progress percent={selectedRisk.probability} />
              </Col>
              <Col span={8}>
                <Text strong>Impact:</Text>
                <br />
                <Progress percent={selectedRisk.impact} />
              </Col>
              <Col span={8}>
                <Text strong>Risk Score:</Text>
                <br />
                <Text strong style={{ fontSize: '18px', color: getSeverityColor(selectedRisk.severity) }}>
                  {calculateRiskScore(selectedRisk.probability, selectedRisk.impact)}/100
                </Text>
              </Col>
            </Row>
          </Space>
        ) : (
          <Form layout="vertical" form={form}>
            <Form.Item label="Risk Title" name="title" rules={[{ required: true }]}>
              <Input placeholder="Enter risk title" />
            </Form.Item>
            <Form.Item label="Category" name="category" rules={[{ required: true }]}>
              <Select placeholder="Select category">
                <Option value="financial">Financial</Option>
                <Option value="operational">Operational</Option>
                <Option value="strategic">Strategic</Option>
                <Option value="compliance">Compliance</Option>
                <Option value="technology">Technology</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Description" name="description" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="Describe the risk" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit">Save Risk</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};
