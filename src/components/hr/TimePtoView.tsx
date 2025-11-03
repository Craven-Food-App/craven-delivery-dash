// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus, Clock, Users } from 'lucide-react';
import { Card, Table, Tag, Button, Space, message, Statistic, Row, Col } from 'antd';
import { supabase } from '@/integrations/supabase/client';

interface PtoRequest {
  id: number;
  employee: string;
  dates: string;
  type: 'Vacation' | 'Sick Day' | 'Personal';
  status: 'Pending' | 'Approved' | 'Declined';
  days: number;
}

interface ClockedInEmployee {
  id: string;
  user_id: string;
  clock_in_at: string;
  employee_name: string;
  department?: string;
  position?: string;
  duration: string;
}

const mockPtoRequests: PtoRequest[] = [
  { id: 1, employee: 'Alice Johnson', dates: '2025-12-24 to 2025-12-26', type: 'Vacation', status: 'Pending', days: 3 },
  { id: 2, employee: 'Bob Smith', dates: '2025-11-15', type: 'Sick Day', status: 'Approved', days: 1 },
  { id: 3, employee: 'Charlie Brown', dates: '2025-12-01', type: 'Personal', status: 'Pending', days: 1 },
];

// Format time helper
const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

// Calculate duration
const calculateDuration = (start: Date | string, end: Date | string): string => {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  const diffMs = endDate.getTime() - startDate.getTime();
  const seconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

const TimePtoView: React.FC = () => {
  const [clockedInEmployees, setClockedInEmployees] = useState<ClockedInEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch currently clocked in employees
  useEffect(() => {
    fetchClockedInEmployees();
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchClockedInEmployees();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchClockedInEmployees = async () => {
    try {
      // Get all time entries that are currently clocked in
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select(`
          id,
          user_id,
          clock_in_at,
          employee_id,
          exec_user_id,
          employees:employee_id (
            first_name,
            last_name,
            department,
            position
          ),
          exec_users:exec_user_id (
            user_id
          )
        `)
        .eq('status', 'clocked_in')
        .is('clock_out_at', null)
        .order('clock_in_at', { ascending: false });

      if (error) {
        console.error('Error fetching clocked in employees:', error);
        setLoading(false);
        return;
      }

      if (entries) {
        // Fetch names and build employee list
        const employeesWithNames = await Promise.all(
          entries.map(async (entry: any) => {
            let name = 'Unknown';
            let department = '';
            let position = '';

            // If entry has employee data, use it
            if (entry.employees && entry.employees.first_name) {
              name = `${entry.employees.first_name} ${entry.employees.last_name}`;
              department = entry.employees.department || '';
              position = entry.employees.position || '';
            } 
            // If entry has exec_user data, fetch name from user_profiles
            else if (entry.exec_users && entry.exec_users.user_id) {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('full_name, email')
                .eq('user_id', entry.exec_users.user_id)
                .single();
              if (profile?.full_name) {
                name = profile.full_name;
              } else if (profile?.email) {
                name = profile.email;
              }
            }

            // Calculate duration
            const duration = calculateDuration(entry.clock_in_at, new Date());

            return {
              id: entry.id,
              user_id: entry.user_id,
              clock_in_at: entry.clock_in_at,
              employee_name: name,
              department: department,
              position: position,
              duration: duration,
            };
          })
        );

        setClockedInEmployees(employeesWithNames);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching clocked in employees:', error);
      setLoading(false);
    }
  };

  const pendingRequests = mockPtoRequests.filter(r => r.status === 'Pending');

  const getStatusStyle = (status: PtoRequest['status']) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Pending': return 'warning';
      case 'Declined': return 'error';
      default: return 'default';
    }
  };

  // Columns for currently clocked in employees
  const clockedInColumns = [
    {
      title: 'Employee Name',
      dataIndex: 'employee_name',
      key: 'employee_name',
      render: (text: string, record: ClockedInEmployee) => (
        <div>
          <div style={{ fontWeight: 600 }}>{text}</div>
          {record.position && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.position}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text: string) => text || <span style={{ color: '#999' }}>N/A</span>,
    },
    {
      title: 'Clock In Time',
      dataIndex: 'clock_in_at',
      key: 'clock_in_at',
      render: (text: string) => {
        const date = new Date(text);
        return (
          <div>
            <div>{date.toLocaleDateString()}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{formatTime(date)}</div>
          </div>
        );
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (text: string) => (
        <Tag color="green" style={{ fontFamily: 'monospace', fontSize: '14px' }}>
          {text}
        </Tag>
      ),
    },
  ];

  // Columns for PTO requests
  const ptoColumns = [
    {
      title: 'Employee',
      dataIndex: 'employee',
      key: 'employee',
    },
    {
      title: 'Dates',
      dataIndex: 'dates',
      key: 'dates',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: PtoRequest['status']) => (
        <Tag color={getStatusStyle(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (record: PtoRequest) => (
        record.status === 'Pending' ? (
          <Space>
            <Button type="link" size="small" style={{ color: '#52c41a' }}>
              Approve
            </Button>
            <Button type="link" size="small" danger>
              Decline
            </Button>
          </Space>
        ) : (
          <span style={{ color: '#999' }}>N/A</span>
        )
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Currently Clocked In Employees */}
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '24px' }}>
            <Users style={{ width: '24px', height: '24px', marginRight: '8px', color: '#ff7a45' }} />
            Currently Clocked In ({clockedInEmployees.length})
          </span>
        }
      >
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          View all employees and executives who are currently clocked in and working.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Clock style={{ width: '32px', height: '32px', marginBottom: '16px', color: '#999' }} />
            <p style={{ color: '#999' }}>Loading clock data...</p>
          </div>
        ) : clockedInEmployees.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Users style={{ width: '48px', height: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
            <p style={{ color: '#999', fontSize: '16px' }}>No employees currently clocked in</p>
          </div>
        ) : (
          <Table
            columns={clockedInColumns}
            dataSource={clockedInEmployees}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
        )}
      </Card>

      {/* Manager Approval Section */}
      <Card
        title={
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '24px' }}>
            <CalendarClock style={{ width: '24px', height: '24px', marginRight: '8px', color: '#ff7a45' }} />
            Manager PTO Approval Queue ({pendingRequests.length} Pending)
          </span>
        }
      >
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          Review and action pending time-off requests from your direct reports.
        </p>

        <Table
          columns={ptoColumns}
          dataSource={mockPtoRequests}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default TimePtoView;

