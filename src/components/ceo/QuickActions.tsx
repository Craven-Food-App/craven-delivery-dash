import React, { useState } from 'react';
import { Card, Row, Col, Button, message } from 'antd';
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
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MeetingScheduler } from './MeetingScheduler';
import { ReportsViewer } from './ReportsViewer';

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
      icon: <UserAddOutlined className="text-3xl" />,
      color: 'from-blue-500 to-blue-600',
      action: () => {
        logAction('navigate_hire', 'Navigated to hire employee');
        // Personnel tab is already open, just scroll to top
        message.info('Click "Hire New Employee" button in Personnel tab');
      },
    },
    {
      title: 'Approve Budget',
      icon: <DollarOutlined className="text-3xl" />,
      color: 'from-green-500 to-green-600',
      action: () => {
        logAction('navigate_approvals', 'Navigated to financial approvals');
        message.info('Switch to "Financial Approvals" tab');
      },
    },
    {
      title: 'View Reports',
      icon: <FileTextOutlined className="text-3xl" />,
      color: 'from-purple-500 to-purple-600',
      action: async () => {
        await logAction('view_reports', 'Accessed company reports');
        setReportsModalVisible(true);
      },
    },
    {
      title: 'Send Alert',
      icon: <BellOutlined className="text-3xl" />,
      color: 'from-red-500 to-red-600',
      action: async () => {
        await logAction('send_alert', 'Prepared to send company-wide alert');
        message.info('Alert system ready - check Emergency tab');
      },
    },
    {
      title: 'Pause Orders',
      icon: <PauseCircleOutlined className="text-3xl" />,
      color: 'from-orange-500 to-orange-600',
      action: async () => {
        await logAction('toggle_orders', 'Toggled order acceptance');
        message.info('Go to Emergency Controls tab');
      },
    },
    {
      title: 'View Metrics',
      icon: <BarChartOutlined className="text-3xl" />,
      color: 'from-cyan-500 to-cyan-600',
      action: async () => {
        await logAction('view_metrics', 'Viewed company metrics dashboard');
        message.info('Metrics displayed at top of page');
      },
    },
    {
      title: 'Launch Initiative',
      icon: <RocketOutlined className="text-3xl" />,
      color: 'from-indigo-500 to-indigo-600',
      action: () => {
        logAction('launch_initiative', 'Navigated to strategic planning');
        message.info('Go to Strategic Planning tab');
      },
    },
    {
      title: 'Team Meeting',
      icon: <TeamOutlined className="text-3xl" />,
      color: 'from-pink-500 to-pink-600',
      action: async () => {
        await logAction('schedule_meeting', 'Opened meeting scheduler');
        setMeetingModalVisible(true);
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Actions</h2>
        <p className="text-slate-600">Common CEO actions - one click away</p>
      </div>

      <Row gutter={[16, 16]}>
        {actions.map((action, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              className={`cursor-pointer hover:shadow-xl transition-all duration-300 bg-gradient-to-br ${action.color} border-0`}
              onClick={action.action}
            >
              <div className="text-center text-white">
                <div className="mb-3">{action.icon}</div>
                <h3 className="text-lg font-semibold">{action.title}</h3>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modals */}
      <MeetingScheduler visible={meetingModalVisible} onClose={() => setMeetingModalVisible(false)} />
      <ReportsViewer visible={reportsModalVisible} onClose={() => setReportsModalVisible(false)} />
    </div>
  );
};
