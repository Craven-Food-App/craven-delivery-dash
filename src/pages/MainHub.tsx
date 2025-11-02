import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Modal, 
  Form, 
  message, 
  Typography, 
  Space,
  Spin,
  Avatar,
  Layout
} from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  ShopOutlined,
  TeamOutlined,
  RocketOutlined,
  CrownOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  LockOutlined
} from '@ant-design/icons';
import { ConfigProvider } from 'antd';
import { cravenDriverTheme } from '@/config/antd-theme';
import cravenLogo from "@/assets/craven-logo.png";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

interface Portal {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  color: string;
}

interface EmployeeInfo {
  id: string;
  employee_number: string;
  full_name: string;
  email: string;
  position: string;
  isCEO: boolean;
}

const MainHub: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [user, setUser] = useState<any>(null);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // CEO Master PIN - Torrance Stroman
  const CEO_MASTER_PIN = '999999';
  const CEO_EMAIL_PATTERN = /torrance|stroman/i;

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect to auth (on HQ subdomain in production, local in dev)
        const currentHost = window.location.hostname;
        const isHQ = currentHost === 'hq.cravenusa.com' || 
                     currentHost === 'localhost' || 
                     currentHost === '127.0.0.1' ||
                     window.location.search.includes('hq=true');
        
        if (!isHQ && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
          // Production: redirect to HQ subdomain
          window.location.href = 'https://hq.cravenusa.com/auth?redirect=/hub';
        } else {
          // Development or already on HQ: use local routing with hq=true
          navigate('/auth?hq=true&redirect=/hub');
        }
        return;
      }
      
      setUser(user);
      
      // Check if PIN is already verified (stored in sessionStorage)
      const verifiedEmployee = sessionStorage.getItem('hub_employee_info');
      if (verifiedEmployee) {
        setEmployeeInfo(JSON.parse(verifiedEmployee));
        setLoading(false);
        return;
      }

      // ALL users (including admins and executives) must verify PIN
      // This is the main access point - everyone goes through PIN verification
      setPinModalVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      // Redirect to auth (on HQ subdomain in production, local in dev)
      const currentHost = window.location.hostname;
      const isHQ = currentHost === 'hq.cravenusa.com' || 
                   currentHost === 'localhost' || 
                   currentHost === '127.0.0.1' ||
                   window.location.search.includes('hq=true');
      
      if (!isHQ && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        // Production: redirect to HQ subdomain
        window.location.href = 'https://hq.cravenusa.com/auth?redirect=/hub';
      } else {
        // Development or already on HQ: use local routing with hq=true
        navigate('/auth?hq=true&redirect=/hub');
      }
    }
  };

  const verifyPIN = async (values: { email: string; pin: string }) => {
    setPinLoading(true);
    const { email, pin } = values;

    try {
      // Check CEO Master PIN first
      if (pin === CEO_MASTER_PIN) {
        // Check if email matches CEO pattern OR verify against user profile
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const isTorrance = profiles && (
          profiles.full_name?.toLowerCase().includes('torrance') || 
          profiles.full_name?.toLowerCase().includes('stroman') ||
          email.toLowerCase().includes('torrance') ||
          email.toLowerCase().includes('stroman')
        );

        if (isTorrance) {
          const ceoInfo: EmployeeInfo = {
            id: user.id,
            employee_number: 'CEO001',
            full_name: profiles?.full_name || 'Torrance Stroman',
            email: user.email || email,
            position: 'Chief Executive Officer',
            isCEO: true
          };
          
          sessionStorage.setItem('hub_employee_info', JSON.stringify(ceoInfo));
          setEmployeeInfo(ceoInfo);
          setPinModalVisible(false);
          message.success('Welcome, CEO Stroman! Master PIN verified.');
          setPinLoading(false);
          return;
        }
      }

      // Verify employee PIN - try multiple methods
      let employee: any = null;
      let verificationError: any = null;
      
      try {
        // Method 1: Try RPC function first
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('verify_employee_portal_pin', {
            p_email: email,
            p_pin: pin
          });

          if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
            employee = rpcData[0];
          } else {
            verificationError = rpcError;
          }
        } catch (rpcErr: any) {
          console.log('RPC function not available or failed, trying direct query:', rpcErr.message);
          verificationError = rpcErr;
        }

        // Method 2: Direct query with portal_pin (if column exists)
        if (!employee) {
          try {
            const { data: queryData, error: queryError } = await supabase
              .from('employees')
              .select('id, employee_number, first_name, last_name, email, position, portal_pin, portal_access_granted, employment_status')
              .eq('email', email)
              .eq('employment_status', 'active')
              .single();

            if (queryError) {
              console.log('Direct query error:', queryError);
              verificationError = queryError;
            } else if (queryData) {
              // Check if portal_pin column exists and matches
              if (queryData.portal_pin !== undefined) {
                if (queryData.portal_pin === pin && queryData.portal_access_granted !== false) {
                  employee = {
                    employee_id: queryData.id,
                    employee_number: queryData.employee_number,
                    full_name: `${queryData.first_name} ${queryData.last_name}`,
                    email: queryData.email,
                    position: queryData.position
                  };
                } else {
                  verificationError = new Error('PIN does not match or access not granted');
                }
              } else {
                // portal_pin column doesn't exist yet - allow any PIN for testing
                // This is temporary until migration is run
                console.warn('portal_pin column not found - allowing access for testing');
                employee = {
                  employee_id: queryData.id,
                  employee_number: queryData.employee_number,
                  full_name: `${queryData.first_name} ${queryData.last_name}`,
                  email: queryData.email,
                  position: queryData.position
                };
              }
            }
          } catch (queryErr: any) {
            console.log('Direct query failed:', queryErr.message);
            verificationError = queryErr;
          }
        }
      } catch (err: any) {
        console.error('PIN verification error:', err);
        verificationError = err;
      }

      if (!employee) {
        console.error('PIN verification failed:', verificationError);
        const errorMsg = verificationError?.message || 'Invalid email or PIN';
        message.error(`Access denied: ${errorMsg}. Please check your credentials or contact HR for portal access.`);
        setPinLoading(false);
        return;
      }

      // Check if employee is also an admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = profile?.role === 'admin' || roles?.some(r => r.role === 'admin');

      const employeeData: EmployeeInfo = {
        id: employee.employee_id || employee.id,
        employee_number: employee.employee_number || 'N/A',
        full_name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
        email: employee.email,
        position: isAdmin ? `${employee.position} (Admin)` : employee.position,
        isCEO: false
      };

      sessionStorage.setItem('hub_employee_info', JSON.stringify(employeeData));
      setEmployeeInfo(employeeData);
      setPinModalVisible(false);
      message.success(`Welcome, ${employeeData.full_name}! ${isAdmin ? 'Admin access granted.' : ''}`);
      setPinLoading(false);
    } catch (error: any) {
      console.error('PIN verification error:', error);
      message.error('Failed to verify PIN. Please try again.');
      setPinLoading(false);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('hub_employee_info');
    await supabase.auth.signOut();
    message.success('Signed out successfully');
    // Always redirect to hub login page (never main website)
    const currentHost = window.location.hostname;
    const isHQ = currentHost === 'hq.cravenusa.com' || 
                 currentHost === 'localhost' || 
                 currentHost === '127.0.0.1';
    
    if (!isHQ && currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
      // Production: redirect to HQ subdomain auth
      window.location.href = 'https://hq.cravenusa.com/auth';
    } else {
      // Development or already on HQ: use local routing with hq=true
      navigate('/auth?hq=true');
    }
  };

  // Company-side portals only
  const portals: Portal[] = [
    {
      id: 'admin',
      name: 'Admin Portal',
      description: 'System administration and operations management',
      icon: SettingOutlined,
      path: '/admin',
      color: '#ff4d4f'
    },
    {
      id: 'marketing',
      name: 'Marketing Portal',
      description: 'Campaigns, analytics, and customer engagement',
      icon: RocketOutlined,
      path: '/marketing-portal',
      color: '#ff7a45'
    },
    {
      id: 'board',
      name: 'Board Portal',
      description: 'Executive board dashboard and governance',
      icon: CrownOutlined,
      path: '/board',
      color: '#722ed1'
    },
    {
      id: 'ceo',
      name: 'CEO Command Center',
      description: 'Executive leadership and strategic oversight',
      icon: DashboardOutlined,
      path: '/ceo',
      color: '#13c2c2'
    },
    {
      id: 'cfo',
      name: 'CFO Portal',
      description: 'Financial management and reporting',
      icon: DollarOutlined,
      path: '/cfo',
      color: '#52c41a'
    },
    {
      id: 'coo',
      name: 'COO Operations Portal',
      description: 'Operations and logistics management',
      icon: ShopOutlined,
      path: '/coo',
      color: '#1890ff'
    },
    {
      id: 'cto',
      name: 'CTO Technology Portal',
      description: 'Technology and engineering dashboard',
      icon: BarChartOutlined,
      path: '/cto',
      color: '#eb2f96'
    }
  ];

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#ffffff'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider theme={cravenDriverTheme}>
      <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
        {/* Corporate Header */}
        <Header style={{ 
          background: '#ffffff', 
          padding: '0 24px', 
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          height: 72,
          flexWrap: 'wrap',
          minHeight: 72
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16,
            flex: '1 1 auto',
            minWidth: 0
          }}>
            <img 
              src={cravenLogo} 
              alt="Crave'N" 
              style={{ 
                height: 40,
                width: 'auto',
                flexShrink: 0
              }} 
            />
            <div style={{ 
              borderLeft: '1px solid #e5e7eb', 
              height: 32,
              flexShrink: 0
            }} />
            <div style={{ 
              minWidth: 0,
              flex: '1 1 auto',
              overflow: 'hidden'
            }}>
              <Title 
                level={3} 
                style={{ 
                  margin: 0, 
                  color: '#111827', 
                  fontSize: 18, 
                  fontWeight: 600,
                  lineHeight: 1.3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Enterprise Portal Hub
              </Title>
              <Text 
                type="secondary" 
                style={{ 
                  fontSize: 12, 
                  color: '#6b7280',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4
                }}
              >
                {employeeInfo ? `${employeeInfo.full_name} • ${employeeInfo.position}` : 'Corporate Access Portal'}
              </Text>
            </div>
          </div>
          <Space 
            size="middle"
            style={{
              flexShrink: 0,
              marginLeft: 16
            }}
          >
            {employeeInfo && (
              <Avatar 
                size={36} 
                style={{ 
                  backgroundColor: '#ff7a45',
                  color: '#fff',
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {employeeInfo.full_name.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <Button 
              icon={<LogoutOutlined />} 
              onClick={handleLogout}
              style={{ 
                borderColor: '#d1d5db',
                color: '#374151',
                height: 36,
                flexShrink: 0,
                fontSize: 13,
                padding: '0 12px'
              }}
            >
              Sign Out
            </Button>
          </Space>
        </Header>

        {/* Main Content */}
        <Content style={{ 
          padding: '64px 32px', 
          maxWidth: 1600, 
          margin: '0 auto', 
          width: '100%',
          background: '#ffffff'
        }}>
          <div style={{ marginBottom: 48 }}>
            <Title level={1} style={{ 
              color: '#111827', 
              fontSize: 32, 
              fontWeight: 700,
              marginBottom: 8
            }}>
              Portal Access
            </Title>
            <Text type="secondary" style={{ fontSize: 16, color: '#6b7280' }}>
              Access your department portal or administrative dashboard
            </Text>
          </div>

          {/* Portal Grid - Corporate Style */}
          <Row gutter={[32, 32]}>
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={portal.id}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      background: '#ffffff'
                    }}
                    onClick={() => navigate(portal.path)}
                    bodyStyle={{ padding: 28 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = portal.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${portal.color}15 0%, ${portal.color}08 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px',
                          border: `1px solid ${portal.color}20`
                        }}
                      >
                        <Icon style={{ fontSize: 36, color: portal.color }} />
                      </div>
                      <Title level={4} style={{ 
                        marginBottom: 12,
                        color: '#111827',
                        fontSize: 18,
                        fontWeight: 600
                      }}>
                        {portal.name}
                      </Title>
                      <Text type="secondary" style={{ 
                        fontSize: 14, 
                        color: '#6b7280',
                        lineHeight: 1.5,
                        display: 'block',
                        marginBottom: 20,
                        minHeight: 42
                      }}>
                        {portal.description}
                      </Text>
                      <div>
                        <Button 
                          type="primary" 
                          style={{ 
                            background: portal.color, 
                            borderColor: portal.color,
                            width: '100%',
                            height: 42,
                            fontWeight: 500,
                            fontSize: 14,
                            borderRadius: 6,
                            boxShadow: `0 2px 4px ${portal.color}30`
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = portal.color;
                            e.currentTarget.style.borderColor = portal.color;
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'scale(1.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = portal.color;
                            e.currentTarget.style.borderColor = portal.color;
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          Access Portal →
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </Content>

        {/* PIN Verification Modal - Corporate Style */}
        <Modal
          title={
            <div style={{ padding: '8px 0' }}>
              <Space size="middle">
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: '#ff7a4515',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <LockOutlined style={{ color: '#ff7a45', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#111827' }}>
                    Portal Access Verification
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    Enter your credentials to continue
                  </div>
                </div>
              </Space>
            </div>
          }
          open={pinModalVisible}
          onCancel={() => {
            message.warning('PIN verification required to access portals');
          }}
          footer={null}
          closable={false}
          maskClosable={false}
          style={{ top: 120 }}
          width={480}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={verifyPIN}
            autoComplete="off"
            style={{ marginTop: 8 }}
          >
            <Form.Item
              label={<span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Email Address</span>}
              name="email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
              style={{ marginBottom: 20 }}
            >
              <Input 
                size="large" 
                placeholder="employee@cravenusa.com"
                autoComplete="email"
                style={{ 
                  height: 44,
                  borderRadius: 6,
                  borderColor: '#d1d5db'
                }}
              />
            </Form.Item>
            
            <Form.Item
              label={<span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Portal PIN</span>}
              name="pin"
              rules={[
                { required: true, message: 'Please enter your PIN' },
                { len: 6, message: 'PIN must be 6 digits' },
                { pattern: /^\d+$/, message: 'PIN must be numeric' }
              ]}
              style={{ marginBottom: 24 }}
              help={
                <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>
                  PINs are issued during the hiring process. CEO has master PIN access.
                </Text>
              }
            >
              <Input.Password
                size="large"
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                autoComplete="off"
                style={{ 
                  height: 44,
                  borderRadius: 6,
                  borderColor: '#d1d5db'
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={pinLoading}
                block
                style={{ 
                  background: '#ff7a45', 
                  borderColor: '#ff7a45',
                  height: 44,
                  fontWeight: 500,
                  fontSize: 15,
                  borderRadius: 6,
                  boxShadow: '0 2px 4px rgba(255, 122, 69, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!pinLoading) {
                    e.currentTarget.style.background = '#ff5a1f';
                    e.currentTarget.style.borderColor = '#ff5a1f';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(255, 122, 69, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!pinLoading) {
                    e.currentTarget.style.background = '#ff7a45';
                    e.currentTarget.style.borderColor = '#ff7a45';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(255, 122, 69, 0.3)';
                  }
                }}
              >
                Verify & Access Portal
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

export default MainHub;
