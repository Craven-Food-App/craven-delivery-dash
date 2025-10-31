import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Upload, Modal, Form, Input, Select, message } from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  DownloadOutlined,
  UploadOutlined,
  LockOutlined,
  EyeOutlined,
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
  source?: 'exec_documents' | 'employee_documents';
  storage_path?: string;
}

export const DocumentVault: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      // Fetch from both exec_documents and employee_documents
      const [execDocs, empDocs] = await Promise.all([
        supabase.from('exec_documents').select('*').order('created_at', { ascending: false }),
        supabase.from('employee_documents').select('*').order('created_at', { ascending: false })
      ]);

      const allDocs: Document[] = [];
      
      // Map exec_documents
      if (execDocs.data) {
        execDocs.data.forEach((doc: any) => {
          allDocs.push({
            id: doc.id,
            title: doc.title,
            description: doc.description || '',
            category: doc.category,
            file_url: doc.file_url,
            file_size_bytes: doc.file_size_bytes || 0,
            access_level: doc.access_level || 1,
            created_at: doc.created_at,
            source: 'exec_documents'
          });
        });
      }

      // Map employee_documents
      if (empDocs.data) {
        empDocs.data.forEach((doc: any) => {
          // Map document_type to category
          const categoryMap: Record<string, string> = {
            'offer_letter': 'hr',
            'board_resolution': 'board_materials',
            'equity_agreement': 'legal',
            'founders_equity_insurance_agreement': 'legal',
            'employment_contract': 'hr',
            'signed_offer_letter': 'hr',
            'signed_equity_agreement': 'legal',
            'onboarding_packet': 'hr',
            'w2': 'financial',
            'w9': 'financial',
            'other': 'legal'
          };

          // Get public URL from storage
          let fileUrl = doc.file_url || '';
          if (doc.storage_path && !fileUrl) {
            const { data: urlData } = supabase.storage
              .from('hr-documents')
              .getPublicUrl(doc.storage_path);
            fileUrl = urlData.publicUrl;
          }

          allDocs.push({
            id: doc.id,
            title: doc.document_title || doc.document_type,
            description: doc.document_type,
            category: categoryMap[doc.document_type] || 'hr',
            file_url: fileUrl,
            file_size_bytes: doc.file_size_bytes || 0,
            access_level: 2, // HR docs are confidential
            created_at: doc.created_at,
            source: 'employee_documents',
            storage_path: doc.storage_path
          });
        });
      }

      // Sort by date, newest first
      allDocs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setDocuments(allDocs);
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
      if (!user) throw new Error('Not authenticated');

      // Get exec_user_id
      const { data: execUser } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!execUser) throw new Error('Not an executive');

      // Insert into exec_documents
      const { error } = await supabase.from('exec_documents').insert({
        title: values.title,
        description: values.description,
        category: values.category,
        file_url: values.file_url,
        file_size_bytes: 0,
        access_level: values.access_level,
        uploaded_by: execUser.id
      });

      if (error) throw error;

      message.success('Document uploaded successfully');
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
        <div className="flex gap-2">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedDocument(record);
              setViewModalVisible(true);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => window.open(record.file_url, '_blank')}
          >
            Download
          </Button>
        </div>
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

      {/* Document Viewer Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FileOutlined />
            <span>{selectedDocument?.title || 'Document Viewer'}</span>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedDocument(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false);
            setSelectedDocument(null);
          }}>
            Close
          </Button>,
          <Button 
            key="download" 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => selectedDocument && window.open(selectedDocument.file_url, '_blank')}
          >
            Download
          </Button>
        ]}
        width="90%"
        style={{ top: 20 }}
        bodyStyle={{ height: 'calc(100vh - 200px)', padding: 0 }}
      >
        {selectedDocument && (
          <div style={{ height: '100%', overflow: 'auto', padding: '16px' }}>
            {selectedDocument.file_url.endsWith('.html') ? (
              <iframe
                src={selectedDocument.file_url}
                style={{ width: '100%', height: 'calc(100vh - 250px)', border: 'none' }}
                title={selectedDocument.title}
              />
            ) : selectedDocument.file_url.endsWith('.pdf') ? (
              <embed
                src={selectedDocument.file_url}
                type="application/pdf"
                style={{ width: '100%', height: 'calc(100vh - 250px)' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <FileOutlined className="text-6xl text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Document preview not available for this file type
                </p>
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(selectedDocument.file_url, '_blank')}
                  className="mt-4"
                >
                  Download to view
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

