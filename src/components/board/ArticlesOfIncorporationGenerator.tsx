import React, { useCallback, useEffect, useState } from 'react';
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
  Select,
  Space,
  Spin,
  Tabs,
  Typography,
  message,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { supabase } from '@/integrations/supabase/client';
import { CodeOutlined, DownloadOutlined, FileTextOutlined, SyncOutlined } from '@ant-design/icons';
import JsBarcode from 'jsbarcode';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

type EditorMode = 'preview' | 'html';

type Incorporator = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  email?: string;
};

type ShareClass = {
  className: string;
  authorizedShares: number | null;
  parValue?: string;
  votingRights?: string;
};

type BarcodeMeta = {
  docTypeCode: string;
  charterNumber: string;
  entityNumber: string;
  submissionNumber: string;
  filingDate: Dayjs;
  filingTime: string;
  receiptNumber?: string;
};

type ArticlesFormValues = {
  entityName: string;
  entityType: string;
  formationState: string;
  principalAddressLine1: string;
  principalAddressLine2?: string;
  principalCity: string;
  principalState: string;
  principalPostalCode: string;
  principalCounty: string;
  purpose: string;
  duration: string;
  effectiveDate: Dayjs;
  contactEmail: string;
  contactPhone: string;
  statutoryAgentName: string;
  statutoryAgentAddressLine1: string;
  statutoryAgentAddressLine2?: string;
  statutoryAgentCity: string;
  statutoryAgentState: string;
  statutoryAgentPostalCode: string;
  statutoryAgentAcceptance: string;
  shareClasses: ShareClass[];
  incorporators: Incorporator[];
  optionalProvisions: string[];
  barcode: BarcodeMeta;
};

interface TemplateRecord {
  id: string;
  name: string;
  template_key: string;
  html_content: string;
  is_active: boolean;
}

const DEFAULT_BARCODE_META: BarcodeMeta = {
  docTypeCode: 'ART',
  charterNumber: 'DOC-2025-0001',
  entityNumber: '2025123456',
  submissionNumber: 'AIOH-000123',
  filingDate: dayjs(),
  filingTime: dayjs().format('HHmm'),
  receiptNumber: 'RS-987654',
};

const DEFAULT_FORM_VALUES: ArticlesFormValues = {
  entityName: "Crave'N Foods Holdings, Inc.",
  entityType: 'For-Profit Corporation',
  formationState: 'Ohio',
  principalAddressLine1: '123 Innovation Way',
  principalAddressLine2: 'Suite 400',
  principalCity: 'Toledo',
  principalState: 'OH',
  principalPostalCode: '43604',
  principalCounty: 'Lucas',
  purpose:
    'To engage in the business of food delivery, logistics, and any lawful act or activity for which corporations may be organized under Chapter 1701 of the Ohio Revised Code.',
  duration: 'Perpetual',
  effectiveDate: dayjs(),
  contactEmail: 'legal@cravenusa.com',
  contactPhone: '(419) 555-2025',
  statutoryAgentName: 'Jane Legal, Esq.',
  statutoryAgentAddressLine1: '100 Capitol Square',
  statutoryAgentAddressLine2: 'Floor 5',
  statutoryAgentCity: 'Columbus',
  statutoryAgentState: 'OH',
  statutoryAgentPostalCode: '43215',
  statutoryAgentAcceptance:
    'I hereby affirm and acknowledge my appointment as the statutory agent for the above-mentioned entity and consent to act in such capacity.',
  shareClasses: [
    {
      className: 'Common Voting',
      authorizedShares: 1000000,
      parValue: '$0.0001',
      votingRights: 'One vote per share.',
    },
    {
      className: 'Preferred (Series A)',
      authorizedShares: 250000,
      parValue: '$0.001',
      votingRights:
        'Each Preferred share votes on an as-converted basis with Common Stock. Preferred holders receive protective provisions as outlined in the company bylaws.',
    },
  ],
  incorporators: [
    {
      name: 'Maya Thompson',
      addressLine1: '55 Executive Park',
      addressLine2: 'Suite 900',
      city: 'Cleveland',
      state: 'OH',
      postalCode: '44114',
      email: 'maya.thompson@cravenusa.com',
    },
    {
      name: 'Harold Jenkins',
      addressLine1: '900 Commerce Avenue',
      city: 'Cincinnati',
      state: 'OH',
      postalCode: '45202',
      email: 'harold.jenkins@cravenusa.com',
    },
  ],
  optionalProvisions: [
    'The directors are authorized to adopt, amend, or repeal bylaws of the corporation.',
    'Preemptive rights are denied to shareholders except as expressly provided in a written agreement approved by the Board of Directors.',
    'The corporation elects to be governed by Section 1701.59(B) of the Ohio Revised Code regarding director liability limitations.',
  ],
  barcode: DEFAULT_BARCODE_META,
};

const DEFAULT_OHIO_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Articles of Incorporation</title>
  <style>
    body { font-family: "Times New Roman", serif; background: #ffffff; color: #111827; margin: 0; padding: 32px; }
    .page { max-width: 960px; margin: 0 auto; border: 1px solid #d1d5db; padding: 48px; box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12); position: relative; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
    .barcode { width: 220px; text-align: right; font-size: 11px; color: #4b5563; }
    .barcode svg { width: 100%; height: 110px; }
    h1 { text-transform: uppercase; letter-spacing: 2px; font-size: 26px; margin: 0 0 8px; text-align: center; }
    h2 { font-size: 20px; margin: 32px 0 12px; color: #1f2937; }
    h3 { font-size: 16px; margin: 24px 0 8px; color: #1f2937; }
    .state-heading { text-align: center; font-size: 15px; letter-spacing: 1px; color: #334155; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    table th, table td { border: 1px solid #cbd5f5; padding: 10px 14px; text-align: left; vertical-align: top; font-size: 14px; }
    table th { background: #f1f5f9; font-weight: bold; }
    .two-column { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 32px; row-gap: 12px; }
    .section { margin-bottom: 32px; }
    .label { font-weight: bold; font-size: 14px; color: #1f2937; }
    .value { font-size: 14px; color: #0f172a; white-space: pre-line; }
    .incorporators { margin-top: 16px; }
    .incorporator { margin-bottom: 16px; }
    .signature-line { margin-top: 48px; border-top: 1px solid #000; width: 260px; padding-top: 6px; }
    .footer { margin-top: 48px; font-size: 12px; color: #475569; text-align: right; }
    .badge { font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; color: #1d4ed8; }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div>
        <div class="badge">State of Ohio</div>
        <h1>Articles of Incorporation</h1>
        <div class="state-heading">Ohio Secretary of State • Business Services Division</div>
      </div>
      <div class="barcode">
        {{articles_barcode_svg}}
        <div>{{barcode_human_readable}}</div>
      </div>
    </header>

    <div class="section">
      <h2>Corporation Information</h2>
      <div class="two-column">
        <div>
          <div class="label">Entity Name</div>
          <div class="value">{{entity_name}}</div>
        </div>
        <div>
          <div class="label">Entity Type</div>
          <div class="value">{{entity_type}}</div>
        </div>
        <div>
          <div class="label">State of Formation</div>
          <div class="value">{{formation_state}}</div>
        </div>
        <div>
          <div class="label">Effective Date</div>
          <div class="value">{{effective_date}}</div>
        </div>
        <div>
          <div class="label">Duration</div>
          <div class="value">{{duration}}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Principal Office</h2>
      <div class="value">{{principal_office}}</div>
      <div class="value">County: {{principal_county}}</div>
      <div class="value">Contact Email: {{contact_email}}</div>
      <div class="value">Contact Phone: {{contact_phone}}</div>
    </div>

    <div class="section">
      <h2>Purpose Clause</h2>
      <div class="value">{{purpose}}</div>
    </div>

    <div class="section">
      <h2>Authorized Shares</h2>
      {{share_classes_table}}
    </div>

    <div class="section">
      <h2>Statutory Agent Acceptance</h2>
      <div class="value"><strong>{{statutory_agent_name}}</strong></div>
      <div class="value">{{statutory_agent_address}}</div>
      <div class="value">Agent Acceptance Statement:</div>
      <div class="value">{{statutory_agent_acceptance}}</div>
    </div>

    <div class="section">
      <h2>Incorporators</h2>
      {{incorporators_block}}
    </div>

    <div class="section">
      <h2>Optional Provisions</h2>
      {{optional_provisions_block}}
    </div>

    <div class="footer">
      Submission Reference: {{submission_number}} • Charter No.: {{charter_number}} • Entity No.: {{entity_number}} • Receipt: {{receipt_number}}<br/>
      Filed with the Ohio Secretary of State on {{filing_timestamp}} (Doc Type: {{doc_type_code}})
    </div>
  </div>
</body>
</html>`;

const formatDayjs = (value?: Dayjs, format = 'MMMM D, YYYY'): string => {
  if (!value) return '';
  return value.format(format);
};

const sanitizeText = (value?: string | number | null): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const escapeRegExp = (input: string): string => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildShareClassesTable = (shareClasses: ShareClass[]): string => {
  if (!shareClasses?.length) {
    return `<p>No share class information provided.</p>`;
  }

  const rows = shareClasses
    .filter((cls) => cls.className)
    .map(
      (cls) => `<tr>
        <td>${sanitizeText(cls.className)}</td>
        <td>${cls.authorizedShares ?? ''}</td>
        <td>${sanitizeText(cls.parValue)}</td>
        <td>${sanitizeText(cls.votingRights)}</td>
      </tr>`,
    )
    .join('');

  return `<table>
    <thead>
      <tr>
        <th>Class</th>
        <th>Authorized Shares</th>
        <th>Par Value</th>
        <th>Voting Rights / Preferences</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
};

const buildIncorporatorsBlock = (incorporators: Incorporator[]): string => {
  if (!incorporators?.length) {
    return '<p>No incorporators listed.</p>';
  }

  return incorporators
    .filter((inc) => inc.name)
    .map(
      (inc) => `<div class="incorporator">
        <div class="label">${sanitizeText(inc.name)}</div>
        <div class="value">
          ${sanitizeText(inc.addressLine1)}${inc.addressLine2 ? `<br/>${sanitizeText(inc.addressLine2)}` : ''}
          <br/>${sanitizeText(inc.city)}, ${sanitizeText(inc.state)} ${sanitizeText(inc.postalCode)}
          ${inc.email ? `<br/>Email: ${sanitizeText(inc.email)}` : ''}
        </div>
        <div class="signature-line">Signature</div>
      </div>`,
    )
    .join('');
};

const buildOptionalProvisionsBlock = (provisions: string[]): string => {
  if (!provisions?.length) {
    return '<p>No optional provisions elected.</p>';
  }

  const items = provisions
    .filter((text) => text && text.trim().length > 0)
    .map((text) => `<li>${sanitizeText(text)}</li>`)
    .join('');

  return `<ul style="margin-left: 18px;">${items}</ul>`;
};

const createBarcodeSvgMarkup = (payload: string): string => {
  if (!payload || typeof window === 'undefined') {
    return '';
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, payload, {
    format: 'code128',
    displayValue: false,
    height: 80,
    margin: 0,
  });

  return svg.outerHTML;
};

const buildArticlesHtml = (template: string, values: ArticlesFormValues, barcodeSvg: string, barcodeHumanReadable: string): string => {
  const principalAddress = [`${sanitizeText(values.principalAddressLine1)}`]
    .concat(
      [
        sanitizeText(values.principalAddressLine2),
        `${sanitizeText(values.principalCity)}, ${sanitizeText(values.principalState)} ${sanitizeText(values.principalPostalCode)}`,
      ].filter(Boolean),
    )
    .join('<br/>');

  const statutoryAgentAddress = [`${sanitizeText(values.statutoryAgentAddressLine1)}`]
    .concat(
      [
        sanitizeText(values.statutoryAgentAddressLine2),
        `${sanitizeText(values.statutoryAgentCity)}, ${sanitizeText(values.statutoryAgentState)} ${sanitizeText(values.statutoryAgentPostalCode)}`,
      ].filter(Boolean),
    )
    .join('<br/>');

  const replacements: Record<string, string> = {
    '{{entity_name}}': sanitizeText(values.entityName),
    '{{entity_type}}': sanitizeText(values.entityType),
    '{{formation_state}}': sanitizeText(values.formationState),
    '{{effective_date}}': formatDayjs(values.effectiveDate),
    '{{duration}}': sanitizeText(values.duration),
    '{{principal_office}}': principalAddress,
    '{{principal_county}}': sanitizeText(values.principalCounty),
    '{{contact_email}}': sanitizeText(values.contactEmail),
    '{{contact_phone}}': sanitizeText(values.contactPhone),
    '{{purpose}}': sanitizeText(values.purpose),
    '{{share_classes_table}}': buildShareClassesTable(values.shareClasses),
    '{{statutory_agent_name}}': sanitizeText(values.statutoryAgentName),
    '{{statutory_agent_address}}': statutoryAgentAddress,
    '{{statutory_agent_acceptance}}': sanitizeText(values.statutoryAgentAcceptance),
    '{{incorporators_block}}': buildIncorporatorsBlock(values.incorporators),
    '{{optional_provisions_block}}': buildOptionalProvisionsBlock(values.optionalProvisions),
    '{{articles_barcode_svg}}': barcodeSvg || '<div style="height:110px;border:1px dashed #94a3b8;display:flex;align-items:center;justify-content:center;color:#94a3b8;">Barcode Pending</div>',
    '{{barcode_human_readable}}': barcodeHumanReadable,
    '{{submission_number}}': sanitizeText(values.barcode.submissionNumber),
    '{{charter_number}}': sanitizeText(values.barcode.charterNumber),
    '{{entity_number}}': sanitizeText(values.barcode.entityNumber),
    '{{receipt_number}}': sanitizeText(values.barcode.receiptNumber),
    '{{filing_timestamp}}': `${formatDayjs(values.barcode.filingDate)} ${sanitizeText(values.barcode.filingTime)}`,
    '{{doc_type_code}}': sanitizeText(values.barcode.docTypeCode),
  };

  let output = template;
  Object.entries(replacements).forEach(([token, replacement]) => {
    const regex = new RegExp(escapeRegExp(token), 'g');
    output = output.replace(regex, replacement);
  });

  return output;
};

const ArticlesOfIncorporationGenerator: React.FC = () => {
  const [form] = Form.useForm<ArticlesFormValues>();
  const [mode, setMode] = useState<EditorMode>('preview');
  const [templateHtml, setTemplateHtml] = useState<string>(DEFAULT_OHIO_TEMPLATE);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [barcodeReadable, setBarcodeReadable] = useState<string>('');

  const buildBarcodePayload = useCallback((values: ArticlesFormValues): { payload: string; humanReadable: string } => {
    const filingDatePart = values.barcode.filingDate ? values.barcode.filingDate.format('YYYYMMDD') : '';
    const parts = [
      'OH',
      sanitizeText(values.barcode.docTypeCode).toUpperCase(),
      filingDatePart,
      sanitizeText(values.barcode.filingTime),
      sanitizeText(values.barcode.submissionNumber),
      sanitizeText(values.barcode.charterNumber),
      sanitizeText(values.barcode.entityNumber),
    ].filter(Boolean);

    const payload = parts.join('|');
    const humanReadable = [
      `Type: ${sanitizeText(values.barcode.docTypeCode).toUpperCase()}`,
      `Filed: ${values.barcode.filingDate ? values.barcode.filingDate.format('MM/DD/YYYY') : '—'} ${sanitizeText(values.barcode.filingTime)}`,
      `Submission: ${sanitizeText(values.barcode.submissionNumber)}`,
      `Charter: ${sanitizeText(values.barcode.charterNumber)}`,
      `Entity: ${sanitizeText(values.barcode.entityNumber)}`,
    ]
      .filter((text) => !text.endsWith(': '))
      .join(' • ');

    return { payload, humanReadable };
  }, []);

  const syncHtmlWithForm = useCallback(
    (values: Partial<ArticlesFormValues> | undefined = undefined, options?: { forceTemplate?: string }) => {
      const currentFormValues = form.getFieldsValue(true) as ArticlesFormValues;
      const merged = {
        ...DEFAULT_FORM_VALUES,
        ...currentFormValues,
        ...values,
        barcode: {
          ...DEFAULT_FORM_VALUES.barcode,
          ...currentFormValues.barcode,
          ...(values?.barcode ?? {}),
        },
      } as ArticlesFormValues;

      const templateSource = options?.forceTemplate ?? templateHtml;
      const { payload, humanReadable } = buildBarcodePayload(merged);
      let svgMarkup = '';

      if (payload) {
        try {
          svgMarkup = createBarcodeSvgMarkup(payload);
        } catch (error) {
          console.warn('Failed to render barcode:', error);
          svgMarkup = '';
        }
      }

      setBarcodeReadable(humanReadable);
      const compiled = buildArticlesHtml(templateSource, merged, svgMarkup, humanReadable);
      setHtmlContent(compiled);
      return compiled;
    },
    [buildBarcodePayload, form, templateHtml],
  );

  const loadTemplates = useCallback(async () => {
    setTemplateLoading(true);
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('id, name, template_key, html_content, is_active')
        .ilike('template_key', 'articles_of_incorporation%')
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const records = (data as TemplateRecord[]) ?? [];
      setTemplates(records);

      if (records.length > 0) {
        const activeTemplate = records.find((tpl) => tpl.is_active) ?? records[0];
        setSelectedTemplateId(activeTemplate.id);
        setTemplateHtml(activeTemplate.html_content || DEFAULT_OHIO_TEMPLATE);
        syncHtmlWithForm(undefined, { forceTemplate: activeTemplate.html_content || DEFAULT_OHIO_TEMPLATE });
      } else {
        setSelectedTemplateId(null);
        setTemplateHtml(DEFAULT_OHIO_TEMPLATE);
        syncHtmlWithForm(undefined, { forceTemplate: DEFAULT_OHIO_TEMPLATE });
      }
    } catch (error: any) {
      console.error('Failed to load Articles of Incorporation templates:', error);
      message.error('Unable to load Articles of Incorporation templates.');
      setTemplates([]);
      setSelectedTemplateId(null);
      setTemplateHtml(DEFAULT_OHIO_TEMPLATE);
      syncHtmlWithForm(undefined, { forceTemplate: DEFAULT_OHIO_TEMPLATE });
    } finally {
      setTemplateLoading(false);
    }
  }, [syncHtmlWithForm]);

  useEffect(() => {
    form.setFieldsValue(DEFAULT_FORM_VALUES);
    syncHtmlWithForm(DEFAULT_FORM_VALUES);
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTemplateSelect = (templateId?: string) => {
    if (!templateId) {
      setSelectedTemplateId(null);
      setTemplateHtml(DEFAULT_OHIO_TEMPLATE);
      syncHtmlWithForm(undefined, { forceTemplate: DEFAULT_OHIO_TEMPLATE });
      message.info('Reverted to built-in Ohio Articles template.');
      return;
    }

    const template = templates.find((tpl) => tpl.id === templateId);
    if (!template) {
      message.warning('Template not found.');
      return;
    }

    setSelectedTemplateId(templateId);
    setTemplateHtml(template.html_content || DEFAULT_OHIO_TEMPLATE);
    syncHtmlWithForm(undefined, { forceTemplate: template.html_content || DEFAULT_OHIO_TEMPLATE });
    message.success(`Loaded template "${template.name}".`);
  };

  const handleDownloadPdf = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-10000px';
      container.style.left = '-10000px';
      container.style.width = '816px';
      container.style.padding = '32px';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      await doc.html(container, {
        callback: (docInstance) => {
          const filename = `${sanitizeText(form.getFieldValue('entityName')) || 'Articles-of-Incorporation'}.pdf`;
          docInstance.save(filename);
          document.body.removeChild(container);
        },
        margin: [24, 24, 24, 24],
        html2canvas: { scale: 0.62 },
      });
    } catch (error) {
      console.error('Failed to export Articles to PDF:', error);
      message.error('Unable to export Articles to PDF.');
    }
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

  const handleResetTemplate = () => {
    Modal.confirm({
      title: 'Reset Form and Template?',
      content: 'This will reset the form values to default Ohio placeholders and reload the default template.',
      onOk: () => {
        form.setFieldsValue(DEFAULT_FORM_VALUES);
        setTemplateHtml(DEFAULT_OHIO_TEMPLATE);
        setSelectedTemplateId(null);
        syncHtmlWithForm(DEFAULT_FORM_VALUES, { forceTemplate: DEFAULT_OHIO_TEMPLATE });
        message.success('Articles generator reset to defaults.');
      },
    });
  };

  const handleValuesChange = (_: any, allValues: ArticlesFormValues) => {
    syncHtmlWithForm(allValues);
  };

  return (
    <Card bordered={false} className="shadow-2xl">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3} className="!mb-1">
            Articles of Incorporation (Ohio)
          </Title>
          <Text type="secondary">
            Generate official-style Articles of Incorporation for the State of Ohio with auto-populated corporate data and a compliant barcode block.
          </Text>
        </div>

        <Alert
          type="info"
          showIcon
          message="State of Ohio Compliance"
          description="Populate the form with the corporation’s charter, statutory agent, and share structure details. The document preview mirrors the Ohio Secretary of State Form 532A layout, including a Code 128 barcode with filing metadata."
        />

        <Space align="center" wrap>
          <span className="font-semibold">Template</span>
          <Select
            style={{ minWidth: 260 }}
            allowClear
            placeholder="Select Articles template"
            loading={templateLoading}
            value={selectedTemplateId ?? undefined}
            onChange={handleTemplateSelect}
            options={templates.map((tpl) => ({
              value: tpl.id,
              label: tpl.is_active ? tpl.name : `${tpl.name} (inactive)`,
            }))}
          />
          <Button icon={<SyncOutlined spin={templateLoading} />} onClick={loadTemplates}>
            Refresh Templates
          </Button>
          <Button icon={<CodeOutlined />} onClick={() => setMode(mode === 'preview' ? 'html' : 'preview')}>
            {mode === 'preview' ? 'Show HTML' : 'Show Preview'}
          </Button>
          <Button onClick={handleResetTemplate}>Reset</Button>
          <Button icon={<FileTextOutlined />} onClick={handlePrint}>
            Print
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        </Space>

        <Form layout="vertical" form={form} onValuesChange={handleValuesChange}>
          <Tabs
            defaultActiveKey="company"
            tabBarGutter={16}
            items={[
              {
                key: 'company',
                label: 'Company Details',
                children: (
                  <div className="space-y-4">
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="entityName" label="Legal Entity Name" rules={[{ required: true, message: 'Enter the entity name' }]}>
                        <Input placeholder="Legal entity name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="entityType" label="Entity Type" rules={[{ required: true, message: 'Select entity type' }]}>
                        <Select
                          options={[
                            { value: 'For-Profit Corporation', label: 'For-Profit Corporation' },
                            { value: 'Nonprofit Corporation', label: 'Nonprofit Corporation' },
                            { value: 'Professional Corporation', label: 'Professional Corporation' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} md={8}>
                      <Form.Item name="formationState" label="Formation State" rules={[{ required: true, message: 'Enter formation state' }]}>
                        <Input placeholder="Ohio" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="principalCounty" label="Principal County" rules={[{ required: true, message: 'Enter county' }]}>
                        <Input placeholder="County name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true, message: 'Select effective date' }]}>
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="duration" label="Duration" rules={[{ required: true, message: 'Specify duration' }]}>
                        <Input placeholder="Perpetual" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="purpose" label="Purpose Clause" rules={[{ required: true, message: 'Describe corporate purpose' }]}>
                        <TextArea rows={4} placeholder="Add the corporate purpose" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider orientation="left">Principal Office</Divider>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="principalAddressLine1"
                        label="Address Line 1"
                        rules={[{ required: true, message: 'Enter principal address' }]}
                      >
                        <Input placeholder="Street address" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="principalAddressLine2" label="Address Line 2">
                        <Input placeholder="Suite, floor, etc." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} md={8}>
                      <Form.Item name="principalCity" label="City" rules={[{ required: true, message: 'Enter city' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="principalState" label="State" rules={[{ required: true, message: 'Enter state' }]}>
                        <Input placeholder="OH" maxLength={2} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="principalPostalCode" label="Postal Code" rules={[{ required: true, message: 'Enter postal code' }]}>
                        <Input placeholder="ZIP" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="contactEmail" label="Primary Contact Email" rules={[{ type: 'email', message: 'Enter a valid email' }]}>
                        <Input placeholder="legal@yourcompany.com" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="contactPhone" label="Primary Contact Phone">
                        <Input placeholder="(555) 555-1234" />
                      </Form.Item>
                    </Col>
                  </Row>
                  </div>
                ),
              },
              {
                key: 'agent',
                label: 'Statutory Agent & Shares',
                children: (
                  <div className="space-y-4">
                  <Divider orientation="left">Statutory Agent</Divider>
                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item name="statutoryAgentName" label="Agent Name" rules={[{ required: true, message: 'Enter agent name' }]}>
                        <Input placeholder="Full legal name" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="statutoryAgentAcceptance"
                        label="Agent Acceptance Statement"
                        rules={[{ required: true, message: 'Provide agent acceptance statement' }]}
                      >
                        <TextArea rows={3} placeholder="Agent acceptance language" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="statutoryAgentAddressLine1"
                        label="Agent Address Line 1"
                        rules={[{ required: true, message: 'Enter agent address' }]}
                      >
                        <Input placeholder="Street address" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="statutoryAgentAddressLine2" label="Agent Address Line 2">
                        <Input placeholder="Suite, floor, etc." />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={24}>
                    <Col xs={24} md={8}>
                      <Form.Item name="statutoryAgentCity" label="City" rules={[{ required: true, message: 'Enter city' }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name="statutoryAgentState" label="State" rules={[{ required: true, message: 'Enter state' }]}>
                        <Input placeholder="OH" maxLength={2} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="statutoryAgentPostalCode"
                        label="Postal Code"
                        rules={[{ required: true, message: 'Enter postal code' }]}
                      >
                        <Input placeholder="ZIP" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Divider orientation="left">Authorized Shares</Divider>
                  <Form.List name="shareClasses">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {fields.map((field, index) => (
                          <Card key={field.key} size="small" title={`Share Class ${index + 1}`} extra={<Button onClick={() => remove(field.name)}>Remove</Button>}>
                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'className']}
                                  fieldKey={[field.fieldKey, 'className']}
                                  label="Class Name"
                                  rules={[{ required: true, message: 'Enter class name' }]}
                                >
                                  <Input placeholder="e.g., Common Voting" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'authorizedShares']}
                                  fieldKey={[field.fieldKey, 'authorizedShares']}
                                  label="Authorized Shares"
                                  rules={[{ required: true, message: 'Enter authorized shares' }]}
                                >
                                  <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g., 1,000,000" />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'parValue']}
                                  fieldKey={[field.fieldKey, 'parValue']}
                                  label="Par Value"
                                >
                                  <Input placeholder="$0.0001" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'votingRights']}
                                  fieldKey={[field.fieldKey, 'votingRights']}
                                  label="Voting Rights / Preferences"
                                >
                                  <TextArea rows={2} placeholder="Describe voting rights, preferences, and limitations." />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block>
                          Add Share Class
                        </Button>
                      </Space>
                    )}
                  </Form.List>
                  </div>
                ),
              },
              {
                key: 'incorporators',
                label: 'Incorporators & Provisions',
                children: (
                  <div className="space-y-4">
                  <Divider orientation="left">Incorporators</Divider>
                  <Form.List name="incorporators">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {fields.map((field, index) => (
                          <Card key={field.key} size="small" title={`Incorporator ${index + 1}`} extra={<Button onClick={() => remove(field.name)}>Remove</Button>}>
                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'name']}
                                  fieldKey={[field.fieldKey, 'name']}
                                  label="Full Name"
                                  rules={[{ required: true, message: 'Enter incorporator name' }]}
                                >
                                  <Input placeholder="Full legal name" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item {...field} name={[field.name, 'email']} fieldKey={[field.fieldKey, 'email']} label="Email">
                                  <Input type="email" placeholder="name@example.com" />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col xs={24} md={12}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'addressLine1']}
                                  fieldKey={[field.fieldKey, 'addressLine1']}
                                  label="Address Line 1"
                                  rules={[{ required: true, message: 'Enter address line 1' }]}
                                >
                                  <Input placeholder="Street address" />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={12}>
                                <Form.Item {...field} name={[field.name, 'addressLine2']} fieldKey={[field.fieldKey, 'addressLine2']} label="Address Line 2">
                                  <Input placeholder="Suite, floor, etc." />
                                </Form.Item>
                              </Col>
                            </Row>
                            <Row gutter={16}>
                              <Col xs={24} md={8}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'city']}
                                  fieldKey={[field.fieldKey, 'city']}
                                  label="City"
                                  rules={[{ required: true, message: 'Enter city' }]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'state']}
                                  fieldKey={[field.fieldKey, 'state']}
                                  label="State"
                                  rules={[{ required: true, message: 'Enter state' }]}
                                >
                                  <Input placeholder="OH" maxLength={2} />
                                </Form.Item>
                              </Col>
                              <Col xs={24} md={8}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'postalCode']}
                                  fieldKey={[field.fieldKey, 'postalCode']}
                                  label="Postal Code"
                                  rules={[{ required: true, message: 'Enter postal code' }]}
                                >
                                  <Input placeholder="ZIP" />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block>
                          Add Incorporator
                        </Button>
                      </Space>
                    )}
                  </Form.List>

                  <Divider orientation="left">Optional Provisions</Divider>
                  <Form.List name="optionalProvisions">
                    {(fields, { add, remove }) => (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {fields.map((field, index) => (
                          <Card
                            key={field.key}
                            size="small"
                            title={`Provision ${index + 1}`}
                            extra={<Button onClick={() => remove(field.name)}>Remove</Button>}
                          >
                            <Form.Item
                              {...field}
                              name={[field.name]}
                              fieldKey={[field.fieldKey]}
                              rules={[{ required: true, message: 'Enter provision text' }]}
                            >
                              <TextArea rows={3} placeholder="Describe the optional provision or limitation." />
                            </Form.Item>
                          </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block>
                          Add Provision
                        </Button>
                      </Space>
                    )}
                  </Form.List>
                  </div>
                ),
              },
              {
                key: 'barcode',
                label: 'Barcode Metadata',
                children: (
                  <div className="space-y-4">
                  <Paragraph type="secondary">
                    Ohio uses a Code 128 barcode containing filing metadata (document type, filing timestamp, charter number, entity number, and submission ID). Populate the
                    fields below to mirror the official barcode payload.
                  </Paragraph>
                  <Row gutter={24}>
                    <Col xs={24} md={8}>
                      <Form.Item name={['barcode', 'docTypeCode']} label="Document Type Code" rules={[{ required: true, message: 'Enter document type code' }]}>
                        <Input placeholder="ART" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name={['barcode', 'filingDate']} label="Filing Date" rules={[{ required: true, message: 'Select filing date' }]}>
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item name={['barcode', 'filingTime']} label="Filing Time (HHMM)" rules={[{ required: true, message: 'Provide filing time' }]}>
                        <Input placeholder="1432" maxLength={4} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col xs={24} md={6}>
                      <Form.Item name={['barcode', 'submissionNumber']} label="Submission Number" rules={[{ required: true, message: 'Enter submission number' }]}>
                        <Input placeholder="AIOH-000123" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name={['barcode', 'charterNumber']} label="Charter Number" rules={[{ required: true, message: 'Enter charter number' }]}>
                        <Input placeholder="DOC-2025-0001" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name={['barcode', 'entityNumber']} label="Entity Number" rules={[{ required: true, message: 'Enter entity number' }]}>
                        <Input placeholder="2025123456" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item name={['barcode', 'receiptNumber']} label="Receipt Number">
                        <Input placeholder="RS-987654" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Alert
                    type="success"
                    showIcon
                    message="Barcode Payload"
                    description={
                      <div>
                        <strong>Encoded Payload:</strong>
                        <div style={{ fontFamily: 'monospace', fontSize: 13, marginTop: 4 }}>{buildBarcodePayload(form.getFieldsValue(true) as ArticlesFormValues).payload}</div>
                        <div style={{ marginTop: 8 }}>
                          <strong>Human Readable:</strong> {barcodeReadable || 'No metadata provided yet.'}
                        </div>
                      </div>
                    }
                  />
                  </div>
                ),
              },
            ]}
          />
        </Form>

        <Divider />

        <Card bordered className="shadow-inner">
          <Space align="baseline" style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
            <Title level={4} className="!mb-0">
              Document Output
            </Title>
            <Space>
              <Button onClick={() => setMode('preview')} type={mode === 'preview' ? 'primary' : 'default'}>
                Preview
              </Button>
              <Button onClick={() => setMode('html')} type={mode === 'html' ? 'primary' : 'default'}>
                HTML Source
              </Button>
            </Space>
          </Space>

          {mode === 'preview' ? (
            <div style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: 24, maxHeight: 900, overflow: 'auto' }}>
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </div>
          ) : (
            <TextArea value={htmlContent} onChange={(event) => setHtmlContent(event.target.value)} autoSize={{ minRows: 16 }} spellCheck={false} />
          )}
        </Card>

        {templateLoading && (
          <div className="flex items-center gap-2 text-slate-500">
            <Spin size="small" /> <span>Loading templates...</span>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default ArticlesOfIncorporationGenerator;

