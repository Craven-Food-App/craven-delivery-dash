import React, { useState, useEffect } from 'react';
import { Card, List, Button, Modal, Form, Input, Select, Tag, Avatar, message, Badge } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  WarningOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Message {
  id: string;
  from_user_id: string;
  subject: string;
  message: string;
  priority: string;
  is_confidential: boolean;
  read_by: string[];
  created_at: string;
}

interface ExecUser {
  id: string;
  role: string;
  title: string;
  user_id: string;
}

export const ExecutiveComms: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [executives, setExecutives] = useState<ExecUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    fetchMessages();
    fetchExecutives();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchExecutives = async () => {
    try {
      const { data: execUsersData, error: execError } = await supabase
        .from('exec_users' as any)
        .select('*');

      if (execError) throw execError;
      setExecutives((execUsersData as any) || []);
    } catch (error) {
      console.error('Error fetching executives:', error);
      setExecutives([]);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    // TODO: Implement once exec_messages table is created
    setMessages([]);
    setLoading(false);
  };

  const sendMessage = async (values: any) => {
    // TODO: Implement once exec_messages table is created
    message.info('Messaging will be available once the database is configured');
    setModalVisible(false);
    form.resetFields();
  };

  const markAsRead = async (messageId: string) => {
    // TODO: Implement once exec_messages table is created
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

  const unreadMessages = messages.filter(m => 
    !m.read_by || !m.read_by.includes(currentUserId)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Executive Communications</h2>
          <p className="text-slate-600">Secure messaging for C-suite and board members</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge count={unreadMessages.length} offset={[-5, 5]}>
            <Button type="default" size="large">
              Inbox
            </Button>
          </Badge>
          <Button
            type="primary"
            icon={<SendOutlined />}
            size="large"
            onClick={() => setModalVisible(true)}
          >
            New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{messages.length}</div>
            <div className="text-sm text-slate-600">Total Messages</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{unreadMessages.length}</div>
            <div className="text-sm text-slate-600">Unread</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{executives.length}</div>
            <div className="text-sm text-slate-600">Executives</div>
          </div>
        </Card>
      </div>

      <Card className="shadow-lg">
        <List
          loading={loading}
          dataSource={messages}
          renderItem={(item: Message) => {
            const isUnread = !item.read_by || !item.read_by.includes(currentUserId);
            
            return (
              <List.Item
                className={`cursor-pointer hover:bg-slate-50 transition-colors ${isUnread ? 'bg-blue-50' : ''}`}
                onClick={() => markAsRead(item.id)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar icon={<UserOutlined />} className="bg-blue-600" />
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <span className={isUnread ? 'font-bold' : ''}>{item.subject}</span>
                      <Tag color={getPriorityColor(item.priority)}>{item.priority}</Tag>
                      {item.is_confidential && (
                        <Tag color="red" icon={<WarningOutlined />}>CONFIDENTIAL</Tag>
                      )}
                      {!isUnread && <CheckOutlined className="text-green-600" />}
                    </div>
                  }
                  description={
                    <div>
                      <div className="text-sm text-slate-700 mb-1">{item.message}</div>
                      <div className="text-xs text-slate-500">
                        {dayjs(item.created_at).format('MMM D, YYYY • h:mm A')}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <MessageOutlined />
            <span>New Executive Message</span>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" form={form} onFinish={sendMessage}>
          <Form.Item
            label="Recipients"
            name="to_user_ids"
            rules={[{ required: true, message: 'Select at least one recipient' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select executives"
              showSearch
              filterOption={(input, option: any) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {executives.map(exec => (
                <Option key={exec.id} value={exec.id}>
                  {exec.title || exec.role.toUpperCase()}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="Message subject..." />
          </Form.Item>

          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Required' }]}
          >
            <TextArea rows={6} placeholder="Type your message..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Priority"
              name="priority"
              initialValue="normal"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="low">Low</Option>
                <Option value="normal">Normal</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Confidential"
              name="is_confidential"
              initialValue={true}
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>Yes (Confidential)</Option>
                <Option value={false}>No (Regular)</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <div className="flex gap-3">
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }} className="flex-1">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} className="flex-1">
                Send Message
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

