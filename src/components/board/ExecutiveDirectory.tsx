import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tag, Input, Row, Col, message, Button } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SearchOutlined, MessageOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Search } = Input;

interface Executive {
  id: string;
  user_id?: string;
  role: string;
  title: string;
  department?: string;
  last_login?: string;
  created_at: string;
  name?: string; // For employees
  email?: string; // For employees
  source: 'exec_users' | 'employees'; // Track where the data came from
}

export const ExecutiveDirectory: React.FC = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [filteredExecutives, setFilteredExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchExecutives();
  }, []);

  useEffect(() => {
    if (searchText) {
      setFilteredExecutives(
        executives.filter(exec =>
          exec.role.toLowerCase().includes(searchText.toLowerCase()) ||
          exec.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          exec.department?.toLowerCase().includes(searchText.toLowerCase()) ||
          exec.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          exec.email?.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    } else {
      setFilteredExecutives(executives);
    }
  }, [searchText, executives]);

  const fetchExecutives = async () => {
    setLoading(true);
    try {
      // Fetch from exec_users only
      const { data: execUsersData, error: execError } = await supabase
        .from('exec_users' as any)
        .select('*')
        .order('role');

      if (execError) throw execError;

      // Map exec_users to Executive interface
      const execUsers: Executive[] = ((execUsersData as any) || []).map((exec: any) => ({
        id: exec.id,
        user_id: exec.user_id,
        role: exec.role,
        title: exec.title,
        department: exec.department,
        last_login: exec.last_login,
        created_at: exec.created_at,
        source: 'exec_users' as const,
      }));

      setExecutives(execUsers);
      setFilteredExecutives(execUsers);
    } catch (error) {
      console.error('Error fetching executives:', error);
      message.error('Failed to load executives');
      setExecutives([]);
      setFilteredExecutives([]);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ceo: 'red',
      cfo: 'green',
      coo: 'blue',
      cto: 'purple',
      cmo: 'magenta',
      cpo: 'orange',
      board_member: 'gold',
      advisor: 'cyan',
      executive: 'default',
    };
    return colors[role] || 'default';
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      ceo: '👑',
      cfo: '💰',
      coo: '⚙️',
      cto: '💻',
      cmo: '📢',
      cpo: '🚀',
      board_member: '🎯',
      advisor: '🧠',
      executive: '👤',
    };
    return icons[role] || '👤';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Executive Directory</h2>
          <p className="text-slate-600">C-suite and board member directory</p>
        </div>
        <Search
          placeholder="Search executives..."
          allowClear
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{executives.length}</div>
            <div className="text-sm text-slate-600">Total Executives</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {executives.filter(e => e.role === 'ceo').length}
            </div>
            <div className="text-sm text-slate-600">CEOs</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {executives.filter(e => ['cfo', 'coo', 'cto'].includes(e.role)).length}
            </div>
            <div className="text-sm text-slate-600">C-Suite</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-gold-600">
              {executives.filter(e => e.role === 'board_member').length}
            </div>
            <div className="text-sm text-slate-600">Board Members</div>
          </div>
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        {filteredExecutives.map((exec) => (
          <Col xs={24} sm={12} lg={8} key={exec.id}>
            <Card
              className="hover:shadow-lg transition-shadow"
              bordered={false}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <Avatar size={80} icon={<UserOutlined />} className="bg-gradient-to-br from-blue-500 to-purple-500" />
                  <div className="absolute -bottom-2 -right-2 text-3xl">
                    {getRoleIcon(exec.role)}
                  </div>
                </div>

                <Tag color={getRoleColor(exec.role)} className="mb-2">
                  {exec.role.toUpperCase().replace('_', ' ')}
                </Tag>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {exec.name || exec.title || exec.role.toUpperCase()}
                </h3>

                <p className="text-sm text-slate-600 mb-1">{exec.title}</p>

                {exec.department && (
                  <p className="text-xs text-slate-500 mb-3">{exec.department}</p>
                )}

                <div className="w-full space-y-2 mt-4">
                  {exec.email && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <MailOutlined />
                      <span className="truncate text-xs">{exec.email}</span>
                    </div>
                  )}
                  
                  {exec.last_login && (
                    <div className="text-xs text-slate-500">
                      Last active: {dayjs(exec.last_login).fromNow()}
                    </div>
                  )}

                  {exec.source === 'employees' && (
                    <Tag color="blue" className="text-xs">From Personnel</Tag>
                  )}
                </div>

                <div className="w-full mt-4 pt-4 border-t border-slate-200">
                  <Button type="link" icon={<MessageOutlined />} size="small">
                    Send Message
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

