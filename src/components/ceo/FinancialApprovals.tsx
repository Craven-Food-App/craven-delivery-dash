import React from 'react';
import { Card, List, Button, Tag, Space, Statistic, Row, Col } from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

export const FinancialApprovals: React.FC = () => {
  const pendingApprovals = [
    {
      id: '1',
      title: 'Marketing Campaign Q1 2026',
      type: 'Marketing Expense',
      amount: 25000,
      requestedBy: 'Marketing Director',
      date: '2 hours ago',
      priority: 'high',
      description: 'Digital advertising campaign for Q1',
    },
    {
      id: '2',
      title: 'Server Infrastructure Upgrade',
      type: 'Technology Expense',
      amount: 15000,
      requestedBy: 'CTO',
      date: '1 day ago',
      priority: 'normal',
      description: 'Upgrade cloud servers for better performance',
    },
    {
      id: '3',
      title: 'New Hire Salary - Senior Developer',
      type: 'Salary',
      amount: 8500,
      requestedBy: 'HR Manager',
      date: '3 days ago',
      priority: 'urgent',
      description: 'Monthly salary for new senior developer',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Financial Approvals</h2>
        <p className="text-slate-600">Review and approve high-value transactions</p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Approvals"
              value={3}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Amount"
              value={48500}
              prefix="$"
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Approved This Month"
              value={12}
              valueStyle={{ color: '#059669' }}
            />
          </Card>
        </Col>
      </Row>

      <List
        dataSource={pendingApprovals}
        renderItem={(item) => (
          <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                  <Tag color={item.priority === 'urgent' ? 'red' : item.priority === 'high' ? 'orange' : 'blue'}>
                    {item.priority.toUpperCase()}
                  </Tag>
                </div>
                <p className="text-slate-600 mb-2">{item.description}</p>
                <Space size="large">
                  <span className="text-sm text-slate-500">
                    <strong>Type:</strong> {item.type}
                  </span>
                  <span className="text-sm text-slate-500">
                    <strong>Requested by:</strong> {item.requestedBy}
                  </span>
                  <span className="text-sm text-slate-500 flex items-center gap-1">
                    <ClockCircleOutlined /> {item.date}
                  </span>
                </Space>
              </div>
              <div className="text-right ml-6">
                <div className="text-3xl font-bold text-blue-600 mb-4">
                  ${item.amount.toLocaleString()}
                </div>
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    size="large"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    size="large"
                  >
                    Reject
                  </Button>
                  <Button size="large">More Info</Button>
                </Space>
              </div>
            </div>
          </Card>
        )}
      />
    </div>
  );
};

