// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Table, Card, Statistic, Tag, Space, message, Spin } from 'antd';
import { DollarOutlined, TeamOutlined, TrophyOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

interface Shareholder {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  email: string;
  employee_equity: Array<{
    shares_percentage: number;
    shares_total?: number;
    equity_type: string;
    grant_date: string;
  }>;
}

export const EquityDashboard: React.FC = () => {
  const [shareholders, setShareholders] = useState<Shareholder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShareholders();
  }, []);

  const fetchShareholders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          position,
          email,
          employee_equity (
            shares_percentage,
            shares_total,
            equity_type,
            grant_date
          )
        `)
        ;

      if (error) throw error;
      
      // Filter to only employees with equity
      const filteredData = (data || []).filter(emp => 
        emp.employee_equity && emp.employee_equity.length > 0
      );
      
      setShareholders(filteredData);
    } catch (error) {
      console.error('Error fetching shareholders:', error);
      message.error('Failed to load shareholder data');
    } finally {
      setLoading(false);
    }
  };

  const totalEquity = shareholders.reduce((sum, emp) => 
    sum + (emp.employee_equity?.[0]?.shares_percentage || 0), 0
  );

  const unallocatedEquity = 100 - totalEquity;

  const columns = [
    {
      title: 'Rank',
      key: 'rank',
      width: 70,
      render: (_: any, __: any, index: number) => (
        <span style={{ fontWeight: 600, color: '#1a1a1a' }}>
          #{index + 1}
        </span>
      ),
    },
    {
      title: 'Shareholder',
      key: 'name',
      render: (_: any, record: Shareholder) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1a1a1a' }}>
            {record.first_name} {record.last_name}
          </div>
          <div style={{ fontSize: '12px', color: '#898989' }}>
            {record.email}
          </div>
        </div>
      ),
      sorter: (a: Shareholder, b: Shareholder) => 
        a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => {
        const isCLevel = /chief|ceo|cfo|cto|coo|president/i.test(position);
        return (
          <Tag color={isCLevel ? 'gold' : 'blue'} style={{ fontWeight: 600 }}>
            {position}
          </Tag>
        );
      },
    },
    {
      title: 'Equity Stake',
      key: 'equity',
      render: (_: any, record: Shareholder) => {
        const equity = record.employee_equity?.[0];
        const percentage = equity?.shares_percentage || 0;
        const shares = equity?.shares_total;
        
        return (
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff6b00' }}>
              {percentage}%
            </div>
            {typeof shares === 'number' && (
              <div style={{ fontSize: '12px', color: '#475569' }}>
                {shares.toLocaleString()} shares
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#898989', textTransform: 'uppercase' }}>
              {equity?.equity_type || 'Stock'}
            </div>
          </div>
        );
      },
      sorter: (a: Shareholder, b: Shareholder) => 
        (a.employee_equity?.[0]?.shares_percentage || 0) - 
        (b.employee_equity?.[0]?.shares_percentage || 0),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Grant Date',
      key: 'grant_date',
      render: (_: any, record: Shareholder) => {
        const grantDate = record.employee_equity?.[0]?.grant_date;
        if (!grantDate) return '-';
        return new Date(grantDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            🎯 Equity Ownership Dashboard
          </h2>
          <p className="text-slate-600">
            Track C-suite and key executive equity stakes
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <Statistic
            title="Total Shareholders"
            value={shareholders.length}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Total Allocated Equity"
            value={totalEquity}
            suffix="%"
            prefix={<DollarOutlined />}
            valueStyle={{ color: '#3f8600' }}
            precision={2}
          />
        </Card>
        <Card>
          <Statistic
            title="Unallocated Equity"
            value={unallocatedEquity}
            suffix="%"
            prefix={<TrophyOutlined />}
            valueStyle={{ color: '#faad14' }}
            precision={2}
          />
        </Card>
        <Card>
          <Statistic
            title="Largest Stake"
            value={shareholders[0]?.employee_equity?.[0]?.shares_percentage || 0}
            suffix="%"
            valueStyle={{ color: '#cf1322', fontSize: '24px' }}
            precision={2}
          />
        </Card>
      </div>

      {/* Equity Allocation Progress Bar */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Equity Allocation Overview</h3>
        <div className="space-y-2">
          {shareholders.slice(0, 10).map((emp, index) => {
            const percentage = emp.employee_equity?.[0]?.shares_percentage || 0;
            return (
              <div key={emp.id} className="flex items-center space-x-3">
                <div className="w-24 text-sm font-medium text-slate-600">
                  {emp.first_name} {emp.last_name.substring(0, 1)}.
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ff6b00 to-ff8c00"
                      style={{ width: `${percentage}%`, transition: 'width 0.3s' }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-slate-700">
                  {percentage}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Shareholders Table */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Complete Shareholder Registry</h3>
        <Table
          columns={columns}
          dataSource={shareholders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          className="shadow-lg"
          scroll={{ x: 800 }}
        />
      </Card>

      {unallocatedEquity < 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="text-red-600 font-semibold">
            ⚠️ Warning: Total equity allocation exceeds 100%. 
            Please review and adjust equity stakes.
          </div>
        </Card>
      )}

      {unallocatedEquity > 0 && unallocatedEquity <= 30 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <div className="text-yellow-700 font-medium">
            💡 Consider allocating remaining {unallocatedEquity.toFixed(2)}% equity 
            to key executives or reserve for future options pool.
          </div>
        </Card>
      )}
    </div>
  );
};

