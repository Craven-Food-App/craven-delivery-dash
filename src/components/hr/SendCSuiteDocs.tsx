// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Button, Card, message, Space, Typography, List, Tag, Progress, Modal, Alert } from 'antd';
import { SendOutlined, FileTextOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { docsAPI } from './api';
import { renderHtml } from '@/lib/templates';

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
      
      // Fetch all C-Suite executives from exec_users (direct query, no joins)
      const { data: execUsers, error: execError } = await supabase
        .from('exec_users')
        .select('id, user_id, role, title, department')
        .in('role', ['ceo', 'cfo', 'coo', 'cto', 'cxo', 'executive']);

      if (execError) {
        console.error('Error fetching exec_users:', execError);
        throw execError;
      }

      if (!execUsers || execUsers.length === 0) {
        console.warn('No exec_users found');
        message.warning('No C-Suite executives found in exec_users table');
        setExecutives([]);
        return;
      }

      console.log('Found exec_users:', execUsers);

      // Fetch user_profiles for all user_ids
      const userIds = execUsers.map((eu: any) => eu.user_id).filter(Boolean);
      let userProfilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (!profilesError && userProfiles) {
          userProfiles.forEach((profile: any) => {
            userProfilesMap[profile.id] = profile;
          });
        }
        console.log('User profiles:', userProfiles);
      }

      // Fetch employees for all user_ids
      let employeesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds);
        
        if (!empError && employees) {
          employees.forEach((emp: any) => {
            employeesMap[emp.user_id] = emp;
          });
        }
        console.log('Employees:', employees);
      }

      // Format executives with name and email
      const formatted: Executive[] = (execUsers || []).map((eu: any) => {
        const userProfile = eu.user_id ? userProfilesMap[eu.user_id] : null;
        const employee = eu.user_id ? employeesMap[eu.user_id] : null;

        const fullName = userProfile?.full_name || 
                        (employee ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() : '') ||
                        eu.title ||
                        `Executive (${eu.role})`;
        
        const email = userProfile?.email || employee?.email || '';

        return {
          id: eu.id,
          user_id: eu.user_id,
          role: eu.role,
          title: eu.title || eu.role.toUpperCase(),
          full_name: fullName,
          email: email,
        };
      });

      console.log('Formatted executives:', formatted);

      // Include all executives, even if they don't have emails (will show warning)
      setExecutives(formatted);

      // Check existing documents for each executive
      await checkExistingDocuments(formatted);
    } catch (error: any) {
      console.error('Error fetching executives:', error);
      message.error(`Failed to load executives: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingDocuments = async (execList: Executive[]) => {
    const status: Record<string, DocumentStatus[]> = {};

    for (const exec of execList) {
      const execStatus: DocumentStatus[] = [];

      // Check which documents already exist for this executive
      // Try multiple matching strategies since names might vary
      const { data: existingDocs, error: docsError } = await supabase
        .from('executive_documents')
        .select('id, type, status, officer_name, role')
        .or(`officer_name.eq.${exec.full_name},role.eq.${exec.role},role.eq.${exec.title}`);

      if (docsError) {
        console.error(`Error checking documents for ${exec.full_name}:`, docsError);
      }

      console.log(`Documents found for ${exec.full_name}:`, existingDocs);

      // Match by type and either name or role
      const existingTypes = new Set(
        (existingDocs || [])
          .filter((d: any) => 
            d.officer_name === exec.full_name || 
            d.role === exec.role || 
            d.role === exec.title
          )
          .map((d: any) => d.type)
      );

      for (const docType of CSUITE_DOC_TYPES) {
        const matchingDoc = existingDocs?.find((d: any) => 
          d.type === docType.id && 
          (d.officer_name === exec.full_name || d.role === exec.role || d.role === exec.title)
        );

        execStatus.push({
          type: docType.id,
          title: docType.title,
          exists: existingTypes.has(docType.id),
          documentId: matchingDoc?.id,
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

        console.log(`Processing documents for ${exec.full_name} (${exec.role})...`);

        for (const docType of CSUITE_DOC_TYPES) {
          try {
            // Check if document already exists
            const status = statusMap[exec.id]?.find(s => s.type === docType.id);
            if (status?.exists && status.documentId) {
              // Document exists, just send it
              console.log(`Document ${docType.title} already exists for ${exec.full_name}, sending...`);
              await sendExistingDocument(exec, docType, status.documentId);
              execResults.success++;
            } else {
              // Generate new document
              console.log(`Generating ${docType.title} for ${exec.full_name}...`);
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

              console.log(`Document generation response for ${exec.full_name} - ${docType.title}:`, resp);

              if (resp?.ok && resp?.document) {
                // Send document via email
                if (exec.email) {
                  try {
                    await sendDocumentEmail(exec, docType.title, resp.document.file_url);
                    console.log(`✓ Successfully generated and sent ${docType.title} for ${exec.full_name}`);
                  } catch (emailError: any) {
                    // Document was generated but email failed
                    console.error(`⚠ Document generated but email failed for ${exec.full_name} - ${docType.title}:`, emailError);
                    // Still count as success since document was created
                    execResults.success++;
                    execResults.errors.push(`Email failed: ${emailError.message || 'Could not send email'}`);
                    continue; // Move to next document
                  }
                } else {
                  console.warn(`No email for ${exec.full_name}, document generated but not sent`);
                }
                execResults.success++;
              } else {
                throw new Error(`Document generation failed: ${resp?.error || 'Unknown error'}`);
              }
            }
          } catch (error: any) {
            console.error(`✗ Error processing ${docType.title} for ${exec.full_name}:`, error);
            execResults.failed++;
            execResults.errors.push(`${docType.title}: ${error.message || error}`);
          }

          completed++;
          setProgress((completed / totalOperations) * 100);
        }

        // Log summary for this executive
        if (execResults.failed > 0) {
          console.error(`${exec.full_name} - ${execResults.success} success, ${execResults.failed} failed:`, execResults.errors);
        } else {
          console.log(`${exec.full_name} - All ${execResults.success} documents processed successfully`);
        }

        results.push(execResults);
      }

      // Show results with detailed breakdown
      const totalSuccess = results.reduce((sum, r) => sum + r.success, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);

      // Show detailed results for each executive
      results.forEach((result) => {
        if (result.failed > 0) {
          message.warning(
            `${result.exec.full_name}: ${result.success} successful, ${result.failed} failed. Check console for details.`,
            5
          );
        }
      });

      if (totalFailed > 0) {
        message.error(`Documents sent: ${totalSuccess} successful, ${totalFailed} failed. Check browser console for details.`, 8);
      } else {
        message.success(`All documents sent successfully: ${totalSuccess} total`);
      }

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
    if (!exec.email) {
      console.warn(`No email address for ${exec.full_name}, skipping email send`);
      return;
    }

    try {
      console.log(`Sending email for ${docTitle} to ${exec.email}...`);
      
      // Use Supabase edge function to send email
      const { data, error } = await supabase.functions.invoke('send-executive-document-email', {
        body: {
          to: exec.email,
          executiveName: exec.full_name,
          documentTitle: docTitle,
          documentUrl: docUrl,
        },
      });

      if (error) {
        console.error(`✗ Email error for ${exec.full_name} - ${docTitle}:`, error);
        throw new Error(`Email failed: ${error.message || 'Unknown error'}`);
      }

      if (data?.success) {
        console.log(`✓ Email sent successfully to ${exec.email} for ${docTitle}`);
      } else {
        console.error(`✗ Email send failed for ${exec.full_name} - ${docTitle}:`, data);
        throw new Error(`Email failed: ${data?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error(`✗ Error sending email to ${exec.email} for ${docTitle}:`, error);
      throw error; // Re-throw so it's caught by the calling function
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
                    {!exec.email && (
                      <Tag color="red" style={{ marginBottom: 4 }}>
                        ⚠ No email address - documents will be generated but not sent
                      </Tag>
                    )}
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

