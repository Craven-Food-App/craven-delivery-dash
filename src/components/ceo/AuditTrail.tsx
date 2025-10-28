import React, { useState, useEffect } from 'react';
import { Table, Tag, Input, Select, DatePicker } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ActionLog {
  id: string;
  user_id: string;
  action_type: string;
  action_category: string;
  target_name: string;
  action_description: string;
  severity: string;
  created_at: string;
}

export const AuditTrail: React.FC = () => {
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [severityFilter, setSeverityFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [searchText, categoryFilter, severityFilter, logs]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error} = await supabase
        .from('ceo_action_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchText) {
      filtered = filtered.filter(log =>
        log.action_description.toLowerCase().includes(searchText.toLowerCase()) ||
        log.target_name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(log => log.action_category === categoryFilter);
    }

    if (severityFilter) {
      filtered = filtered.filter(log => log.severity === severityFilter);
    }

    setFilteredLogs(filtered);
  };

  const columns = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <div>
          <div className="font-medium">{dayjs(date).format('MMM D, YYYY')}</div>
          <div className="text-xs text-slate-500">{dayjs(date).format('h:mm A')}</div>
        </div>
      ),
      width: 140,
    },
    {
      title: 'Action',
      dataIndex: 'action_description',
      key: 'action_description',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'action_category',
      key: 'action_category',
      render: (category: string) => {
        const colors: Record<string, string> = {
          personnel: 'blue',
          financial: 'green',
          system: 'purple',
          strategic: 'orange',
          emergency: 'red',
        };
        return <Tag color={colors[category]}>{category.toUpperCase()}</Tag>;
      },
      width: 120,
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => {
        const colors: Record<string, string> = {
          low: 'default',
          normal: 'blue',
          high: 'orange',
          critical: 'red',
        };
        return <Tag color={colors[severity]}>{severity.toUpperCase()}</Tag>;
      },
      width: 100,
    },
  ];

  const categoryStats = {
    personnel: logs.filter(l => l.action_category === 'personnel').length,
    financial: logs.filter(l => l.action_category === 'financial').length,
    system: logs.filter(l => l.action_category === 'system').length,
    strategic: logs.filter(l => l.action_category === 'strategic').length,
    emergency: logs.filter(l => l.action_category === 'emergency').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Audit Trail</h2>
        <p className="text-slate-600">Complete log of all CEO actions and system changes</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{categoryStats.personnel}</div>
          <div className="text-sm text-slate-600">Personnel</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{categoryStats.financial}</div>
          <div className="text-sm text-slate-600">Financial</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{categoryStats.system}</div>
          <div className="text-sm text-slate-600">System</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{categoryStats.strategic}</div>
          <div className="text-sm text-slate-600">Strategic</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{categoryStats.emergency}</div>
          <div className="text-sm text-slate-600">Emergency</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Search
          placeholder="Search actions..."
          allowClear
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="Category"
          allowClear
          style={{ width: 150 }}
          onChange={setCategoryFilter}
        >
          <Option value="personnel">Personnel</Option>
          <Option value="financial">Financial</Option>
          <Option value="system">System</Option>
          <Option value="strategic">Strategic</Option>
          <Option value="emergency">Emergency</Option>
        </Select>
        <Select
          placeholder="Severity"
          allowClear
          style={{ width: 150 }}
          onChange={setSeverityFilter}
        >
          <Option value="low">Low</Option>
          <Option value="normal">Normal</Option>
          <Option value="high">High</Option>
          <Option value="critical">Critical</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredLogs}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} actions`,
        }}
        className="shadow-lg"
      />
    </div>
  );
};
