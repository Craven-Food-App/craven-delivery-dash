import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Spin,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { supabase } from '@/integrations/supabase/client';
import {
  CopyOutlined,
  PrinterOutlined,
  SendOutlined,
  FilePdfOutlined,
  CodeOutlined,
  EyeOutlined,
  EditOutlined,
  SyncOutlined,
} from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

type EditorMode = 'html' | 'preview' | 'live';

interface IboeTemplate {
  id: string;
  name: string;
  template_key: string;
  html_content: string;
  is_default: boolean;
}

type IboeFormValues = {
  payeeName: string;
  payeeEmail: string;
  drawerName: string;
  drawerEmail: string;
  amount: number;
  currency: string;
  issueDate?: Dayjs;
  maturityDate?: Dayjs;
  reference: string;
  governingLaw: string;
  additionalTerms?: string;
  notes?: string;
};

const defaultValues: IboeFormValues = {
  payeeName: '',
  payeeEmail: '',
  drawerName: '',
  drawerEmail: '',
  amount: 50000,
  currency: 'USD',
  issueDate: dayjs(),
  maturityDate: dayjs().add(90, 'day'),
  reference: `IBOE-${dayjs().format('YYYYMMDD-HHmm')}`,
  governingLaw: 'State of Ohio, United States',
  additionalTerms: 'This International Bill of Exchange is payable upon presentation and is subject to the Uniform Commercial Code (UCC) and the Uniform Rules for Collections.',
  notes: 'Please contact Crave\'n Corporate Treasury for questions or amendments.',
};

const buildInitialHtml = (values: IboeFormValues) => {
  const issueDate = values.issueDate ? values.issueDate.format('MMMM D, YYYY') : '';
  const maturityDate = values.maturityDate ? values.maturityDate.format('MMMM D, YYYY') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>International Bill of Exchange</title>
  <style>
    body { font-family: 'Times New Roman', serif; color: #1f2937; line-height: 1.6; }
    h1, h2 { text-align: center; margin-bottom: 0; }
    .section { margin: 24px 0; }
    .meta { display: flex; justify-content: space-between; margin-top: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 10px; border: 1px solid #d1d5db; }
    th { background: #f3f4f6; text-align: left; }
    .signature { margin-top: 48px; }
    .signature-line { border-bottom: 1px solid #111827; padding-bottom: 4px; }
    .footer { margin-top: 32px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>Crave'n Inc.</h1>
  <h2>International Bill of Exchange</h2>

  <div class="meta">
    <div>
      <strong>Reference:</strong> ${values.reference}<br/>
      <strong>Issue Date:</strong> ${issueDate}<br/>
      <strong>Maturity Date:</strong> ${maturityDate}
    </div>
    <div>
      <strong>Amount:</strong> ${values.currency} ${values.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </div>
  </div>

  <div class="section">
    <table>
      <tr>
        <th>Drawer</th>
        <td>
          ${values.drawerName}<br/>
          ${values.drawerEmail}
        </td>
      </tr>
      <tr>
        <th>Payee</th>
        <td>
          ${values.payeeName}<br/>
          ${values.payeeEmail}
        </td>
      </tr>
      <tr>
        <th>Governing Law</th>
        <td>${values.governingLaw}</td>
      </tr>
      <tr>
        <th>Additional Terms</th>
        <td>${values.additionalTerms ?? ''}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <p>For value received, the drawer irrevocably promises to pay to the order of ${values.payeeName} the sum of ${values.currency} ${values.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} on ${maturityDate}. Payment shall be made at the offices of Crave'n Inc. or such other place as the payee may designate in writing.</p>

    <p>This International Bill of Exchange is issued in accordance with applicable international trade and commercial law, including the Uniform Rules for Collections (URC 522) and customary banking practices.</p>

    ${values.notes ? `<p><strong>Notes:</strong> ${values.notes}</p>` : ''}
  </div>

  <div class="signature">
    <p class="signature-line">${values.drawerName}</p>
    <p>Authorized Signatory, Crave'n Inc.</p>
  </div>

  <div class="footer">
    This document is confidential and intended for the addressed recipient. Unauthorized distribution is prohibited.
  </div>
</body>
</html>`;
};

const IBOESender: React.FC = () => {
  const [form] = Form.useForm<IboeFormValues>();
  const [mode, setMode] = useState<EditorMode>('html');
  const [htmlContent, setHtmlContent] = useState<string>(() => buildInitialHtml(defaultValues));
  const [liveHtml, setLiveHtml] = useState<string>(() => buildInitialHtml(defaultValues));
  const [sending, setSending] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const liveEditRef = useRef<HTMLDivElement | null>(null);
  const [templates, setTemplates] = useState<IboeTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    const initialHtml = buildInitialHtml(defaultValues);
    setHtmlContent(initialHtml);
    setLiveHtml(initialHtml);
    loadTemplates();
  }, []);

  const activeHtml = useMemo(() => {
    if (mode === 'live') return liveHtml;
    return htmlContent;
  }, [mode, liveHtml, htmlContent]);

  const handleGenerateHtml = () => {
    const values = form.getFieldsValue();
    const html = buildInitialHtml({ ...defaultValues, ...values });
    setHtmlContent(html);
    setLiveHtml(html);
    setPreviewKey(Date.now());
    message.success('HTML regenerated from form values.');
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      message.success('HTML copied to clipboard');
    } catch (error) {
      message.error('Unable to copy HTML');
    }
  };

  const handleApplyLiveEdits = () => {
    if (!liveEditRef.current) return;
    const updated = liveEditRef.current.innerHTML;
    setLiveHtml(updated);
    setHtmlContent(updated);
    setPreviewKey(Date.now());
    message.success('Live edits applied to HTML source');
  };

  const handleResetHtml = () => {
    Modal.confirm({
      title: 'Reset HTML to Generated Template?',
      content: 'This will overwrite any manual edits.',
      onOk: () => {
        const values = form.getFieldsValue();
        const html = buildInitialHtml({ ...defaultValues, ...values });
        setHtmlContent(html);
        setLiveHtml(html);
        setPreviewKey(Date.now());
      },
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      message.error('Unable to open print window. Please allow pop-ups for this site.');
      return;
    }
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.width = '612px';
      container.style.padding = '24px';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      await doc.html(container, {
        callback: (docInstance) => {
          docInstance.save(`${form.getFieldValue('reference') || 'IBOE'}.pdf`);
          document.body.removeChild(container);
        },
        margin: [24, 24, 24, 24],
        html2canvas: { scale: 0.6 },
      });
    } catch (error) {
      console.error('PDF export failed', error);
      message.error('Unable to export to PDF.');
    }
  };

  const handleSend = async () => {
    const { payeeEmail, payeeName } = form.getFieldsValue();
    if (!payeeEmail || !payeeName) {
      message.warning('Payee name and email are required to send the IBOE.');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-iboe', {
        body: {
          to: payeeEmail,
          subject: `${form.getFieldValue('reference') || 'International Bill of Exchange'}`,
          html: htmlContent,
          metadata: {
            payeeName,
            reference: form.getFieldValue('reference'),
            amount: form.getFieldValue('amount'),
            currency: form.getFieldValue('currency'),
          },
        },
      });

      if (error) throw error;
      message.success('International Bill of Exchange sent successfully.');
    } catch (error: any) {
      console.error('Failed to send IBOE:', error);
      message.error(error?.message || 'Failed to send IBOE email');
    } finally {
      setSending(false);
    }
  };

  const loadTemplates = async () => {
    setTemplateLoading(true);
    try {
      const { data, error } = await supabase
        .from('iboe_templates')
        .select('id, name, template_key, html_content, is_default, is_active')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const available = (data || []).map((tpl) => ({
        id: tpl.id,
        name: tpl.name,
        template_key: tpl.template_key,
        html_content: tpl.html_content,
        is_default: tpl.is_default,
      }));
      setTemplates(available);
      if (available.length > 0) {
        const preferred = available.find((tpl) => tpl.is_default) ?? available[0];
        setSelectedTemplateId(preferred.id);
        setHtmlContent(preferred.html_content);
        setLiveHtml(preferred.html_content);
        setPreviewKey(Date.now());
      }
    } catch (error: any) {
      console.error('Failed to load IBOE templates:', error);
      message.error('Unable to load IBOE templates.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleTemplateChange = (templateId?: string) => {
    if (!templateId) {
      setSelectedTemplateId(null);
      return;
    }
    setSelectedTemplateId(templateId);
    const tpl = templates.find((item) => item.id === templateId);
    if (tpl) {
      setHtmlContent(tpl.html_content);
      setLiveHtml(tpl.html_content);
      setPreviewKey(Date.now());
      message.success(`Loaded template "${tpl.name}".`);
    }
  };

  return (
    <Card title="International Bill of Exchange (IBOE)" bordered={false} className="shadow-lg">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Alert
          type="info"
          message="Prepare, review, and send international bills of exchange."
          description="Use the form to generate a template, fine-tune the HTML, preview the document, and optionally download or print a PDF copy before sending to the payee."
          showIcon
        />

        <Space wrap align="center">
          <Text strong>Select Template:</Text>
          <Select
            style={{ minWidth: 240 }}
            placeholder="Select IBOE template"
            loading={templateLoading}
            value={selectedTemplateId ?? undefined}
            onChange={handleTemplateChange}
            allowClear
            options={templates.map((tpl) => ({
              value: tpl.id,
              label: tpl.is_default ? `${tpl.name} (Default)` : tpl.name,
            }))}
          />
          <Button icon={<SyncOutlined spin={templateLoading} />} onClick={loadTemplates}>
            Refresh Templates
          </Button>
          {templateLoading && <Spin size="small" />}
        </Space>

        <Form<IboeFormValues>
          form={form}
          layout="vertical"
          initialValues={defaultValues}
          onValuesChange={() => setPreviewKey(Date.now())}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="payeeName"
                label="Payee Name"
                rules={[{ required: true, message: 'Payee name is required' }]}
              >
                <Input placeholder="Enter payee name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="payeeEmail"
                label="Payee Email"
                rules={[{ type: 'email', message: 'Enter a valid email address' }]}
              >
                <Input placeholder="payee@company.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                name="drawerName"
                label="Drawer Name"
                rules={[{ required: true, message: 'Drawer name is required' }]}
              >
                <Input placeholder="Crave'n Authorized Signatory" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="drawerEmail"
                label="Drawer Email"
                rules={[{ type: 'email', message: 'Enter a valid email address' }]}
              >
                <Input placeholder="corporate.treasury@cravenusa.com" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Amount is required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  step={100}
                  prefix="$"
                  placeholder="50000"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true }]}
              >
                <Input placeholder="USD" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="reference" label="Reference" rules={[{ required: true }]}> <Input placeholder="IBOE-2025-001" /> </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item name="issueDate" label="Issue Date"> <DatePicker style={{ width: '100%' }} /> </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="maturityDate" label="Maturity Date"> <DatePicker style={{ width: '100%' }} /> </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item name="governingLaw" label="Governing Law"> <Input placeholder="State of Ohio, United States" /> </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item name="additionalTerms" label="Additional Terms"> <TextArea rows={3} placeholder="Custom obligations, banking instructions, or regulatory notes." /> </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item name="notes" label="Notes"> <TextArea rows={2} placeholder="Internal notes for the payee." /> </Form.Item>
            </Col>
          </Row>

          <Space wrap>
            <Button icon={<CodeOutlined />} onClick={handleGenerateHtml}>Regenerate HTML from Form</Button>
            <Button icon={<CopyOutlined />} onClick={handleCopyHtml}>Copy HTML</Button>
            <Button icon={<EyeOutlined />} onClick={() => { setMode('preview'); message.info('Switched to Preview mode'); }}>Preview</Button>
            <Tooltip title="Restore the template generated from form values">
              <Button onClick={handleResetHtml}>Reset HTML</Button>
            </Tooltip>
          </Space>
        </Form>

        <Divider />

        <div>
          <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 12 }}>
            <Title level={4} style={{ margin: 0 }}>HTML Editor</Title>
            <Segmented
              options={[
                { label: 'HTML', value: 'html', icon: <CodeOutlined /> },
                { label: 'Preview', value: 'preview', icon: <EyeOutlined /> },
                { label: 'Live Edit', value: 'live', icon: <EditOutlined /> },
              ]}
              value={mode}
              onChange={(value) => {
                const nextMode = value as EditorMode;
                setMode(nextMode);
                if (nextMode === 'live') {
                  setLiveHtml(htmlContent);
                }
              }}
            />
          </Space>

          {mode === 'html' && (
            <TextArea
              value={htmlContent}
              autoSize={{ minRows: 16 }}
              onChange={(e) => {
                setHtmlContent(e.target.value);
                setPreviewKey(Date.now());
              }}
              spellCheck={false}
            />
          )}

          {mode === 'preview' && (
            <Card key={previewKey} bordered className="shadow-inner" style={{ minHeight: 300 }}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </Card>
          )}

          {mode === 'live' && (
            <div>
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 12 }}
                message="Live edits are not applied automatically"
                description="Use the 'Apply Live Edits' button to sync changes back to the HTML source."
              />
              <div
                ref={liveEditRef}
                key={previewKey + 1}
                contentEditable
                suppressContentEditableWarning
                className="border border-dashed border-slate-300 rounded-md p-4 min-h-[300px]"
                style={{ outline: 'none' }}
                dangerouslySetInnerHTML={{ __html: liveHtml }}
                onInput={(event) => {
                  const target = event.currentTarget as HTMLDivElement;
                  setLiveHtml(target.innerHTML);
                }}
              />
              <Space style={{ marginTop: 12 }}>
                <Button type="primary" onClick={handleApplyLiveEdits}>Apply Live Edits</Button>
                <Button onClick={() => { setLiveHtml(htmlContent); previewKey && setPreviewKey(Date.now()); }}>Discard Changes</Button>
              </Space>
            </div>
          )}
        </div>

        <Divider />

        <Space wrap>
          <Button icon={<SendOutlined />} type="primary" loading={sending} onClick={handleSend}>
            Send IBOE to Payee
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={handleDownloadPdf}>Download PDF</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>
        </Space>

        <Card bordered className="bg-slate-50">
          <Title level={5}>Tips</Title>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Use the form to quickly populate the template, then fine-tune the HTML as needed.</li>
            <li>Preview mode renders the exact email recipients will see.</li>
            <li>Live Edit lets you tweak visually without altering your original HTML until you apply the changes.</li>
            <li>The Send button delivers the IBOE via the secure Resend integration configured in Supabase Functions.</li>
          </ul>
        </Card>
      </Space>
    </Card>
  );
};

export default IBOESender;
