import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Modal,
  Input,
  Select,
  Space,
  Tag,
  message,
  Switch,
  Popover,
  Typography,
  Divider,
  Alert,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CopyOutlined,
  EyeOutlined,
  SaveOutlined,
  FileTextOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';
import { seedTemplatesFromUI } from '@/utils/seedTemplatesFromCode';
import { seedEmailTemplatesFromUI } from '@/utils/seedEmailTemplatesFromCode';
import { clearAllDocumentTemplates, verifyRequiredTemplates } from '@/utils/clearDocumentTemplates';
import { fixTemplatePlaceholdersFromUI } from '@/utils/fixTemplatePlaceholders';
import { VisualTemplateEditor } from './VisualTemplateEditor';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface EmailTemplate {
  id: string;
  name: string;
  template_key: string;
  category: string;
  subject: string;
  html_content: string;
  variables: string[];
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentTemplate {
  id: string;
  template_key: string;
  name: string;
  category: string;
  html_content: string;
  placeholders: string[];
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateUsage {
  id: string;
  template_type: 'email' | 'document';
  template_id: string;
  usage_context: string;
  is_default: boolean;
}

// Email usage contexts
const EMAIL_USAGE_CONTEXTS = [
  { value: 'executive_document_email', label: 'Executive Document Email' },
  { value: 'welcome_executive', label: 'Welcome Executive' },
  { value: 'appointment_notification', label: 'Appointment Notification' },
  { value: 'document_reminder', label: 'Document Reminder' },
];

// Document usage contexts
const DOCUMENT_USAGE_CONTEXTS = [
  { value: 'employment_agreement', label: 'Employment Agreement' },
  { value: 'board_resolution', label: 'Board Resolution' },
  { value: 'founders_agreement', label: "Founders' Agreement" },
  { value: 'stock_issuance', label: 'Stock Issuance' },
  { value: 'confidentiality_ip', label: 'Confidentiality & IP' },
  { value: 'deferred_comp_addendum', label: 'Deferred Compensation' },
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'bylaws_officers_excerpt', label: 'Bylaws Excerpt' },
  { value: 'irs_83b', label: 'IRS Form 83(b)' },
];

const EMAIL_CATEGORIES = ['executive', 'employee', 'customer', 'driver', 'general'];
const DOCUMENT_CATEGORIES = ['executive', 'employee', 'legal', 'financial', 'general'];

export const TemplateManager: React.FC = () => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [templateUsage, setTemplateUsage] = useState<TemplateUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'document'>('email');

  // Modal states
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Form states
  const [editingEmailTemplate, setEditingEmailTemplate] = useState<EmailTemplate | null>(null);
  const [editingDocumentTemplate, setEditingDocumentTemplate] = useState<DocumentTemplate | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  // Email form
  const [emailForm, setEmailForm] = useState({
    name: '',
    template_key: '',
    category: 'executive',
    subject: '',
    html_content: '',
    variables: [] as string[],
    is_active: true,
    description: '',
  });

  // Document form
  const [documentForm, setDocumentForm] = useState({
    template_key: '',
    name: '',
    category: 'executive',
    html_content: '',
    placeholders: [] as string[],
    is_active: true,
    description: '',
  });

  useEffect(() => {
    fetchTemplates();
    fetchTemplateUsage();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const [emailRes, docRes] = await Promise.all([
        supabase.from('email_templates').select('*').order('created_at', { ascending: false }),
        supabase.from('document_templates').select('*').order('created_at', { ascending: false }),
      ]);

      if (emailRes.error) throw emailRes.error;
      if (docRes.error) throw docRes.error;

      setEmailTemplates(emailRes.data || []);
      setDocumentTemplates(docRes.data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplateUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('template_usage')
        .select('*')
        .order('usage_context');

      if (error) throw error;
      setTemplateUsage(data || []);
    } catch (error: any) {
      console.error('Error fetching template usage:', error);
    }
  };

  const handleCreateEmailTemplate = () => {
    setEditingEmailTemplate(null);
    setEmailForm({
      name: '',
      template_key: '',
      category: 'executive',
      subject: '',
      html_content: '',
      variables: [],
      is_active: true,
      description: '',
    });
    setEmailModalVisible(true);
  };

  const handleEditEmailTemplate = (template: EmailTemplate) => {
    setEditingEmailTemplate(template);
    setEmailForm({
      name: template.name,
      template_key: template.template_key,
      category: template.category,
      subject: template.subject,
      html_content: template.html_content,
      variables: template.variables || [],
      is_active: template.is_active,
      description: template.description || '',
    });
    setEmailModalVisible(true);
  };

  const handleSaveEmailTemplate = async () => {
    if (!emailForm.name || !emailForm.template_key || !emailForm.subject || !emailForm.html_content) {
      message.warning('Please fill in all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingEmailTemplate) {
        // Update existing
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: emailForm.name,
            category: emailForm.category,
            subject: emailForm.subject,
            html_content: emailForm.html_content,
            variables: emailForm.variables,
            is_active: emailForm.is_active,
            description: emailForm.description,
          })
          .eq('id', editingEmailTemplate.id);

        if (error) throw error;
        message.success('Email template updated successfully');
      } else {
        // Create new
        const { error } = await supabase.from('email_templates').insert({
          name: emailForm.name,
          template_key: emailForm.template_key,
          category: emailForm.category,
          subject: emailForm.subject,
          html_content: emailForm.html_content,
          variables: emailForm.variables,
          is_active: emailForm.is_active,
          description: emailForm.description,
          created_by: user.id,
        });

        if (error) throw error;
        message.success('Email template created successfully');
      }

      setEmailModalVisible(false);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error saving email template:', error);
      message.error(error.message || 'Failed to save email template');
    }
  };

  const handleDeleteEmailTemplate = async (id: string) => {
    Modal.confirm({
      title: 'Delete Email Template?',
      content: 'Are you sure you want to delete this template? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { error } = await supabase.from('email_templates').delete().eq('id', id);
          if (error) throw error;
          message.success('Template deleted');
          await fetchTemplates();
          await fetchTemplateUsage();
        } catch (error: any) {
          message.error('Failed to delete template');
        }
      },
    });
  };

  const handleCreateDocumentTemplate = () => {
    setEditingDocumentTemplate(null);
    setDocumentForm({
      template_key: '',
      name: '',
      category: 'executive',
      html_content: '',
      placeholders: [],
      is_active: true,
      description: '',
    });
    setDocumentModalVisible(true);
  };

  const handleEditDocumentTemplate = (template: DocumentTemplate) => {
    setEditingDocumentTemplate(template);
    setDocumentForm({
      template_key: template.template_key,
      name: template.name,
      category: template.category,
      html_content: template.html_content,
      placeholders: template.placeholders || [],
      is_active: template.is_active,
      description: template.description || '',
    });
    setDocumentModalVisible(true);
  };

  const handleSaveDocumentTemplate = async () => {
    if (!documentForm.name || !documentForm.template_key || !documentForm.html_content) {
      message.warning('Please fill in all required fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingDocumentTemplate) {
        // Update existing
        const { error } = await supabase
          .from('document_templates')
          .update({
            name: documentForm.name,
            category: documentForm.category,
            html_content: documentForm.html_content,
            placeholders: documentForm.placeholders,
            is_active: documentForm.is_active,
            description: documentForm.description,
          })
          .eq('id', editingDocumentTemplate.id);

        if (error) throw error;
        message.success('Document template updated successfully');
      } else {
        // Create new
        const { error } = await supabase.from('document_templates').insert({
          template_key: documentForm.template_key,
          name: documentForm.name,
          category: documentForm.category,
          html_content: documentForm.html_content,
          placeholders: documentForm.placeholders,
          is_active: documentForm.is_active,
          description: documentForm.description,
          created_by: user.id,
        });

        if (error) throw error;
        message.success('Document template created successfully');
      }

      setDocumentModalVisible(false);
      await fetchTemplates();
    } catch (error: any) {
      console.error('Error saving document template:', error);
      message.error(error.message || 'Failed to save document template');
    }
  };

  const handleDeleteDocumentTemplate = async (id: string) => {
    Modal.confirm({
      title: 'Delete Document Template?',
      content: 'Are you sure you want to delete this template? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const { error } = await supabase.from('document_templates').delete().eq('id', id);
          if (error) throw error;
          message.success('Template deleted');
          await fetchTemplates();
          await fetchTemplateUsage();
        } catch (error: any) {
          message.error('Failed to delete template');
        }
      },
    });
  };

  const handlePreview = (htmlContent: string) => {
    setPreviewContent(htmlContent);
    setPreviewVisible(true);
  };

  const handleManageUsage = () => {
    setUsageModalVisible(true);
  };

  const handleSaveUsage = async (type: 'email' | 'document', context: string, templateId: string, isDefault: boolean) => {
    try {
      // First, remove existing default if setting new default
      if (isDefault) {
        await supabase
          .from('template_usage')
          .update({ is_default: false })
          .eq('template_type', type)
          .eq('usage_context', context)
          .eq('is_default', true);
      }

      // Check if usage already exists
      const { data: existing } = await supabase
        .from('template_usage')
        .select('id')
        .eq('template_type', type)
        .eq('usage_context', context)
        .eq('template_id', templateId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('template_usage')
          .update({ is_default: isDefault })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('template_usage').insert({
          template_type: type,
          template_id: templateId,
          usage_context: context,
          is_default: isDefault,
        });
        if (error) throw error;
      }

      message.success('Template usage updated');
      await fetchTemplateUsage();
    } catch (error: any) {
      console.error('Error saving template usage:', error);
      message.error('Failed to save template usage');
    }
  };

  const extractVariables = (htmlContent: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches).sort();
  };

  const handleHtmlContentChange = (value: string, type: 'email' | 'document') => {
    if (type === 'email') {
      setEmailForm({ ...emailForm, html_content: value, variables: extractVariables(value) });
    } else {
      setDocumentForm({ ...documentForm, html_content: value, placeholders: extractVariables(value) });
    }
  };

  const emailColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: EmailTemplate) => (
        <Space>
          <Text strong>{text}</Text>
          {record.is_active ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
          ) : (
            <Tag color="default" icon={<CloseCircleOutlined />}>Inactive</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Template Key',
      dataIndex: 'template_key',
      key: 'template_key',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Variables',
      dataIndex: 'variables',
      key: 'variables',
      render: (vars: string[]) => (
        <Space wrap>
          {vars?.slice(0, 3).map((v) => (
            <Tag key={v} size="small">{`{{${v}}}`}</Tag>
          ))}
          {vars?.length > 3 && <Text type="secondary">+{vars.length - 3} more</Text>}
        </Space>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: EmailTemplate) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handlePreview(record.html_content)}
          >
            Preview
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditEmailTemplate(record)}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteEmailTemplate(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const documentColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DocumentTemplate) => (
        <Space>
          <Text strong>{text}</Text>
          {record.is_active ? (
            <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
          ) : (
            <Tag color="default" icon={<CloseCircleOutlined />}>Inactive</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Template Key',
      dataIndex: 'template_key',
      key: 'template_key',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: 'Placeholders',
      dataIndex: 'placeholders',
      key: 'placeholders',
      render: (placeholders: string[]) => (
        <Space wrap>
          {placeholders?.slice(0, 3).map((p) => (
            <Tag key={p} size="small">{`{{${p}}}`}</Tag>
          ))}
          {placeholders?.length > 3 && <Text type="secondary">+{placeholders.length - 3} more</Text>}
        </Space>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: DocumentTemplate) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handlePreview(record.html_content)}
          >
            Preview
          </Button>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditDocumentTemplate(record)}
          >
            Edit
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteDocumentTemplate(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>Template Manager</h3>
          <Text type="secondary">Manage email and document HTML templates</Text>
        </div>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              Modal.confirm({
                title: 'Import Document Templates from Code',
                content: 'This will import all document templates from src/lib/templates.ts. Existing templates will be skipped unless you choose to overwrite.',
                okText: 'Import (Skip Existing)',
                cancelText: 'Cancel',
                onOk: async () => {
                  const result = await seedTemplatesFromUI(false);
                  if (result.success) {
                    message.success(result.message);
                    await fetchTemplates();
                  } else {
                    message.error(result.message);
                  }
                },
              });
            }}
          >
            Import Document Templates
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              Modal.confirm({
                title: 'Import Email Templates from Code',
                content: 'This will import email templates from edge functions. Existing templates will be skipped unless you choose to overwrite.',
                okText: 'Import (Skip Existing)',
                cancelText: 'Cancel',
                onOk: async () => {
                  const result = await seedEmailTemplatesFromUI(false);
                  if (result.success) {
                    message.success(result.message);
                    await fetchTemplates();
                  } else {
                    message.error(result.message);
                  }
                },
              });
            }}
          >
            Import Email Templates
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={async () => {
              Modal.confirm({
                title: 'Overwrite All Templates',
                content: 'This will overwrite ALL existing templates (both document and email) with the versions from code. This action cannot be undone.',
                okText: 'Overwrite All',
                okType: 'danger',
                cancelText: 'Cancel',
                onOk: async () => {
                  const [docResult, emailResult] = await Promise.all([
                    seedTemplatesFromUI(true),
                    seedEmailTemplatesFromUI(true),
                  ]);
                  
                  if (docResult.success && emailResult.success) {
                    message.success(`All templates overwritten! Documents: ${docResult.message}, Emails: ${emailResult.message}`);
                    await fetchTemplates();
                  } else {
                    message.error(`Some errors occurred. Documents: ${docResult.success ? 'OK' : docResult.message}, Emails: ${emailResult.success ? 'OK' : emailResult.message}`);
                  }
                },
              });
            }}
            danger
          >
            Overwrite All Templates
          </Button>
          <Button icon={<SettingOutlined />} onClick={handleManageUsage}>
            Manage Template Usage
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as 'email' | 'document')}
        type="card"
        size="large"
        items={[
          {
            key: 'email',
            label: (
              <span>
                <MailOutlined />
                Email Templates ({emailTemplates.length})
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateEmailTemplate}>
                    Create Email Template
                  </Button>
                }
              >
                <Table
                  dataSource={emailTemplates}
                  columns={emailColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'document',
            label: (
              <span>
                <FileTextOutlined />
                Document Templates ({documentTemplates.length})
              </span>
            ),
            children: (
              <Card
                extra={
                  <Space>
                    <Button 
                      icon={<CheckCircleOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: 'Fix Template Placeholders',
                          content: 'This will replace hardcoded values (like "John Doe", dates, amounts) with proper placeholders (like {{full_name}}, {{effective_date}}). This action will update all document templates. Continue?',
                          okText: 'Fix Placeholders',
                          cancelText: 'Cancel',
                          onOk: async () => {
                            await fixTemplatePlaceholdersFromUI();
                            await fetchTemplates();
                          },
                        });
                      }}
                    >
                      Fix Placeholders
                    </Button>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateDocumentTemplate}>
                      Create Document Template
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={documentTemplates}
                  columns={documentColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Email Template Modal */}
      <Modal
        title={editingEmailTemplate ? 'Edit Email Template' : 'Create Email Template'}
        open={emailModalVisible}
        onCancel={() => setEmailModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setEmailModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="preview" icon={<EyeOutlined />} onClick={() => handlePreview(emailForm.html_content)}>
            Preview
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSaveEmailTemplate}>
            Save
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label>Template Name *</label>
            <Input
              value={emailForm.name}
              onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
              placeholder="e.g., Executive Document Email"
            />
          </div>

          <div>
            <label>Template Key *</label>
            <Input
              value={emailForm.template_key}
              onChange={(e) => setEmailForm({ ...emailForm, template_key: e.target.value })}
              placeholder="e.g., executive_document_email"
              disabled={!!editingEmailTemplate}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Unique identifier (cannot be changed after creation)
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label>Category</label>
              <Select
                value={emailForm.category}
                onChange={(value) => setEmailForm({ ...emailForm, category: value })}
                style={{ width: '100%' }}
              >
                {EMAIL_CATEGORIES.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: 24 }}>
              <Switch
                checked={emailForm.is_active}
                onChange={(checked) => setEmailForm({ ...emailForm, is_active: checked })}
              />
              <Text style={{ marginLeft: 8 }}>Active</Text>
            </div>
          </div>

          <div>
            <label>Subject *</label>
            <Input
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              placeholder="Email subject line (use {{variables}} for dynamic content)"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label>HTML Content *</label>
              {emailForm.variables.length > 0 && (
                <Popover
                  title="Available Variables"
                  content={
                    <div>
                      {emailForm.variables.map((v) => (
                        <Tag key={v} style={{ margin: 4 }}>{`{{${v}}}`}</Tag>
                      ))}
                    </div>
                  }
                >
                  <Button size="small" type="link">
                    View Variables ({emailForm.variables.length})
                  </Button>
                </Popover>
              )}
            </div>
            <VisualTemplateEditor
              value={emailForm.html_content}
              onChange={(value) => handleHtmlContentChange(value, 'email')}
              placeholder="Enter HTML email template..."
              height={400}
            />
          </div>

          <div>
            <label>Description</label>
            <TextArea
              value={emailForm.description}
              onChange={(e) => setEmailForm({ ...emailForm, description: e.target.value })}
              placeholder="Optional description of this template"
              rows={2}
            />
          </div>
        </Space>
      </Modal>

      {/* Document Template Modal */}
      <Modal
        title={editingDocumentTemplate ? 'Edit Document Template' : 'Create Document Template'}
        open={documentModalVisible}
        onCancel={() => setDocumentModalVisible(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setDocumentModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="preview" icon={<EyeOutlined />} onClick={() => handlePreview(documentForm.html_content)}>
            Preview
          </Button>,
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSaveDocumentTemplate}>
            Save
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label>Template Name *</label>
            <Input
              value={documentForm.name}
              onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
              placeholder="e.g., Executive Employment Agreement"
            />
          </div>

          <div>
            <label>Template Key *</label>
            <Input
              value={documentForm.template_key}
              onChange={(e) => setDocumentForm({ ...documentForm, template_key: e.target.value })}
              placeholder="e.g., employment_agreement"
              disabled={!!editingDocumentTemplate}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Unique identifier (cannot be changed after creation)
            </Text>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label>Category</label>
              <Select
                value={documentForm.category}
                onChange={(value) => setDocumentForm({ ...documentForm, category: value })}
                style={{ width: '100%' }}
              >
                {DOCUMENT_CATEGORIES.map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Option>
                ))}
              </Select>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: 24 }}>
              <Switch
                checked={documentForm.is_active}
                onChange={(checked) => setDocumentForm({ ...documentForm, is_active: checked })}
              />
              <Text style={{ marginLeft: 8 }}>Active</Text>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label>HTML Content *</label>
              {documentForm.placeholders.length > 0 && (
                <Popover
                  title="Available Placeholders"
                  content={
                    <div>
                      {documentForm.placeholders.map((p) => (
                        <Tag key={p} style={{ margin: 4 }}>{`{{${p}}}`}</Tag>
                      ))}
                    </div>
                  }
                >
                  <Button size="small" type="link">
                    View Placeholders ({documentForm.placeholders.length})
                  </Button>
                </Popover>
              )}
            </div>
            <VisualTemplateEditor
              value={documentForm.html_content}
              onChange={(value) => handleHtmlContentChange(value, 'document')}
              placeholder="Enter HTML document template..."
              height={500}
            />
          </div>

          <div>
            <label>Description</label>
            <TextArea
              value={documentForm.description}
              onChange={(e) => setDocumentForm({ ...documentForm, description: e.target.value })}
              placeholder="Optional description of this template"
              rows={2}
            />
          </div>
        </Space>
      </Modal>

      {/* Template Usage Management Modal */}
      <Modal
        title="Manage Template Usage"
        open={usageModalVisible}
        onCancel={() => setUsageModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setUsageModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Tabs
          defaultActiveKey="email"
          items={[
            {
              key: 'email',
              label: 'Email Templates',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {EMAIL_USAGE_CONTEXTS.map((context) => {
                    const currentUsage = templateUsage.find(
                      (u) => u.template_type === 'email' && u.usage_context === context.value && u.is_default
                    );
                    const availableTemplates = emailTemplates.filter((t) => t.is_active);

                    return (
                      <Card key={context.value} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>{context.label}</Text>
                            {currentUsage && (
                              <Tag color="green" style={{ marginLeft: 8 }}>
                                {emailTemplates.find((t) => t.id === currentUsage.template_id)?.name || 'Unknown'}
                              </Tag>
                            )}
                          </div>
                          <Select
                            value={currentUsage?.template_id || undefined}
                            onChange={(value) => handleSaveUsage('email', context.value, value, true)}
                            placeholder="Select template"
                            style={{ width: 300 }}
                            allowClear
                          >
                            {availableTemplates.map((template) => (
                              <Option key={template.id} value={template.id}>
                                {template.name} ({template.template_key})
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              ),
            },
            {
              key: 'document',
              label: 'Document Templates',
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {DOCUMENT_USAGE_CONTEXTS.map((context) => {
                    const currentUsage = templateUsage.find(
                      (u) => u.template_type === 'document' && u.usage_context === context.value && u.is_default
                    );
                    const availableTemplates = documentTemplates.filter((t) => t.is_active);

                    return (
                      <Card key={context.value} size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <Text strong>{context.label}</Text>
                            {currentUsage && (
                              <Tag color="green" style={{ marginLeft: 8 }}>
                                {documentTemplates.find((t) => t.id === currentUsage.template_id)?.name || 'Unknown'}
                              </Tag>
                            )}
                          </div>
                          <Select
                            value={currentUsage?.template_id || undefined}
                            onChange={(value) => handleSaveUsage('document', context.value, value, true)}
                            placeholder="Select template"
                            style={{ width: 300 }}
                            allowClear
                          >
                            {availableTemplates.map((template) => (
                              <Option key={template.id} value={template.id}>
                                {template.name} ({template.template_key})
                              </Option>
                            ))}
                          </Select>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              ),
            },
          ]}
        />
      </Modal>

      {/* Preview Modal */}
      <Modal
        title="Template Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div
          style={{
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            padding: '16px',
            maxHeight: '600px',
            overflow: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: previewContent }}
        />
      </Modal>
    </div>
  );
};

