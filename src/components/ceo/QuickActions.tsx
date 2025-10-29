import React, { useState } from 'react';
import { Card, Row, Col, Button, message, Typography, Space, Badge, Tooltip } from 'antd';
import {
  UserAddOutlined,
  DollarOutlined,
  RocketOutlined,
  BellOutlined,
  PauseCircleOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  SafetyOutlined,
  GlobalOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MeetingScheduler } from './MeetingScheduler';
import { ReportsViewer } from './ReportsViewer';

const { Title, Text } = Typography;

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [reportsModalVisible, setReportsModalVisible] = useState(false);

  const logAction = async (action: string, description: string) => {
    try {
      await supabase.rpc('log_ceo_action', {
        p_action_type: action,
        p_action_category: 'system',
        p_target_type: 'quick_action',
        p_target_id: null,
        p_target_name: action,
        p_description: description,
        p_severity: 'normal'
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const actions = [
    {
      title: 'Hire Employee',
      description: 'Add new team member',
      icon: <UserAddOutlined style={{ fontSize: '24px' }} />,
      color: '#1890ff',
      type: 'primary' as const,
      action: () => {
        logAction('navigate_hire', 'Navigated to hire employee');
        message.info('Click "Hire New Employee" button in Personnel tab');
      },
    },
    {
      title: 'Approve Budget',
      description: 'Review financial requests',
      icon: <DollarOutlined style={{ fontSize: '24px' }} />,
      color: '#52c41a',
      type: 'success' as const,
      action: () => {
        logAction('navigate_approvals', 'Navigated to financial approvals');
        message.info('Switch to "Financial Approvals" tab');
      },
    },
    {
      title: 'View Reports',
      description: 'Company analytics',
      icon: <FileTextOutlined style={{ fontSize: '24px' }} />,
      color: '#722ed1',
      type: 'default' as const,
      action: async () => {
        await logAction('view_reports', 'Accessed company reports');
        setReportsModalVisible(true);
      },
    },
    {
      title: 'Send Alert',
      description: 'Company-wide notification',
      icon: <BellOutlined style={{ fontSize: '24px' }} />,
      color: '#f5222d',
      type: 'danger' as const,
      badge: 'urgent',
      action: async () => {
        await logAction('send_alert', 'Prepared to send company-wide alert');
        message.info('Alert system ready - check Emergency tab');
      },
    },
    {
      title: 'Pause Orders',
      description: 'Emergency stop',
      icon: <PauseCircleOutlined style={{ fontSize: '24px' }} />,
      color: '#faad14',
      type: 'warning' as const,
      action: async () => {
        await logAction('toggle_orders', 'Toggled order acceptance');
        message.info('Go to Emergency Controls tab');
      },
    },
    {
      title: 'View Metrics',
      description: 'Performance dashboard',
      icon: <BarChartOutlined style={{ fontSize: '24px' }} />,
      color: '#13c2c2',
      type: 'default' as const,
      action: async () => {
        await logAction('view_metrics', 'Viewed company metrics dashboard');
        message.info('Metrics displayed at top of page');
      },
    },
    {
      title: 'Launch Initiative',
      description: 'Strategic projects',
      icon: <RocketOutlined style={{ fontSize: '24px' }} />,
      color: '#2f54eb',
      type: 'default' as const,
      action: () => {
        logAction('launch_initiative', 'Navigated to strategic planning');
        message.info('Go to Strategic Planning tab');
      },
    },
    {
      title: 'Team Meeting',
      description: 'Schedule conference',
      icon: <TeamOutlined style={{ fontSize: '24px' }} />,
      color: '#eb2f96',
      type: 'default' as const,
      action: async () => {
        await logAction('schedule_meeting', 'Opened meeting scheduler');
        setMeetingModalVisible(true);
      },
    },
    {
      title: 'System Settings',
      description: 'Configure platform',
      icon: <SettingOutlined style={{ fontSize: '24px' }} />,
      color: '#595959',
      type: 'default' as const,
      action: () => {
        logAction('system_settings', 'Accessed system configuration');
        message.info('System settings panel');
      },
    },
    {
      title: 'Crisis Management',
      description: 'Emergency protocols',
      icon: <SafetyOutlined style={{ fontSize: '24px' }} />,
      color: '#fa541c',
      type: 'warning' as const,
      action: () => {
        logAction('crisis_management', 'Accessed crisis protocols');
        message.info('Crisis management protocols');
      },
    },
    {
      title: 'Global Operations',
      description: 'International oversight',
      icon: <GlobalOutlined style={{ fontSize: '24px' }} />,
      color: '#1890ff',
      type: 'default' as const,
      action: () => {
        logAction('global_operations', 'Accessed global operations');
        message.info('Global operations dashboard');
      },
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ margin: 0, color: '#262626' }}>
            <CrownOutlined style={{ marginRight: '8px', color: '#faad14' }} />
            Executive Command Center
          </Title>
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Critical business operations - instant access to key functions
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          {actions.map((action, index) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={index}>
              <Tooltip title={action.description} placement="top">
                <Card
                  hoverable
                  style={{
                    height: '140px',
                    borderRadius: '8px',
                    border: `2px solid ${action.color}20`,
                    background: `linear-gradient(135deg, ${action.color}10, ${action.color}05)`,
                  }}
                  bodyStyle={{
                    padding: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onClick={action.action}
                >
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <Badge 
                      count={action.badge === 'urgent' ? '!' : null} 
                      style={{ backgroundColor: action.color }}
                    >
                      <div style={{ color: action.color }}>
                        {action.icon}
                      </div>
                    </Badge>
                    <div style={{ textAlign: 'center' }}>
                      <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                        {action.title}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {action.description}
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Tooltip>
            </Col>
          ))}
        </Row>

        <Card 
          style={{ 
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            border: '1px solid #0ea5e9',
            borderRadius: '12px'
          }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title level={4} style={{ margin: 0, color: '#0c4a6e' }}>
              <ThunderboltOutlined style={{ marginRight: '8px', color: '#0ea5e9' }} />
              System Status
            </Title>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: '24px', color: '#0ea5e9' }}>99.9%</Text>
                  <br />
                  <Text type="secondary">Uptime</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: '24px', color: '#10b981' }}>12</Text>
                  <br />
                  <Text type="secondary">Active Systems</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: '24px', color: '#f59e0b' }}>3</Text>
                  <br />
                  <Text type="secondary">Pending Alerts</Text>
                </div>
              </Col>
            </Row>
          </Space>
        </Card>
      </Space>

      {/* Modals */}
      <MeetingScheduler visible={meetingModalVisible} onClose={() => setMeetingModalVisible(false)} />
      <ReportsViewer visible={reportsModalVisible} onClose={() => setReportsModalVisible(false)} />
    </div>
  );
};
