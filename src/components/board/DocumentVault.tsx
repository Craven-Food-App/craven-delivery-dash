import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Upload, Modal, Form, Input, Select, message } from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  file_url: string;
  file_size_bytes: number;
  access_level: number;
  created_at: string;
}

export const DocumentVault: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exec_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (values: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: execUser } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      // For now, using placeholder URL - in production, upload to Supabase Storage
      const { error } = await supabase
        .from('exec_documents')
        .insert([
          {
            title: values.title,
            description: values.description,
            category: values.category,
            file_url: values.file_url || 'https://placeholder.url/document.pdf',
            file_size_bytes: 0,
            access_level: values.access_level,
            uploaded_by: execUser?.id,
          }
        ]);

      if (error) throw error;

      message.success('Document uploaded successfully!');
      setModalVisible(false);
      form.resetFields();
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      message.error(error.message || 'Failed to upload document');
    }
  };

  const columns = [
    {
      title: 'Document',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Document) => (
        <div className="flex items-center gap-3">
          <FileOutlined className="text-blue-600 text-xl" />
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-slate-600">{record.description}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const colors: Record<string, string> = {
          board_materials: 'purple',
          financial: 'green',
          legal: 'red',
          strategic: 'blue',
          hr: 'orange',
        };
        return <Tag color={colors[category]}>{category.toUpperCase().replace('_', ' ')}</Tag>;
      },
      filters: [
        { text: 'Board Materials', value: 'board_materials' },
        { text: 'Financial', value: 'financial' },
        { text: 'Legal', value: 'legal' },
        { text: 'Strategic', value: 'strategic' },
        { text: 'HR', value: 'hr' },
      ],
      onFilter: (value: any, record: Document) => record.category === value,
    },
    {
      title: 'Size',
      dataIndex: 'file_size_bytes',
      key: 'file_size_bytes',
      render: (bytes: number) => {
        if (bytes === 0) return 'N/A';
        const mb = bytes / (1024 * 1024);
        return mb > 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
      },
    },
    {
      title: 'Access',
      dataIndex: 'access_level',
      key: 'access_level',
      render: (level: number) => (
        <Tag color={level === 1 ? 'red' : level === 2 ? 'orange' : 'blue'} icon={<LockOutlined />}>
          {level === 1 ? 'TOP SECRET' : level === 2 ? 'CONFIDENTIAL' : 'RESTRICTED'}
        </Tag>
      ),
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
      sorter: (a: Document, b: Document) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Document) => (
        <Button
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => window.open(record.file_url, '_blank')}
        >
          Download
        </Button>
      ),
    },
  ];

  const categoryStats = {
    board_materials: documents.filter(d => d.category === 'board_materials').length,
    financial: documents.filter(d => d.category === 'financial').length,
    legal: documents.filter(d => d.category === 'legal').length,
    strategic: documents.filter(d => d.category === 'strategic').length,
    hr: documents.filter(d => d.category === 'hr').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Document Vault</h2>
          <p className="text-slate-600">Secure repository for confidential documents</p>
        </div>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          size="large"
          onClick={() => setModalVisible(true)}
        >
          Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <FolderOutlined className="text-2xl text-purple-600 mb-2" />
          <div className="text-xl font-bold text-purple-600">{categoryStats.board_materials}</div>
          <div className="text-xs text-slate-600">Board Materials</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <FolderOutlined className="text-2xl text-green-600 mb-2" />
          <div className="text-xl font-bold text-green-600">{categoryStats.financial}</div>
          <div className="text-xs text-slate-600">Financial</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <FolderOutlined className="text-2xl text-red-600 mb-2" />
          <div className="text-xl font-bold text-red-600">{categoryStats.legal}</div>
          <div className="text-xs text-slate-600">Legal</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <FolderOutlined className="text-2xl text-blue-600 mb-2" />
          <div className="text-xl font-bold text-blue-600">{categoryStats.strategic}</div>
          <div className="text-xs text-slate-600">Strategic</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <FolderOutlined className="text-2xl text-orange-600 mb-2" />
          <div className="text-xl font-bold text-orange-600">{categoryStats.hr}</div>
          <div className="text-xs text-slate-600">HR</div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="shadow-lg"
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UploadOutlined />
            <span>Upload Document</span>
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
        <Form layout="vertical" form={form} onFinish={uploadDocument}>
          <Form.Item
            label="Document Title"
            name="title"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Q4 Financial Report" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Brief description of the document..." />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select category">
                <Option value="board_materials">Board Materials</Option>
                <Option value="financial">Financial</Option>
                <Option value="legal">Legal</Option>
                <Option value="strategic">Strategic</Option>
                <Option value="hr">HR</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Access Level"
              name="access_level"
              initialValue={1}
              rules={[{ required: true }]}
            >
              <Select>
                <Option value={1}>Top Secret (CEO only)</Option>
                <Option value={2}>Confidential (C-Suite)</Option>
                <Option value={3}>Restricted (All Executives)</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Document URL"
            name="file_url"
            extra="In production, this would be a file upload. For now, paste a URL."
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-3">
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }} className="flex-1">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<UploadOutlined />} className="flex-1">
                Upload Document
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

