import React, { useState } from 'react';
import { Table, Button, Tag, Space, Input, Modal, Form, Select, InputNumber, DatePicker, message } from 'antd';
import {
  UserAddOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';

const { Search } = Input;
const { Option } = Select;

export const PersonnelManager: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const mockPersonnel = [
    {
      key: '1',
      name: 'John Smith',
      email: 'john@craven.com',
      position: 'Senior Admin',
      department: 'Operations',
      type: 'admin',
      salary: 85000,
      hireDate: '2023-01-15',
      status: 'active',
      performance: 4.8,
    },
    {
      key: '2',
      name: 'Sarah Johnson',
      email: 'sarah@craven.com',
      position: 'CFO',
      department: 'Finance',
      type: 'executive',
      salary: 150000,
      hireDate: '2022-03-10',
      status: 'active',
      performance: 4.9,
    },
    {
      key: '3',
      name: 'Mike Davis',
      email: 'mike@craven.com',
      position: 'Support Lead',
      department: 'Customer Support',
      type: 'support',
      salary: 65000,
      hireDate: '2023-06-01',
      status: 'active',
      performance: 4.5,
    },
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      filters: [
        { text: 'Operations', value: 'Operations' },
        { text: 'Finance', value: 'Finance' },
        { text: 'Customer Support', value: 'Customer Support' },
      ],
      onFilter: (value: any, record: any) => record.department === value,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          admin: 'blue',
          executive: 'purple',
          support: 'green',
          operations: 'orange',
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) => `$${salary.toLocaleString()}`,
      sorter: (a: any, b: any) => a.salary - b.salary,
    },
    {
      title: 'Performance',
      dataIndex: 'performance',
      key: 'performance',
      render: (performance: number) => (
        <span className={performance >= 4.5 ? 'text-green-600 font-bold' : 'text-yellow-600'}>
          ★ {performance}
        </span>
      ),
      sorter: (a: any, b: any) => a.performance - b.performance,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" icon={<RiseOutlined />} size="small">
            Promote
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small">
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            Terminate
          </Button>
        </Space>
      ),
    },
  ];

  const handleHire = (values: any) => {
    console.log('Hiring new personnel:', values);
    message.success('Personnel hired successfully!');
    setIsModalVisible(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Personnel Management</h2>
          <p className="text-slate-600">Hire, manage, and monitor all employees</p>
        </div>
        <Space>
          <Search
            placeholder="Search personnel..."
            allowClear
            onSearch={setSearchText}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="large"
            onClick={() => setIsModalVisible(true)}
          >
            Hire New Employee
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={mockPersonnel}
        pagination={{ pageSize: 10 }}
        className="shadow-lg"
      />

      {/* Hire Modal */}
      <Modal
        title="Hire New Employee"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical" onFinish={handleHire}>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="employee@craven.com" />
          </Form.Item>

          <Form.Item
            label="Employee Type"
            name="type"
            rules={[{ required: true, message: 'Please select employee type' }]}
          >
            <Select placeholder="Select type">
              <Option value="admin">Admin</Option>
              <Option value="executive">Executive</Option>
              <Option value="support">Support</Option>
              <Option value="operations">Operations</Option>
              <Option value="finance">Finance</Option>
              <Option value="marketing">Marketing</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Position Title"
            name="position"
            rules={[{ required: true, message: 'Please enter position title' }]}
          >
            <Input placeholder="e.g., Senior Admin, Operations Manager" />
          </Form.Item>

          <Form.Item label="Department" name="department">
            <Input placeholder="e.g., Operations, Finance" />
          </Form.Item>

          <Form.Item
            label="Annual Salary"
            name="salary"
            rules={[{ required: true, message: 'Please enter salary' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={30000}
              max={500000}
            />
          </Form.Item>

          <Form.Item
            label="Hire Date"
            name="hireDate"
            rules={[{ required: true, message: 'Please select hire date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Hire Employee
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

