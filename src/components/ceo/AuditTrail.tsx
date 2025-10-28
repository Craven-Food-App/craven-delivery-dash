import React from 'react';
import { Table, Tag, Badge } from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';

export const AuditTrail: React.FC = () => {
  const mockAuditData = [
    {
      key: '1',
      timestamp: '2025-10-28 16:45:23',
      user: 'Torrance Stroman',
      action: 'Approved Expense',
      resource: 'Financial Approval',
      details: 'Marketing Campaign - $25,000',
      ipAddress: '192.168.1.100',
    },
    {
      key: '2',
      timestamp: '2025-10-28 15:30:12',
      user: 'Torrance Stroman',
      action: 'Hired Employee',
      resource: 'Personnel',
      details: 'John Smith - Senior Admin',
      ipAddress: '192.168.1.100',
    },
    {
      key: '3',
      timestamp: '2025-10-28 14:15:45',
      user: 'Torrance Stroman',
      action: 'Promoted Employee',
      resource: 'Personnel',
      details: 'Sarah Johnson to CFO',
      ipAddress: '192.168.1.100',
    },
  ];

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => (
        <span className="flex items-center gap-2">
          <UserOutlined />
          <strong>{user}</strong>
        </span>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => {
        let color = 'blue';
        if (action.includes('Approved')) color = 'green';
        if (action.includes('Rejected')) color = 'red';
        if (action.includes('Deleted') || action.includes('Terminated')) color = 'red';
        if (action.includes('Hired') || action.includes('Created')) color = 'green';

        return <Tag color={color}>{action}</Tag>;
      },
    },
    {
      title: 'Resource',
      dataIndex: 'resource',
      key: 'resource',
    },
    {
      title: 'Details',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip: string) => <code className="text-xs">{ip}</code>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Audit Trail</h2>
        <p className="text-slate-600">Complete log of all CEO actions and decisions</p>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <Badge status="processing" />
          <span className="text-blue-900 font-semibold">
            Live monitoring enabled - All actions are logged in real-time
          </span>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={mockAuditData}
        pagination={{ pageSize: 20 }}
        className="shadow-lg"
      />
    </div>
  );
};

