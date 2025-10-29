import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Tag, Space, Input, Modal, Form, Select, InputNumber, 
  DatePicker, message, Popconfirm, Statistic, Card, Row, Col, Typography, 
  Progress, Avatar, Tooltip, Badge, Divider, Alert
} from 'antd';
import {
  UserAddOutlined,
  DeleteOutlined,
  RiseOutlined,
  DollarOutlined,
  TeamOutlined,
  SearchOutlined,
  CrownOutlined,
  TrophyOutlined,
  TrendingUpOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department_id: string;
  department?: { name: string };
  employment_type: string;
  employment_status: string;
  salary: number;
  hire_date: string;
  employee_number: string;
}

interface Department {
  id: string;
  name: string;
  description: string;
}

export const PersonnelManager: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPromoteModalVisible, setIsPromoteModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [promoteForm] = Form.useForm();

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      message.error('Failed to load departments');
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name)
        `)
        .order('hire_date', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleHire = async (values: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            position: values.position,
            department_id: values.department_id,
            employment_type: values.employment_type,
            salary: values.salary,
            hire_date: values.hire_date ? dayjs(values.hire_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            work_location: values.work_location,
            remote_allowed: values.remote_allowed || false,
            hired_by: user?.id,
          }
        ])
        .select();

      if (error) throw error;

      // Log to employee history
      if (data && data[0]) {
        await supabase.from('employee_history').insert([
          {
            employee_id: data[0].id,
            action_type: 'hired',
            new_position: values.position,
            new_salary: values.salary,
            new_department_id: values.department_id,
            effective_date: values.hire_date || new Date().toISOString(),
            performed_by: user?.id,
            notes: 'Initial hire',
          }
        ]);
      }

      message.success(`🎉 ${values.first_name} ${values.last_name} hired successfully!`);
      setIsModalVisible(false);
      form.resetFields();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error hiring employee:', error);
      message.error(error.message || 'Failed to hire employee');
    }
  };

  const handlePromote = async (values: any) => {
    if (!selectedEmployee) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('employees')
        .update({
          position: values.new_position,
          salary: values.new_salary,
          department_id: values.new_department_id || selectedEmployee.department_id,
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      // Log promotion
      await supabase.from('employee_history').insert([
        {
          employee_id: selectedEmployee.id,
          action_type: 'promoted',
          previous_position: selectedEmployee.position,
          new_position: values.new_position,
          previous_salary: selectedEmployee.salary,
          new_salary: values.new_salary,
          previous_department_id: selectedEmployee.department_id,
          new_department_id: values.new_department_id || selectedEmployee.department_id,
          effective_date: new Date().toISOString(),
          reason: values.reason,
          performed_by: user?.id,
        }
      ]);

      message.success(`✅ ${selectedEmployee.first_name} ${selectedEmployee.last_name} promoted successfully!`);
      setIsPromoteModalVisible(false);
      promoteForm.resetFields();
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error promoting employee:', error);
      message.error(error.message || 'Failed to promote employee');
    }
  };

  const handleTerminate = async (employee: Employee) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('employees')
        .update({
          employment_status: 'terminated',
          termination_date: new Date().toISOString(),
          terminated_by: user?.id,
        })
        .eq('id', employee.id);

      if (error) throw error;

      // Log termination
      await supabase.from('employee_history').insert([
        {
          employee_id: employee.id,
          action_type: 'terminated',
          effective_date: new Date().toISOString(),
          performed_by: user?.id,
        }
      ]);

      message.success(`${employee.first_name} ${employee.last_name} has been terminated`);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error terminating employee:', error);
      message.error(error.message || 'Failed to terminate employee');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    searchText === '' || 
    emp.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchText.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Employee #',
      dataIndex: 'employee_number',
      key: 'employee_number',
      width: 120,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: Employee) => `${record.first_name} ${record.last_name}`,
      sorter: (a: Employee, b: Employee) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Department',
      key: 'department',
      render: (_: any, record: Employee) => record.department?.name || 'N/A',
      filters: departments.map(d => ({ text: d.name, value: d.id })),
      onFilter: (value: any, record: Employee) => record.department_id === value,
    },
    {
      title: 'Type',
      dataIndex: 'employment_type',
      key: 'employment_type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          'full-time': 'blue',
          'part-time': 'cyan',
          'contract': 'orange',
          'intern': 'purple',
        };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) => salary ? `$${salary.toLocaleString()}` : 'N/A',
      sorter: (a: Employee, b: Employee) => (a.salary || 0) - (b.salary || 0),
    },
    {
      title: 'Hire Date',
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
      sorter: (a: Employee, b: Employee) => dayjs(a.hire_date).unix() - dayjs(b.hire_date).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'employment_status',
      key: 'employment_status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          'on-leave': 'orange',
          suspended: 'red',
          terminated: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'On Leave', value: 'on-leave' },
        { text: 'Terminated', value: 'terminated' },
      ],
      onFilter: (value: any, record: Employee) => record.employment_status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Space size="small">
          {record.employment_status === 'active' && (
            <>
              <Button 
                type="link" 
                icon={<RiseOutlined />} 
                size="small"
                onClick={() => {
                  setSelectedEmployee(record);
                  promoteForm.setFieldsValue({
                    current_position: record.position,
                    current_salary: record.salary,
                  });
                  setIsPromoteModalVisible(true);
                }}
              >
                Promote
              </Button>
              <Popconfirm
                title="Are you sure you want to terminate this employee?"
                description="This action cannot be undone easily."
                onConfirm={() => handleTerminate(record)}
                okText="Yes, Terminate"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" danger icon={<DeleteOutlined />} size="small">
                  Terminate
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const activeEmployees = employees.filter(e => e.employment_status === 'active');
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const recentHires = employees.filter(e => dayjs(e.hire_date).isAfter(dayjs().subtract(30, 'days')));

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              <TeamOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Personnel Management
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Comprehensive workforce oversight and management
            </Text>
          </div>
          <Space>
            <Search
              placeholder="Search personnel..."
              allowClear
              onSearch={setSearchText}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              size="large"
              onClick={() => setIsModalVisible(true)}
              style={{ borderRadius: '8px' }}
            >
              Hire New Employee
            </Button>
          </Space>
        </div>

        {/* Enhanced Metrics Dashboard */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
                border: '1px solid #0ea5e9',
                borderRadius: '12px'
              }}
            >
              <Statistic
                title={<Text type="secondary">Total Employees</Text>}
                value={employees.length}
                prefix={<TeamOutlined style={{ color: '#0ea5e9' }} />}
                valueStyle={{ color: '#0c4a6e', fontSize: '28px' }}
              />
              <Progress 
                percent={Math.min((employees.length / 100) * 100, 100)} 
                showInfo={false} 
                strokeColor="#0ea5e9"
                style={{ marginTop: '8px' }}
              />
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
                title={<Text type="secondary">Active Employees</Text>}
                value={activeEmployees.length}
                prefix={<UserOutlined style={{ color: '#22c55e' }} />}
                valueStyle={{ color: '#15803d', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {Math.round((activeEmployees.length / employees.length) * 100)}% of total
              </Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                border: '1px solid #ef4444',
                borderRadius: '12px'
              }}
            >
              <Statistic
                title={<Text type="secondary">Monthly Payroll</Text>}
                value={Math.round(totalPayroll / 12)}
                prefix={<DollarOutlined style={{ color: '#ef4444' }} />}
                precision={0}
                valueStyle={{ color: '#dc2626', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Annual: ${totalPayroll.toLocaleString()}
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
                title={<Text type="secondary">Recent Hires</Text>}
                value={recentHires.length}
                prefix={<CalendarOutlined style={{ color: '#f59e0b' }} />}
                valueStyle={{ color: '#d97706', fontSize: '28px' }}
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Last 30 days
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Department Overview */}
        <Card 
          title={
            <Space>
              <BankOutlined style={{ color: '#1890ff' }} />
              <Text strong>Department Overview</Text>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Row gutter={[16, 16]}>
            {departments.map(dept => {
              const deptEmployees = employees.filter(e => e.department_id === dept.id);
              const deptPayroll = deptEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);
              return (
                <Col xs={24} sm={12} lg={8} key={dept.id}>
                  <Card 
                    size="small" 
                    style={{ 
                      background: '#fafafa',
                      borderRadius: '8px',
                      border: '1px solid #d9d9d9'
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{dept.name}</Text>
                        <Badge count={deptEmployees.length} style={{ backgroundColor: '#1890ff' }} />
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dept.description}
                      </Text>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Payroll: ${Math.round(deptPayroll / 12).toLocaleString()}/mo
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Avg: ${Math.round(deptPayroll / deptEmployees.length).toLocaleString()}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Card>

        {/* Employee Table */}
        <Card 
          title={
            <Space>
              <CrownOutlined style={{ color: '#faad14' }} />
              <Text strong>Employee Directory</Text>
            </Space>
          }
          style={{ borderRadius: '12px' }}
        >
          <Table
            columns={columns}
            dataSource={filteredEmployees}
            rowKey="id"
            loading={loading}
            pagination={{ 
              pageSize: 10, 
              showSizeChanger: true, 
              showTotal: (total) => `Total ${total} employees`,
              showQuickJumper: true
            }}
            scroll={{ x: 1200 }}
            style={{ borderRadius: '8px' }}
          />
        </Card>
      </Space>

      {/* Hire Modal */}
      <Modal
        title="🎯 Hire New Employee"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form layout="vertical" form={form} onFinish={handleHire}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="John" />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Smith" />
            </Form.Item>
          </div>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
          >
            <Input placeholder="employee@craven.com" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="(555) 123-4567" />
          </Form.Item>

          <Form.Item
            label="Position Title"
            name="position"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Senior Operations Manager, Marketing Director" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Department"
              name="department_id"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Employment Type"
              name="employment_type"
              rules={[{ required: true, message: 'Required' }]}
              initialValue="full-time"
            >
              <Select>
                <Option value="full-time">Full-Time</Option>
                <Option value="part-time">Part-Time</Option>
                <Option value="contract">Contract</Option>
                <Option value="intern">Intern</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Annual Salary"
              name="salary"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                min={30000}
                max={1000000}
                step={5000}
              />
            </Form.Item>

            <Form.Item
              label="Hire Date"
              name="hire_date"
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item label="Work Location" name="work_location">
            <Input placeholder="e.g., HQ - Los Angeles, Remote" />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                🎉 Hire Employee
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Promote Modal */}
      <Modal
        title={`⬆️ Promote ${selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employee'}`}
        open={isPromoteModalVisible}
        onCancel={() => {
          setIsPromoteModalVisible(false);
          setSelectedEmployee(null);
          promoteForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" form={promoteForm} onFinish={handlePromote}>
          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-slate-600 mb-2">Current Position:</div>
            <div className="font-semibold">{selectedEmployee?.position}</div>
            <div className="text-sm text-slate-600 mt-2 mb-2">Current Salary:</div>
            <div className="font-semibold">${selectedEmployee?.salary?.toLocaleString()}</div>
          </div>

          <Form.Item
            label="New Position"
            name="new_position"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Senior Operations Director" />
          </Form.Item>

          <Form.Item
            label="New Salary"
            name="new_salary"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={(selectedEmployee?.salary || 0) + 5000}
              step={5000}
            />
          </Form.Item>

          <Form.Item label="Transfer to Department" name="new_department_id">
            <Select placeholder="Keep current department" allowClear>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Reason for Promotion"
            name="reason"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input.TextArea rows={3} placeholder="Excellent performance, leadership skills, etc." />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsPromoteModalVisible(false);
                setSelectedEmployee(null);
                promoteForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                ✅ Confirm Promotion
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
