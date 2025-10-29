import React, { useState, useEffect } from 'react';
import { 
  Card, List, Button, Modal, Form, Input, Select, Tag, Avatar, message, 
  Badge, Space, Typography, Divider, Empty, Spin, Tooltip, Alert, Tabs
} from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  WarningOutlined,
  CheckOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  MailOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface Message {
  id: string;
  from_user_id: string;
  from_user?: {
    id: string;
    title: string;
    role: string;
  };
  to_user_ids: string[];
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_confidential: boolean;
  read_by: string[];
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  role: string;
  type: 'executive' | 'admin';
  email?: string;
}

export const ExecutiveComms: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentExecId, setCurrentExecId] = useState<string>('');
  const [searchText, setSearchText] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterUnread, setFilterUnread] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');

  useEffect(() => {
    initializeComms();
  }, []);

  useEffect(() => {
    if (currentExecId) {
      // Subscribe to real-time message updates
      const subscription = supabase
        .channel('exec_messages_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'exec_messages',
          },
          (payload) => {
            console.log('Real-time message update:', payload);
            fetchMessages(); // Refresh messages on any change
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [currentExecId]);

  const initializeComms = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        message.error('Please log in to access communications');
        return;
      }

      setCurrentUserId(user.id);

      // Get current exec user record
      const { data: execData, error: execError } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (execError) {
        // Try CEO bypass
        if (user.email === 'craven@usa.com') {
          const { data: ceoExec } = await supabase
            .from('exec_users')
            .select('id')
            .eq('role', 'ceo')
            .single();
          
          if (ceoExec) {
            setCurrentExecId(ceoExec.id);
          }
        }
      } else if (execData) {
        setCurrentExecId(execData.id);
      }

      await Promise.all([
        fetchMessages(),
        fetchContacts()
      ]);

    } catch (error) {
      console.error('Error initializing comms:', error);
      message.error('Failed to initialize communications');
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      // Fetch executives from exec_users
      const { data: execData, error: execError } = await supabase
        .from('exec_users')
        .select('id, role, title, user_id');

      if (execError) throw execError;

      // Fetch admin employees
      const { data: employeeData, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, job_title, email, department')
        .in('job_title', [
          'Chief Executive Officer',
          'Chief Financial Officer', 
          'Chief Operating Officer', 
          'Chief Technology Officer',
          'Chief Marketing Officer',
          'Chief Product Officer',
          'Administrator',
          'Senior Administrator'
        ])
        .eq('employment_status', 'active');

      if (empError) console.warn('Error fetching employees:', empError);

      // Map executives
      const executives: Contact[] = (execData || []).map(exec => ({
        id: exec.id,
        name: exec.title || exec.role.toUpperCase(),
        title: exec.title,
        role: exec.role,
        type: 'executive' as const
      }));

      // Map employees
      const employees: Contact[] = (employeeData || []).map(emp => ({
        id: emp.id,
        name: `${emp.first_name} ${emp.last_name}`,
        title: emp.job_title,
        role: emp.department || 'admin',
        type: 'admin' as const,
        email: emp.email
      }));

      const allContacts = [...executives, ...employees];
      setContacts(allContacts);

    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchMessages = async () => {
    if (!currentExecId) return;

    try {
      const { data, error } = await supabase
        .from('exec_messages')
        .select('*')
        .or(`from_user_id.eq.${currentExecId},to_user_ids.cs.{${currentExecId}}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        // Don't show error to user, just use empty array
        setMessages([]);
        return;
      }

      // Fetch sender details for each message
      const messagesWithSenders = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: senderData } = await supabase
            .from('exec_users')
            .select('id, title, role')
            .eq('id', msg.from_user_id)
            .single();

          return {
            ...msg,
            from_user: senderData || undefined
          };
        })
      );

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setMessages([]);
    }
  };

  const sendMessage = async (values: any) => {
    if (!currentExecId) {
      message.error('Unable to send message: User not found');
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('exec_messages')
        .insert({
          from_user_id: currentExecId,
          to_user_ids: values.recipients,
          subject: values.subject,
          message: values.message,
          priority: values.priority || 'normal',
          is_confidential: values.is_confidential || false
        })
        .select()
        .single();

      if (error) throw error;

      // Log to audit trail
      await logAuditTrail('message_sent', {
        message_id: data.id,
        recipients: values.recipients.length,
        priority: values.priority,
        subject: values.subject
      });

      message.success('Message sent successfully');
      setModalVisible(false);
      form.resetFields();
      fetchMessages();

    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!currentExecId) return;

    try {
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const updatedReadBy = [...(msg.read_by || [])];
      if (!updatedReadBy.includes(currentExecId)) {
        updatedReadBy.push(currentExecId);
      }

      const { error } = await supabase
        .from('exec_messages')
        .update({ read_by: updatedReadBy })
        .eq('id', messageId);

      if (error) throw error;

      fetchMessages();

    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const logAuditTrail = async (action: string, details: any) => {
    try {
      await supabase
        .from('exec_audit_logs')
        .insert({
          user_id: currentExecId,
          action_type: action,
          action_category: 'communications',
          target_type: 'message',
          details: details,
          severity: 'normal'
        });
    } catch (error) {
      console.error('Error logging audit trail:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'default',
      normal: 'blue',
      high: 'orange',
      urgent: 'red',
    };
    return colors[priority] || 'default';
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'urgent') return <WarningOutlined />;
    if (priority === 'high') return <ClockCircleOutlined />;
    return null;
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = !searchText || 
      msg.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || msg.priority === filterPriority;
    
    const isUnread = !msg.read_by || !msg.read_by.includes(currentExecId);
    const matchesUnread = !filterUnread || isUnread;

    return matchesSearch && matchesPriority && matchesUnread;
  });

  // Separate inbox and sent messages
  const inboxMessages = filteredMessages.filter(m => m.to_user_ids?.includes(currentExecId));
  const sentMessages = filteredMessages.filter(m => m.from_user_id === currentExecId);
  const unreadCount = inboxMessages.filter(m => !m.read_by || !m.read_by.includes(currentExecId)).length;

  const viewMessage = (msg: Message) => {
    setSelectedMessage(msg);
    setDetailModalVisible(true);
    if (!msg.read_by || !msg.read_by.includes(currentExecId)) {
      markAsRead(msg.id);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#262626' }}>
              <MessageOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Executive Communications
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              Secure messaging for board members and administrators
            </Text>
          </div>
          <Space>
            <Badge count={unreadCount} offset={[-5, 5]}>
              <Button icon={<ReloadOutlined />} onClick={fetchMessages} loading={loading}>
                Refresh
              </Button>
            </Badge>
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={() => setModalVisible(true)}
              size="large"
            >
              New Message
            </Button>
          </Space>
        </div>

        {/* Search and Filters */}
        <Card style={{ borderRadius: '12px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              placeholder="Search messages..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Space>
              <Select
                value={filterPriority}
                onChange={setFilterPriority}
                style={{ width: 150 }}
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Priorities</Option>
                <Option value="urgent">Urgent</Option>
                <Option value="high">High</Option>
                <Option value="normal">Normal</Option>
                <Option value="low">Low</Option>
              </Select>
              <Button
                type={filterUnread ? 'primary' : 'default'}
                onClick={() => setFilterUnread(!filterUnread)}
                icon={<MailOutlined />}
              >
                {filterUnread ? 'Unread Only' : 'All Messages'}
              </Button>
            </Space>
          </Space>
        </Card>

        {/* Messages List */}
        <Card style={{ borderRadius: '12px' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane 
              tab={
                <span>
                  <MailOutlined />
                  Inbox
                  {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
                </span>
              } 
              key="inbox"
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spin size="large" />
                </div>
              ) : inboxMessages.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No messages in your inbox"
                />
              ) : (
                <List
                  dataSource={inboxMessages}
                  renderItem={(msg) => {
                    const isUnread = !msg.read_by || !msg.read_by.includes(currentExecId);
                    return (
                      <List.Item
                        key={msg.id}
                        style={{
                          cursor: 'pointer',
                          background: isUnread ? '#f0f9ff' : 'transparent',
                          padding: '16px',
                          borderRadius: '8px',
                          marginBottom: '8px',
                          border: isUnread ? '1px solid #91d5ff' : '1px solid #f0f0f0'
                        }}
                        onClick={() => viewMessage(msg)}
                      >
                        <List.Item.Meta
                          avatar={
                            <Badge dot={isUnread} offset={[-5, 5]}>
                              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                            </Badge>
                          }
                          title={
                            <Space>
                              <Text strong style={{ fontSize: '16px' }}>{msg.subject}</Text>
                              <Tag color={getPriorityColor(msg.priority)}>
                                {getPriorityIcon(msg.priority)} {msg.priority.toUpperCase()}
                              </Tag>
                              {msg.is_confidential && (
                                <Tag color="gold" icon={<SafetyOutlined />}>CONFIDENTIAL</Tag>
                              )}
                            </Space>
                          }
                          description={
                            <Space direction="vertical" size={0}>
                              <Text type="secondary">
                                From: {msg.from_user?.title || 'Unknown'}
                              </Text>
                              <Text type="secondary" ellipsis style={{ maxWidth: 600 }}>
                                {msg.message.substring(0, 100)}...
                              </Text>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                <ClockCircleOutlined /> {dayjs(msg.created_at).fromNow()}
                              </Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <SendOutlined />
                  Sent ({sentMessages.length})
                </span>
              } 
              key="sent"
            >
              {sentMessages.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No sent messages"
                />
              ) : (
                <List
                  dataSource={sentMessages}
                  renderItem={(msg) => (
                    <List.Item
                      key={msg.id}
                      style={{
                        cursor: 'pointer',
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        border: '1px solid #f0f0f0'
                      }}
                      onClick={() => viewMessage(msg)}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                        title={
                          <Space>
                            <Text strong style={{ fontSize: '16px' }}>{msg.subject}</Text>
                            <Tag color={getPriorityColor(msg.priority)}>
                              {msg.priority.toUpperCase()}
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary">
                              To: {msg.to_user_ids?.length} recipient(s)
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              <ClockCircleOutlined /> {dayjs(msg.created_at).fromNow()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </TabPane>
          </Tabs>
        </Card>
      </Space>

      {/* New Message Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            <span>New Message</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={sendMessage}
        >
          <Form.Item
            label="Recipients"
            name="recipients"
            rules={[{ required: true, message: 'Please select recipients' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select recipients"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={contacts.map(contact => ({
                value: contact.id,
                label: `${contact.name} - ${contact.title}`,
                type: contact.type
              }))}
              optionRender={(option) => (
                <Space>
                  <TeamOutlined style={{ color: option.data.type === 'executive' ? '#1890ff' : '#52c41a' }} />
                  {option.label}
                </Space>
              )}
            />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="Message subject" />
          </Form.Item>

          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Please enter your message' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="Type your message here..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item label="Priority" name="priority" initialValue="normal">
            <Select>
              <Option value="low">Low</Option>
              <Option value="normal">Normal</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_confidential" valuePropName="checked">
            <Space>
              <input type="checkbox" />
              <Text>Mark as confidential</Text>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={sending} icon={<SendOutlined />}>
                Send Message
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Message Detail Modal */}
      <Modal
        title={
          <Space>
            <MessageOutlined />
            <span>{selectedMessage?.subject}</span>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedMessage(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedMessage && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              message={
                <Space>
                  <Text strong>From:</Text>
                  <Text>{selectedMessage.from_user?.title || 'Unknown'}</Text>
                  <Divider type="vertical" />
                  <Text strong>Priority:</Text>
                  <Tag color={getPriorityColor(selectedMessage.priority)}>
                    {selectedMessage.priority.toUpperCase()}
                  </Tag>
                  {selectedMessage.is_confidential && (
                    <>
                      <Divider type="vertical" />
                      <Tag color="gold" icon={<SafetyOutlined />}>CONFIDENTIAL</Tag>
                    </>
                  )}
                </Space>
              }
              type="info"
            />
            
            <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
              <Text style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                {selectedMessage.message}
              </Text>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ClockCircleOutlined /> {dayjs(selectedMessage.created_at).format('MMMM D, YYYY [at] h:mm A')}
              </Text>
            </div>

            {selectedMessage.read_by && selectedMessage.read_by.length > 0 && (
              <Alert
                message={
                  <Space>
                    <CheckOutlined style={{ color: '#52c41a' }} />
                    <Text>Read by {selectedMessage.read_by.length} recipient(s)</Text>
                  </Space>
                }
                type="success"
              />
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
};
