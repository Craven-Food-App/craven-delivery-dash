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
import {
  CloudUploadOutlined,
  CodeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  LinkOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import JsBarcode from 'jsbarcode';
import { docsAPI } from '@/components/hr/api';
import ohioSealImage from '@/assets/ohio-state-seal.png';

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
  <title>State of Ohio – Certificate of Incorporation</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 48px; font-family: "Times New Roman", serif; background: #f8fafc; color: #111827; }
    .certificate {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border: 12px double #1f2937;
      padding: 36px 48px;
      position: relative;
      box-shadow: 0 30px 60px rgba(15, 23, 42, 0.15);
    }
    .border-inner {
      position: absolute;
      inset: 28px;
      border: 2px solid #1f2937;
      pointer-events: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
    }
    .seal {
      width: 120px;
      height: 120px;
      border: 4px double #1f2937;
      border-radius: 50%;
      overflow: hidden;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 24px;
    }
    .seal img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .title-block {
      flex: 1;
      text-align: right;
      color: #1f2937;
    }
    .title-block h1 {
      margin: 0;
      font-size: 30px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .title-block .subtitle {
      font-size: 14px;
      letter-spacing: 1px;
      margin-top: 6px;
    }
    .barcode-wrapper {
      text-align: right;
      font-size: 11px;
      color: #4b5563;
      margin-top: 12px;
    }
    .barcode-wrapper svg {
      width: 220px;
      height: 110px;
      display: block;
      margin-left: auto;
      border: 1px solid #94a3b8;
      padding: 4px;
      background: #ffffff;
    }

    .certificate-body {
      margin-top: 28px;
      line-height: 1.8;
      font-size: 15px;
    }
    .certificate-body .opening {
      font-size: 16px;
      text-align: center;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 20px;
    }
    .certificate-body .paragraph {
      margin-bottom: 18px;
      text-indent: 28px;
    }
    .certificate-body .centered {
      text-align: center;
      margin: 20px 0;
      font-size: 18px;
      font-weight: bold;
      letter-spacing: 1.2px;
      text-transform: uppercase;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 14px;
    }
    .info-table th, .info-table td {
      border: 1px solid #1f2937;
      padding: 10px 14px;
      text-align: left;
      vertical-align: top;
    }
    .info-table th {
      background: #f1f5f9;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      width: 32%;
    }

    .share-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .share-table th, .share-table td { border: 1px solid #1f2937; padding: 8px 10px; font-size: 13px; text-align: left; }
    .share-table th { background: #e5e7eb; text-transform: uppercase; letter-spacing: 0.5px; font-size: 12px; }

    .signature-block {
      margin-top: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 32px;
    }
    .signature-card {
      border-top: 2px solid #1f2937;
      padding-top: 12px;
      font-size: 13px;
      letter-spacing: 0.3px;
    }
    .signature-line {
      margin-top: 18px;
      border-top: 1px solid #1f2937;
      padding-top: 6px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    footer {
      margin-top: 48px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #334155;
    }
    footer .left { max-width: 65%; }
    footer .right { text-align: right; }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="border-inner"></div>
    <div class="header">
      <div class="seal">
        <img src="{{ohio_seal_src}}" alt="Seal of the Secretary of State of Ohio" />
      </div>
      <div class="title-block">
        <h1>Certificate of Incorporation</h1>
        <div class="subtitle">Ohio Secretary of State • Business Services Division</div>
        <div class="barcode-wrapper">
          {{articles_barcode_svg}}
          <div>{{barcode_human_readable}}</div>
        </div>
      </div>
    </div>

    <div class="certificate-body">
      <div class="opening">To All to Whom These Presents Shall Come, Greetings:</div>
      <div class="paragraph">
        I, the Secretary of State of the State of Ohio, do hereby certify that the foregoing is a true and correct copy of the <strong>Articles of Incorporation</strong> filed for
        <strong>{{entity_name}}</strong>, an Ohio {{entity_type}}, duly organized under the laws of the State of Ohio.
      </div>
      <div class="paragraph">
        It is hereby certified that the entity name appears on the records of this office as of the filing date indicated below, and that said entity is authorized to transact business pursuant to the provisions of the Ohio Revised Code.
      </div>
      <div class="centered">Certificate Information</div>

      <table class="info-table">
        <tr>
          <th>Corporate Name</th>
          <td>{{entity_name}}</td>
        </tr>
        <tr>
          <th>Entity Type</th>
          <td>{{entity_type}}</td>
        </tr>
        <tr>
          <th>Ohio Charter / Document Number</th>
          <td>{{charter_number}}</td>
        </tr>
        <tr>
          <th>Entity / Registration Number</th>
          <td>{{entity_number}}</td>
        </tr>
        <tr>
          <th>Filing Date and Time</th>
          <td>{{filing_timestamp}}</td>
        </tr>
        <tr>
          <th>Principal Office</th>
          <td>{{principal_office}}<br/>County: {{principal_county}}<br/>Contact: {{contact_email}} • {{contact_phone}}</td>
        </tr>
        <tr>
          <th>Purpose & Duration</th>
          <td><strong>Purpose:</strong> {{purpose}}<br/><strong>Duration:</strong> {{duration}}</td>
        </tr>
        <tr>
          <th>Statutory Agent</th>
          <td><strong>{{statutory_agent_name}}</strong><br/>{{statutory_agent_address}}<br/><em>Acceptance on file:</em> {{statutory_agent_acceptance}}</td>
        </tr>
      </table>

      <div class="centered">Share Structure</div>
      {{share_classes_table}}

      <div class="centered">Additional Provisions</div>
      {{optional_provisions_block}}

      <div class="centered">Incorporator(s) of Record</div>
      {{incorporators_block}}
    </div>

    <div class="signature-block">
      <div class="signature-card">
        In testimony whereof, I have hereunto subscribed my name and affixed my official seal on {{filing_timestamp}}.
        <div class="signature-line">Secretary of State</div>
        <div class="signature-line">State of Ohio</div>
      </div>
      <div class="signature-card">
        Document Reference: {{submission_number}}<br/>
        Receipt Number: {{receipt_number}}<br/>
        Document Type: {{doc_type_code}}<br/>
        Filing Location: Columbus, Ohio
      </div>
    </div>

    <footer>
      <div class="left">
        This certificate evidences incorporation and authorization of the above-named entity under the laws of the State of Ohio. Verification of authenticity is available at https://businesssearch.ohiosos.gov using the entity number provided.
      </div>
      <div class="right">
        Secretary of State • Business Services Division<br/>
        22 North Fourth Street • Columbus, Ohio 43215<br/>
        877.767.3453 • www.OhioSoS.gov
      </div>
    </footer>
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
    return `<p class="field-value">No share class information provided.</p>`;
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

  return `<table class="share-table">
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
    return '<p class="field-value">No incorporators listed.</p>';
  }

  const cards = incorporators
    .filter((inc) => inc.name)
    .map(
      (inc) => `<div class="signature-card">
        <div class="name">${sanitizeText(inc.name)}</div>
        <div class="field-value">
          ${sanitizeText(inc.addressLine1)}${inc.addressLine2 ? `<br/>${sanitizeText(inc.addressLine2)}` : ''}
          <br/>${sanitizeText(inc.city)}, ${sanitizeText(inc.state)} ${sanitizeText(inc.postalCode)}
          ${inc.email ? `<br/>Email: ${sanitizeText(inc.email)}` : ''}
        </div>
        <div class="signature-line">Signature of Incorporator</div>
        <div class="signature-line">Date (MM/DD/YYYY)</div>
      </div>`,
    );

  return `<div class="signature-block">${cards.join('')}</div>`;
};

const buildOptionalProvisionsBlock = (provisions: string[]): string => {
  if (!provisions?.length) {
    return '<p class="field-value">No optional provisions elected.</p>';
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
    '{{ohio_seal_src}}': ohioSealImage,
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
  const [generating, setGenerating] = useState(false);
  const [generatedFileUrl, setGeneratedFileUrl] = useState<string | null>(null);

  const buildBarcodePayload = useCallback((values: Partial<ArticlesFormValues> | undefined): { payload: string; humanReadable: string } => {
    const meta: BarcodeMeta = {
      ...DEFAULT_BARCODE_META,
      ...(values?.barcode ?? {}),
    };

    const filingDatePart = meta.filingDate ? meta.filingDate.format('YYYYMMDD') : '';
    const parts = [
      'OH',
      sanitizeText(meta.docTypeCode).toUpperCase(),
      filingDatePart,
      sanitizeText(meta.filingTime),
      sanitizeText(meta.submissionNumber),
      sanitizeText(meta.charterNumber),
      sanitizeText(meta.entityNumber),
    ].filter(Boolean);

    const payload = parts.join('|');
    const humanReadable = [
      `Type: ${sanitizeText(meta.docTypeCode).toUpperCase()}`,
      `Filed: ${meta.filingDate ? meta.filingDate.format('MM/DD/YYYY') : '—'} ${sanitizeText(meta.filingTime)}`,
      `Submission: ${sanitizeText(meta.submissionNumber)}`,
      `Charter: ${sanitizeText(meta.charterNumber)}`,
      `Entity: ${sanitizeText(meta.entityNumber)}`,
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
          ...DEFAULT_BARCODE_META,
          ...DEFAULT_FORM_VALUES.barcode,
          ...(currentFormValues.barcode ?? {}),
          ...(values?.barcode ?? {}),
        } as BarcodeMeta,
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
      container.style.backgroundColor = '#ffffff';
      container.style.color = '#111827';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      await doc.html(container, {
        callback: (docInstance) => {
          const filename = `${sanitizeText(form.getFieldValue('entityName')) || 'Articles-of-Incorporation'}.pdf`;
          docInstance.save(filename);
          document.body.removeChild(container);
        },
        margin: [24, 24, 24, 24],
        html2canvas: {
          backgroundColor: '#ffffff',
          scale: 0.8,
          useCORS: true,
        },
      });
    } catch (error) {
      console.error('Failed to export Articles to PDF:', error);
      message.error('Unable to export Articles to PDF.');
    }
  };

  const handleGenerateDocument = async () => {
    try {
      setGenerating(true);
      const currentValues = form.getFieldsValue(true) as ArticlesFormValues;
      const compiledHtml = syncHtmlWithForm(currentValues);
      const templateRecord = selectedTemplateId ? templates.find((tpl) => tpl.id === selectedTemplateId) : null;
      const templateKey = templateRecord?.template_key || 'articles_of_incorporation_oh';

      if (!compiledHtml || compiledHtml.trim().length < 20) {
        message.warning('Document content is empty. Please complete the form before generating.');
        return;
      }

      const { payload } = buildBarcodePayload(currentValues);
      if (!payload) {
        message.warning('Barcode metadata is incomplete. Please review the barcode tab.');
      }

      const result = await docsAPI.post('/documents/generate', {
        template_id: templateKey,
        template_key: templateKey,
        document_title: `${sanitizeText(currentValues.entityName)} Articles of Incorporation`,
        officer_name: sanitizeText(currentValues.entityName),
        role: sanitizeText(currentValues.entityType),
        data: currentValues,
        html_content: compiledHtml,
        executive_id: null,
        packet_id: null,
        signing_stage: null,
        signing_order: null,
      });

      if (result?.ok) {
        const url = result.file_url;
        setGeneratedFileUrl(url || null);
        message.success('Articles of Incorporation generated and stored successfully.');
        if (!url) {
          message.info('No storage URL returned. Check Supabase Storage for the generated file.');
        }
      } else {
        throw new Error(result?.error || 'Unknown error generating document.');
      }
    } catch (error: any) {
      console.error('Failed to generate Articles document:', error);
      message.error(error?.message || 'Failed to generate the Articles document.');
      setGeneratedFileUrl(null);
    } finally {
      setGenerating(false);
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
          <Button
            icon={<CloudUploadOutlined />}
            loading={generating}
            disabled={generating}
            onClick={handleGenerateDocument}
          >
            Generate & Save
          </Button>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadPdf}>
            Download PDF
          </Button>
        </Space>

        {generatedFileUrl && (
          <Alert
            type="success"
            showIcon
            message="Document Generated"
            description={
              <Space direction="vertical">
                <span>The Articles of Incorporation PDF has been generated and stored.</span>
                <Typography.Link href={generatedFileUrl} target="_blank" rel="noopener noreferrer" icon={<LinkOutlined />}>
                  View Generated Document
                </Typography.Link>
              </Space>
            }
          />
        )}

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

