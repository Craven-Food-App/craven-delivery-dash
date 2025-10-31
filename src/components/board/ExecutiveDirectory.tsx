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
      // Fetch from employees table - only executive positions
      const { data: employeesData, error: empError } = await supabase
        .from('employees' as any)
        .select('*')
        .in('position', ['CEO', 'CFO', 'COO', 'CTO', 'CMO', 'CRO', 'CPO', 'CDO', 'CHRO', 'CLO', 'CSO', 'CXO', 'Board Member', 'Advisor'])
        .order('position');

      if (empError) throw empError;

      // Map employees to Executive interface
      const executives: Executive[] = ((employeesData as any) || []).map((emp: any) => {
        const position = String(emp.position || '').toLowerCase();
        let role = position;
        
        // Normalize position to role
        if (position.includes('board member')) role = 'board_member';
        else if (position.includes('advisor')) role = 'advisor';
        else if (position.includes('ceo')) role = 'ceo';
        else if (position.includes('cfo')) role = 'cfo';
        else if (position.includes('coo')) role = 'coo';
        else if (position.includes('cto')) role = 'cto';
        else if (position.includes('cmo')) role = 'cmo';
        else if (position.includes('cro')) role = 'cro';
        else if (position.includes('cpo')) role = 'cpo';
        else if (position.includes('cdo')) role = 'cdo';
        else if (position.includes('chro')) role = 'chro';
        else if (position.includes('clo')) role = 'clo';
        else if (position.includes('cso')) role = 'cso';
        else if (position.includes('cxo')) role = 'cxo';
        
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

