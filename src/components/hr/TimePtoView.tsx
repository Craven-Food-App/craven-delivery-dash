// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { CalendarClock, Plus } from 'lucide-react';
import { Card, Table, Tag, Button, Space, message } from 'antd';
import { supabase } from '@/integrations/supabase/client';

interface PtoRequest {
  id: number;
  employee: string;
  dates: string;
  type: 'Vacation' | 'Sick Day' | 'Personal';
  status: 'Pending' | 'Approved' | 'Declined';
  days: number;
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

const TimePtoView: React.FC = () => {
  const [clockStatus, setClockStatus] = useState<{
    status: 'Clocked In' | 'Clocked Out';
    lastAction: string;
    weeklyHours: number;
    hoursToday: number;
    clockInAt: string | null;
  }>({
    status: 'Clocked Out',
    lastAction: 'N/A',
    weeklyHours: 0,
    hoursToday: 0,
    clockInAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);

  // Fetch clock data
  useEffect(() => {
    fetchClockData();
    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchClockData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchClockData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!employee) {
        setLoading(false);
        return;
      }
      
      const { data: status, error } = await supabase.rpc('get_employee_clock_status', {
        p_employee_id: employee.id
      });
      
      if (error) {
        console.error('Error fetching clock status:', error);
        setLoading(false);
        return;
      }
      
      if (status && status.length > 0) {
        const s = status[0];
        setClockStatus({
          status: s.is_clocked_in ? 'Clocked In' : 'Clocked Out',
          lastAction: s.clock_in_at 
            ? `${new Date(s.clock_in_at).toLocaleDateString()} ${formatTime(s.clock_in_at)}`
            : 'N/A',
          weeklyHours: parseFloat(s.weekly_hours) || 0,
          hoursToday: parseFloat(s.total_hours_today) || 0,
          clockInAt: s.clock_in_at,
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clock data:', error);
      setLoading(false);
    }
  };

  const handleClockAction = async () => {
    setClockLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setClockLoading(false);
        return;
      }
      
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (!employee) {
        setClockLoading(false);
        return;
      }
      
      if (clockStatus.status === 'Clocked In') {
        // Clock out
        const { error } = await supabase.rpc('clock_out', {
          p_employee_id: employee.id,
          p_break_duration_minutes: 0
        });
        
        if (error) {
          message.error('Failed to clock out: ' + error.message);
          setClockLoading(false);
          return;
        }
        message.success('Clocked out successfully');
      } else {
        // Clock in
        const { error } = await supabase.rpc('clock_in', {
          p_employee_id: employee.id,
          p_work_location: null
        });
        
        if (error) {
          message.error('Failed to clock in: ' + error.message);
          setClockLoading(false);
          return;
        }
        message.success('Clocked in successfully');
      }
      
      await fetchClockData();
      setClockLoading(false);
    } catch (error: any) {
      message.error('Failed to perform clock action: ' + error.message);
      setClockLoading(false);
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

  const columns = [
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
      {/* Employee Self-Service Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card
          style={{
            gridColumn: 'span 2',
            background: clockStatus.status === 'Clocked In' 
              ? 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)'
              : 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '300px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <CalendarClock style={{ width: '32px', height: '32px' }} />
          </div>
          
          {/* Large Status Indicator */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            textAlign: 'center',
            margin: '24px 0',
          }}>
            <div style={{
              fontSize: '72px',
              fontWeight: 900,
              letterSpacing: '4px',
              marginBottom: '16px',
              textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              lineHeight: 1,
            }}>
              {clockStatus.status.toUpperCase()}
            </div>
            <div style={{
              fontSize: '18px',
              opacity: 0.95,
              fontWeight: 500,
            }}>
              {clockStatus.status === 'Clocked In' ? 'You are currently working' : 'You are currently off'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', textAlign: 'center' }}>
              Last action: {clockStatus.lastAction}
            </p>
          </div>

          <Button
            type="primary"
            block
            size="large"
            loading={clockLoading}
            onClick={handleClockAction}
            disabled={clockLoading || loading}
            style={{
              background: '#fff',
              color: clockStatus.status === 'Clocked In' ? '#ff4d4f' : '#52c41a',
              border: 'none',
              fontWeight: 800,
              fontSize: '24px',
              height: '64px',
              padding: '0 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              letterSpacing: '1px',
            }}
          >
            {clockStatus.status === 'Clocked In' ? 'CLOCK OUT' : 'CLOCK IN'}
          </Button>
        </Card>

        <Card>
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#666', margin: 0, marginBottom: '8px' }}>
            Hours This Week
          </h3>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#000', margin: 0 }}>
            {loading ? '...' : clockStatus.weeklyHours.toFixed(1)}
          </p>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Target: 40.0</p>
        </Card>

        <Card>
          <h3 style={{ fontSize: '12px', fontWeight: 500, color: '#666', margin: 0, marginBottom: '8px' }}>
            Hours Today
          </h3>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#1890ff', margin: 0 }}>
            {loading ? '...' : clockStatus.hoursToday.toFixed(1)}
          </p>
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>Paid hours</p>
        </Card>
      </div>

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
          columns={columns}
          dataSource={mockPtoRequests}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default TimePtoView;

