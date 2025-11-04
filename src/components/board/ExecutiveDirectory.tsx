import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tag, Input, Row, Col, message, Button } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SearchOutlined, MessageOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { isCLevelPosition, getExecRoleFromPosition } from '@/utils/roleUtils';
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
      // Fetch from employees table - get ALL employees, filter C-level in code
      const { data: employeesData, error: empError } = await supabase
        .from('employees' as any)
        .select('*')
        .order('position');

      if (empError) throw empError;

      // Filter to only C-level positions and map to Executive interface (using centralized utilities)
      const executives: Executive[] = ((employeesData as any) || [])
        .filter((emp: any) => isCLevelPosition(emp.position))
        .map((emp: any) => {
          const position = String(emp.position || '').toLowerCase();
          
          // Normalize position to role (using centralized utility)
          const execRole = getExecRoleFromPosition(emp.position);
          let role = execRole || position;
          
          // Handle special cases
          if (position.includes('board member')) role = 'board_member';
          else if (position.includes('advisor')) role = 'advisor';
          else if (!execRole) role = position;
          
          return {
            id: emp.id,
            user_id: emp.user_id,
            role: role,
            title: emp.position,
            department: emp.department,
            last_login: null,
            created_at: emp.created_at,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            source: 'employees' as const,
          };
        });

      setExecutives(executives);
      setFilteredExecutives(executives);
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
      cxo: 'pink',
      cmo: 'magenta',
      cro: 'orange',
      cpo: 'cyan',
      cdo: 'volcano',
      chro: 'geekblue',
      clo: 'lime',
      cso: 'gold',
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
      cxo: '🎨',
      cmo: '📢',
      cro: '📈',
      cpo: '🚀',
      cdo: '📊',
      chro: '👥',
      clo: '⚖️',
      cso: '🔒',
      board_member: '🎯',
      advisor: '🧠',
      executive: '👤',
    };
    return icons[role] || '👤';
  };

  // Ensure C-suite abbreviations (CEO/CFO/COO/CTO/CMO/CRO/CPO/CDO/CHRO/CLO/CSO/CXO) are always ALL CAPS
  const formatCLevel = (text?: string) => {
    if (!text) return '';
    const tokens = ['CEO','CFO','COO','CTO','CMO','CRO','CPO','CDO','CHRO','CLO','CSO','CXO'];
    let formatted = text.replace(/\b(c(eo|fo|oo|to|mo|ro|po|do|hro|lo|so|xo))\b/gi, (m) => m.toUpperCase());
    // Also convert patterns like "Chief Financial Officer (cfo)" trailing abbreviations
    tokens.forEach(t => {
      formatted = formatted.replace(new RegExp(`\\b${t.toLowerCase()}\\b`, 'gi'), t);
    });
    return formatted;
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

      <Row gutter={[8, 12]}>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">{executives.length}</div>
              <div className="text-xs sm:text-sm text-slate-600">Total Executives</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {executives.filter(e => e.role === 'ceo').length}
              </div>
              <div className="text-xs sm:text-sm text-slate-600">CEOs</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {executives.filter(e => ['cfo', 'coo', 'cto'].includes(e.role)).length}
              </div>
              <div className="text-xs sm:text-sm text-slate-600">C-Suite</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gold-600">
                {executives.filter(e => e.role === 'board_member').length}
              </div>
              <div className="text-xs sm:text-sm text-slate-600">Board Members</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[8, 12]}>
        {filteredExecutives.map((exec) => (
          <Col xs={12} sm={12} lg={8} key={exec.id}>
            <Card
              className="hover:shadow-lg transition-shadow"
              bordered={false}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <Avatar 
                    size={window.innerWidth < 640 ? 60 : 80} 
                    icon={<UserOutlined />} 
                    className="bg-gradient-to-br from-blue-500 to-purple-500" 
                  />
                  <div className="absolute -bottom-2 -right-2 text-2xl sm:text-3xl">
                    {getRoleIcon(exec.role)}
                  </div>
                </div>

                <Tag color={getRoleColor(exec.role)} className="mb-2 text-xs">
                  {exec.role.toUpperCase().replace('_', ' ')}
                </Tag>

                <h3 className="text-sm sm:text-lg font-bold text-slate-900 mb-1">
                  {exec.name || formatCLevel(exec.title) || exec.role.toUpperCase()}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 mb-1">{formatCLevel(exec.title)}</p>

                {exec.department && (
                  <p className="text-xs text-slate-500 mb-2">{exec.department}</p>
                )}

                <div className="w-full space-y-2 mt-2">
                  {exec.email && (
                    <div className="flex items-center justify-center gap-1 text-xs text-slate-600">
                      <MailOutlined />
                      <span className="truncate text-xs">{exec.email}</span>
                    </div>
                  )}
                  
                  {exec.last_login && (
                    <div className="text-xs text-slate-500">
                      {dayjs(exec.last_login).fromNow()}
                    </div>
                  )}

                  {exec.source === 'employees' && (
                    <Tag color="blue" className="text-xs">From Personnel</Tag>
                  )}
                </div>

                <div className="w-full mt-3 pt-2 border-t border-slate-200">
                  <Button type="link" icon={<MessageOutlined />} size="small" className="text-xs">
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

