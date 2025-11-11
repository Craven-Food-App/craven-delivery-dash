import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserOutlined,
  ProfileOutlined,
  SafetyOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ExecRecord {
  id: string;
  role?: string;
  title?: string;
  department?: string;
  photo_url?: string;
}

interface PasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

const ExecutiveProfile: React.FC = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [execRecord, setExecRecord] = useState<ExecRecord | null>(null);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [form] = Form.useForm<PasswordFormValues>();

  const isResetFlow = useMemo(() => {
    if (location.search) {
      const params = new URLSearchParams(location.search);
      if (params.get('reset') === 'true') return true;
    }
    return typeof location.hash === 'string' && location.hash.includes('type=recovery');
  }, [location.hash, location.search]);

  const ensureRecoverySession = async () => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    const hashParams = new URLSearchParams(hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('Failed to establish recovery session', error);
        return;
      }

      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`
      );
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (isResetFlow) {
          await ensureRecoverySession();
        }

        const {
          data: { user: currentUser },
          error,
        } = await supabase.auth.getUser();
        if (error) throw error;

        setUser(currentUser);

        if (currentUser) {
          const { data, error: execError } = await supabase
            .from('exec_users')
            .select('id, role, title, department, photo_url')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (!execError && data) {
            setExecRecord(data as ExecRecord);
          }
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        message.error('Unable to load executive profile. Please sign in again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isResetFlow, location.hash]);

  const redirectToBusinessAuth = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    window.location.href = `${origin}/business-auth?hq=true`;
  };

  const handlePasswordUpdate = async (values: PasswordFormValues) => {
    if (passwordUpdated) return;

    if (values.newPassword !== values.confirmPassword) {
      message.error('Passwords do not match.');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
        data: {
          temp_password: false,
          temp_password_set_at: null,
          temp_password_reset_by: null,
        },
      });

      if (error) throw error;

      message.success('Password updated successfully. Please sign in again.');
      setPasswordUpdated(true);

      await supabase.auth.signOut();

      setTimeout(() => {
        redirectToBusinessAuth();
      }, 1200);
    } catch (err: any) {
      console.error('Password update failed', err);
      message.error(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <Card style={{ maxWidth: 520, width: '100%' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <ProfileOutlined style={{ fontSize: 48, color: '#ff7a45' }} />
              <Title level={3} style={{ marginTop: 16 }}>Executive Profile</Title>
            </div>
            <Alert
              type="warning"
              showIcon
              message="Sign in required"
              description="Please sign in through the executive portal to access your profile."
            />
            <Button type="primary" onClick={redirectToBusinessAuth} block>
              Go to Executive Sign-In
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  const displayName = execRecord?.title || user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const initials = displayName
    ?.split(' ')
    .map((part: string) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={8} md={6} style={{ textAlign: 'center' }}>
                <Avatar
                  size={120}
                  src={execRecord?.photo_url || undefined}
                  icon={!execRecord?.photo_url ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: '#ff7a45', fontSize: 48 }}
                >
                  {!execRecord?.photo_url && initials}
                </Avatar>
                <Title level={4} style={{ marginTop: 16 }}>{displayName}</Title>
                <Paragraph type="secondary" style={{ marginBottom: 4 }}>{execRecord?.role?.toUpperCase() || 'Executive'}</Paragraph>
                {execRecord?.department && (
                  <Text type="secondary">{execRecord.department}</Text>
                )}
                <Divider />
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text><MailOutlined style={{ marginRight: 8 }} />{user.email}</Text>
                  {execRecord?.title && (
                    <Text><ProfileOutlined style={{ marginRight: 8 }} />{execRecord.title}</Text>
                  )}
                </Space>
              </Col>
              <Col xs={24} sm={16} md={18}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Title level={3} style={{ marginBottom: 8 }}>Account Security</Title>
                    <Text type="secondary">
                      Manage your executive password and security preferences. For security, you will be signed out after
                      updating your password and redirected to the executive sign-in screen.
                    </Text>
                  </div>

                  {isResetFlow && (
                    <Alert
                      type="info"
                      showIcon
                      icon={<SafetyOutlined />}
                      message="Password reset required"
                      description="Your account was accessed through a secure reset link. Set a new password below to continue."
                    />
                  )}

                  <Card type="inner" title="Update Password" bordered>
                    <Form<PasswordFormValues>
                      layout="vertical"
                      form={form}
                      onFinish={handlePasswordUpdate}
                      requiredMark={false}
                    >
                      <Form.Item
                        label="New Password"
                        name="newPassword"
                        rules={[
                          { required: true, message: 'Please enter a new password' },
                          { min: 8, message: 'Password must be at least 8 characters' },
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Enter a new password"
                          autoComplete="new-password"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Confirm Password"
                        name="confirmPassword"
                        dependencies={["newPassword"]}
                        rules={[
                          { required: true, message: 'Please confirm your password' },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                              }
                              return Promise.reject(new Error('Passwords do not match'));
                            },
                          }),
                        ]}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Confirm your new password"
                          autoComplete="new-password"
                        />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={updating}
                        disabled={passwordUpdated}
                        block
                        size="large"
                      >
                        {isResetFlow ? 'Set New Password' : 'Update Password'}
                      </Button>
                    </Form>
                  </Card>

                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Alert
                      type="warning"
                      showIcon
                      message="Stay secure"
                      description="Use a unique password for your executive account. Contact IT immediately if you did not request a reset."
                    />
                    <Button onClick={redirectToBusinessAuth} block>
                      Return to Executive Sign-In
                    </Button>
                  </Space>
                </Space>
              </Col>
            </Row>
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default ExecutiveProfile;
