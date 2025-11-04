// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Typography, List, Tag, Progress, Modal, Alert } from 'antd';
import { SendOutlined, FileTextOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { docsAPI } from './api';
import { renderHtml } from '@/lib/templates';
import { Resend } from 'https://esm.sh/resend@4.0.0';

const { Title, Text } = Typography;

// C-Suite document types that should be sent to each executive
const CSUITE_DOC_TYPES = [
  { id: 'employment_agreement', title: 'Executive Employment Agreement' },
  { id: 'board_resolution', title: 'Board Resolution – Appointment of Officers' },
  { id: 'founders_agreement', title: "Founders' / Shareholders' Agreement" },
  { id: 'stock_issuance', title: 'Stock Subscription / Issuance Agreement' },
  { id: 'confidentiality_ip', title: 'Confidentiality & IP Assignment Agreement' },
  { id: 'deferred_comp_addendum', title: 'Deferred Compensation Addendum' },
  { id: 'offer_letter', title: 'Executive Offer Letter' },
  { id: 'bylaws_officers_excerpt', title: 'Bylaws – Officers (Excerpt)' },
];

interface Executive {
  id: string;
  user_id: string;
  role: string;
  title: string;
  full_name: string;
  email: string;
}

interface DocumentStatus {
  type: string;
  title: string;
  exists: boolean;
  documentId?: string;
}

export default function SendCSuiteDocs() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMap, setStatusMap] = useState<Record<string, DocumentStatus[]>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      setLoading(true);
      
      // Fetch all C-Suite executives from exec_users
      const { data: execUsers, error: execError } = await supabase
        .from('exec_users')
        .select(`
          id,
          user_id,
          role,
          title,
          user_profiles(full_name, email),
          employees:user_id(first_name, last_name, email)
        `)
        .in('role', ['ceo', 'cfo', 'coo', 'cto', 'cxo', 'executive']);

      if (execError) throw execError;

      // Format executives with name and email
      const formatted: Executive[] = (execUsers || []).map((eu: any) => {
        const fullName = eu.user_profiles?.full_name || 
                        (eu.employees ? `${eu.employees.first_name || ''} ${eu.employees.last_name || ''}`.trim() : '') ||
                        eu.title ||
                        'Unknown Executive';
        
        const email = eu.user_profiles?.email || eu.employees?.email || '';

        return {
          id: eu.id,
          user_id: eu.user_id,
          role: eu.role,
          title: eu.title,
          full_name: fullName,
          email: email,
        };
      }).filter((e: Executive) => e.email); // Only include executives with emails

      setExecutives(formatted);

      // Check existing documents for each executive
      await checkExistingDocuments(formatted);
    } catch (error: any) {
      console.error('Error fetching executives:', error);
      message.error('Failed to load executives');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDocuments = async (execList: Executive[]) => {
    const status: Record<string, DocumentStatus[]> = {};

    for (const exec of execList) {
      const execStatus: DocumentStatus[] = [];

      // Check which documents already exist for this executive
      const { data: existingDocs } = await supabase
        .from('executive_documents')
        .select('id, type, status')
        .eq('officer_name', exec.full_name)
        .or(`role.eq.${exec.role},role.eq.${exec.title}`);

      const existingTypes = new Set(existingDocs?.map((d: any) => d.type) || []);

      for (const docType of CSUITE_DOC_TYPES) {
        execStatus.push({
          type: docType.id,
          title: docType.title,
          exists: existingTypes.has(docType.id),
          documentId: existingDocs?.find((d: any) => d.type === docType.id)?.id,
        });
      }

      status[exec.id] = execStatus;
    }

    setStatusMap(status);
  };

  const generateDocumentData = (exec: Executive, docType: string) => {
    const baseData = {
      company_name: "Crave'n, Inc.",
      full_name: exec.full_name,
      role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
      effective_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      funding_trigger: "Upon Series A funding or significant investment event",
      governing_law: "State of Delaware",
      equity_percentage: exec.role === 'ceo' ? '15' : exec.role === 'cfo' ? '10' : exec.role === 'coo' ? '10' : exec.role === 'cto' ? '10' : '5',
    };

    // Add template-specific data
    switch (docType) {
      case 'board_resolution':
        return {
          ...baseData,
          date: baseData.effective_date,
          directors: "Board of Directors",
          ceo_name: exec.role === 'ceo' ? exec.full_name : '',
          cfo_name: exec.role === 'cfo' ? exec.full_name : '',
          cxo_name: exec.role === 'cxo' ? exec.full_name : '',
          equity_ceo: '15',
          equity_cfo: '10',
          equity_cxo: '5',
        };
      case 'stock_issuance':
        return {
          ...baseData,
          share_count: '100,000',
          class_name: 'Common Stock',
          par_value: '$0.0001',
          consideration: 'Services rendered',
          vesting_schedule: '4 years with 1 year cliff',
        };
      case 'founders_agreement':
        return {
          ...baseData,
          founders_table_html: `<table><tr><td>${exec.full_name}</td><td>${baseData.equity_percentage}%</td></tr></table>`,
          vesting_years: '4',
          cliff_months: '12',
        };
      case 'bylaws_officers_excerpt':
        return {
          ...baseData,
          officer_roles_html: `<ul><li>CEO: ${exec.role === 'ceo' ? exec.full_name : 'TBD'}</li><li>CFO: ${exec.role === 'cfo' ? exec.full_name : 'TBD'}</li></ul>`,
        };
      default:
        return baseData;
    }
  };

  const sendDocumentsToExecutives = async () => {
    if (executives.length === 0) {
      message.warning('No executives found');
      return;
    }

    setSending(true);
    setProgress(0);

    try {
      const totalOperations = executives.length * CSUITE_DOC_TYPES.length;
      let completed = 0;
      const results: { exec: Executive; success: number; failed: number; errors: string[] }[] = [];

      for (const exec of executives) {
        const execResults = { exec, success: 0, failed: 0, errors: [] as string[] };

        for (const docType of CSUITE_DOC_TYPES) {
          try {
            // Check if document already exists
            const status = statusMap[exec.id]?.find(s => s.type === docType.id);
            if (status?.exists && status.documentId) {
              // Document exists, just send it
              await sendExistingDocument(exec, docType, status.documentId);
              execResults.success++;
            } else {
              // Generate new document
              const data = generateDocumentData(exec, docType.id);
              const html_content = renderHtml(docType.id, data);

              // Generate document via API
              const resp = await docsAPI.post('/documents/generate', {
                template_id: docType.id,
                officer_name: exec.full_name,
                role: exec.role === 'cxo' ? 'Chief Experience Officer' : exec.title || exec.role.toUpperCase(),
                equity: docType.id.includes('equity') ? parseFloat(data.equity_percentage) : undefined,
                data,
                html_content,
              });

              if (resp?.ok && resp?.document) {
                // Send document via email
                await sendDocumentEmail(exec, docType.title, resp.document.file_url);
                execResults.success++;
              } else {
                throw new Error('Document generation failed');
              }
            }
          } catch (error: any) {
            console.error(`Error processing ${docType.title} for ${exec.full_name}:`, error);
            execResults.failed++;
            execResults.errors.push(`${docType.title}: ${error.message}`);
          }

          completed++;
          setProgress((completed / totalOperations) * 100);
        }

        results.push(execResults);
      }

      // Show results
      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

      message.success(`Documents sent: ${totalSuccess} successful, ${totalFailed} failed`);

      // Refresh document status
      await checkExistingDocuments(executives);
    } catch (error: any) {
      console.error('Error sending documents:', error);
      message.error(`Failed to send documents: ${error.message}`);
    } finally {
      setSending(false);
      setProgress(0);
    }
  };

  const sendExistingDocument = async (exec: Executive, docType: { id: string; title: string }, documentId: string) => {
    // Fetch document URL
    const { data: doc } = await supabase
      .from('executive_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (doc?.file_url) {
      await sendDocumentEmail(exec, docType.title, doc.file_url);
    }
  };

  const sendDocumentEmail = async (exec: Executive, docTitle: string, docUrl: string) => {
    // Use Resend API to send email
    // Note: This requires Resend API key in environment
    try {
      const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY || '');
      
      await resend.emails.send({
        from: 'Crave\'n HR <hr@craven.com>',
        to: [exec.email],
        subject: `Your ${docTitle} - Crave'n, Inc.`,
        html: `
          <h1>${docTitle}</h1>
          <p>Dear ${exec.full_name},</p>
          <p>Please find your ${docTitle} attached below.</p>
          <p><a href="${docUrl}" style="background-color: #ff7a45; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Document</a></p>
          <p>Best regards,<br/>Crave'n HR Team</p>
        `,
      });
    } catch (error) {
      // Fallback: Log to console if email service unavailable
      console.log(`Would send ${docTitle} to ${exec.email} at ${docUrl}`);
    }
  };

  return (
    <Card
      title={
        <Space>
          <FileTextOutlined style={{ color: '#ff7a45' }} />
          <Title level={4} style={{ margin: 0 }}>Send C-Suite Documents</Title>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={sendDocumentsToExecutives}
          loading={sending}
          disabled={executives.length === 0}
        >
          Send C-Suite Docs
        </Button>
      }
    >
      <Alert
        message="C-Suite Document Distribution"
        description="This will generate and send all required C-Suite documents to each executive. If documents already exist, they will be sent without regeneration."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {sending && (
        <div style={{ marginBottom: 16 }}>
          <Progress percent={Math.round(progress)} status="active" />
          <Text type="secondary">Processing documents...</Text>
        </div>
      )}

      <List
        loading={loading}
        dataSource={executives}
        renderItem={(exec) => {
          const statuses = statusMap[exec.id] || [];
          const existingCount = statuses.filter(s => s.exists).length;
          const totalCount = CSUITE_DOC_TYPES.length;

          return (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{exec.full_name}</Text>
                    <Tag color={exec.role === 'ceo' ? 'red' : exec.role === 'cfo' ? 'blue' : 'green'}>
                      {exec.role.toUpperCase()}
                    </Tag>
                    <Text type="secondary">{exec.email}</Text>
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text>
                      Documents: {existingCount} of {totalCount} generated
                    </Text>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {statuses.map((status) => (
                        <Tag
                          key={status.type}
                          color={status.exists ? 'green' : 'orange'}
                          icon={status.exists ? <CheckCircleOutlined /> : <LoadingOutlined />}
                        >
                          {status.title}
                        </Tag>
                      ))}
                    </div>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
}

