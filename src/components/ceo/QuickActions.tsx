import React from 'react';
import { Card, Row, Col, Button, Space, Statistic } from 'antd';
import {
  UserAddOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  NotificationOutlined,
  SettingOutlined,
  TeamOutlined,
  ShopOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Hire New Admin',
      icon: <UserAddOutlined className="text-4xl text-blue-600" />,
      description: 'Add new admin to operations team',
      action: () => console.log('Hire Admin'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Approve Expenses',
      icon: <DollarOutlined className="text-4xl text-green-600" />,
      description: '3 pending approvals',
      action: () => console.log('Approve Expenses'),
      color: 'from-green-500 to-green-600',
      badge: 3,
    },
    {
      title: 'Emergency Controls',
      icon: <ThunderboltOutlined className="text-4xl text-red-600" />,
      description: 'System-wide controls',
      action: () => console.log('Emergency'),
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Broadcast Message',
      icon: <NotificationOutlined className="text-4xl text-purple-600" />,
      description: 'Send announcement to all',
      action: () => console.log('Broadcast'),
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Admin Portal',
      icon: <SettingOutlined className="text-4xl text-slate-600" />,
      description: 'Jump to operations',
      action: () => navigate('/admin'),
      color: 'from-slate-500 to-slate-600',
    },
    {
      title: 'Board Portal',
      icon: <TeamOutlined className="text-4xl text-indigo-600" />,
      description: 'Executive dashboard',
      action: () => navigate('/board'),
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'View Merchants',
      icon: <ShopOutlined className="text-4xl text-orange-600" />,
      description: '156 active partners',
      action: () => navigate('/admin'),
      color: 'from-orange-500 to-orange-600',
    },
    {
      title: 'View Feeders',
      icon: <CarOutlined className="text-4xl text-teal-600" />,
      description: '487 active drivers',
      action: () => navigate('/admin'),
      color: 'from-teal-500 to-teal-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Quick Actions</h2>
        <p className="text-slate-600">One-click access to critical functions</p>
      </div>

      <Row gutter={[24, 24]}>
        {quickActions.map((action, index) => (
          <Col key={index} xs={24} sm={12} lg={6}>
            <Card
              hoverable
              className={`bg-gradient-to-br ${action.color} border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer h-full`}
              onClick={action.action}
            >
              <div className="text-center text-white">
                <div className="mb-4">{action.icon}</div>
                <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
                {action.badge && (
                  <div className="mt-4">
                    <span className="bg-white text-slate-900 px-3 py-1 rounded-full text-sm font-bold">
                      {action.badge} pending
                    </span>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* System Status */}
      <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">System Status</h3>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Statistic
              title="Platform Uptime"
              value={99.98}
              precision={2}
              suffix="%"
              valueStyle={{ color: '#059669', fontWeight: 'bold' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Response Time"
              value={124}
              suffix="ms"
              valueStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Statistic
              title="Active Users"
              value={1247}
              valueStyle={{ color: '#8b5cf6', fontWeight: 'bold' }}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
};

