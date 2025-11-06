import React, { useState, useEffect } from 'react';
import { Card, Avatar, Tag, Input, Row, Col, message, Button, Modal, Space, Typography } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, SearchOutlined, MessageOutlined, LockOutlined, CopyOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

const { Paragraph, Text } = Typography;
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
  photo_url?: string;
}

export const ExecutiveDirectory: React.FC = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [filteredExecutives, setFilteredExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [resetPasswordModal, setResetPasswordModal] = useState<{ visible: boolean; exec: Executive | null; tempPassword: string | null }>({
    visible: false,
    exec: null,
    tempPassword: null,
  });
  const [resettingPassword, setResettingPassword] = useState(false);

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
      // Fetch from exec_users (officers) and employees (C-level employees)
      const [execUsersRes, employeesRes] = await Promise.all([
        supabase.from('exec_users').select('id, user_id, role, title, department, last_login, created_at, photo_url').order('created_at', { ascending: false }),
        supabase.from('employees' as any).select('*').order('position')
      ]);

      if (execUsersRes.error) throw execUsersRes.error;

      // Create a map of user_id to email (executives already have emails in exec_users table)
      const emailMap = new Map<string, string>();

      const executivesFromOfficers: Executive[] = (execUsersRes.data || []).map((officer: any) => ({
        id: officer.id,
        user_id: officer.user_id,
        role: officer.role || 'executive',
        title: officer.title || officer.role?.toUpperCase(),
        department: officer.department || 'Executive',
        last_login: officer.last_login,
        created_at: officer.created_at,
        name: officer.title || officer.role?.toUpperCase(),
        email: officer.user_id ? emailMap.get(officer.user_id) : undefined,
        source: 'exec_users' as const,
        photo_url: officer.photo_url,
      }));

      // Filter to only C-level positions from employees and map to Executive interface
      const executivesFromEmployees: Executive[] = ((employeesRes.data as any) || [])
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

      // Combine and deduplicate (prefer exec_users data if user_id matches)
      const combined = [...executivesFromOfficers];
      executivesFromEmployees.forEach(empExec => {
        const exists = combined.find(ex => ex.user_id && empExec.user_id && ex.user_id === empExec.user_id);
        if (!exists) {
          combined.push(empExec);
        }
      });

      setExecutives(combined);
      setFilteredExecutives(combined);
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

  const handleResetPassword = async (exec: Executive) => {
    if (!exec.email) {
      message.error('No email address found for this executive');
      return;
    }

    Modal.confirm({
      title: 'Reset Executive Password',
      content: `Are you sure you want to reset the password for ${exec.name || exec.email}? A temporary password will be generated.`,
      okText: 'Reset Password',
      cancelText: 'Cancel',
      onOk: async () => {
        setResettingPassword(true);
        try {
          // Get current user email (CEO)
          const { data: { user } } = await supabase.auth.getUser();
          const resetBy = user?.email || 'admin';

          const { data, error } = await supabase.functions.invoke('reset-executive-password-admin', {
            body: {
              email: exec.email,
              resetBy,
            },
          });

          if (error) throw error;

          if (data?.success && data?.tempPassword) {
            setResetPasswordModal({
              visible: true,
              exec,
              tempPassword: data.tempPassword,
            });
            message.success('Password reset successfully!');
          } else {
            throw new Error(data?.error || 'Failed to reset password');
          }
        } catch (error: any) {
          console.error('Error resetting password:', error);
          message.error(error.message || 'Failed to reset password');
        } finally {
          setResettingPassword(false);
        }
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Temporary password copied to clipboard!');
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
                    icon={!exec.photo_url ? <UserOutlined /> : undefined}
                    src={exec.photo_url}
                    className={!exec.photo_url ? "bg-gradient-to-br from-blue-500 to-purple-500" : ""}
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

                  {exec.source === 'exec_users' && (
                    <Tag color="gold" className="text-xs">CORPORATE OFFICER</Tag>
                  )}
                  {exec.source === 'employees' && !exec.email && (
                    <Tag color="blue" className="text-xs">Employee</Tag>
                  )}
                </div>

                <div className="w-full mt-3 pt-2 border-t border-slate-200 flex justify-center gap-2">
                  <Button type="link" icon={<MessageOutlined />} size="small" className="text-xs">
                    Send Message
                  </Button>
                  {exec.email && (
                    <Button 
                      type="link" 
                      icon={<LockOutlined />} 
                      size="small" 
                      className="text-xs"
                      onClick={() => handleResetPassword(exec)}
                      loading={resettingPassword}
                    >
                      Reset Password
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Password Reset Modal */}
      <Modal
        title="Password Reset Successful"
        open={resetPasswordModal.visible}
        onCancel={() => setResetPasswordModal({ visible: false, exec: null, tempPassword: null })}
        footer={[
          <Button key="close" onClick={() => setResetPasswordModal({ visible: false, exec: null, tempPassword: null })}>
            Close
          </Button>,
        ]}
        width={500}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Paragraph>
            A temporary password has been generated for <strong>{resetPasswordModal.exec?.name || resetPasswordModal.exec?.email}</strong>.
            They will be required to change this password on their next login.
          </Paragraph>
          
          <div>
            <Text strong>Temporary Password:</Text>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginTop: '8px',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '16px',
            }}>
              <Text code style={{ flex: 1, margin: 0 }}>{resetPasswordModal.tempPassword}</Text>
              <Button 
                icon={<CopyOutlined />} 
                size="small"
                onClick={() => resetPasswordModal.tempPassword && copyToClipboard(resetPasswordModal.tempPassword)}
              >
                Copy
              </Button>
            </div>
          </div>

          <div style={{ 
            padding: '12px', 
            background: '#fff7e6', 
            borderRadius: '4px',
            border: '1px solid #ffd591',
          }}>
            <Text type="warning">
              <strong>Important:</strong> Share this temporary password securely with the executive. 
              They must change it immediately upon login.
            </Text>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

