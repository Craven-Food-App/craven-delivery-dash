// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Input, Modal, Form, Select, InputNumber, DatePicker, message, Popconfirm, Statistic, Card, Upload, Checkbox } from 'antd';
import {
  UserAddOutlined,
  DeleteOutlined,
  RiseOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';
import { POSITIONS, buildEmails } from '@/config/positions';
import { DEFAULT_EMPLOYEE_PACKET } from '@/config/hiringPacket';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department_id: string;
  department?: { name: string };
  employment_type: string;
  employment_status: string;
  salary: number;
  hire_date: string;
  employee_number: string;
  employee_equity?: Array<{ shares_percentage: number; equity_type: string }>;
}

interface Department {
  id: string;
  name: string;
  description: string;
}

export const PersonnelManager: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPromoteModalVisible, setIsPromoteModalVisible] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewValues, setPreviewValues] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchText, setSearchText] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [promoteForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [suggestedEmails, setSuggestedEmails] = useState<{named?:string; roleAlias?:string}>({});
  const [packetDocs, setPacketDocs] = useState<any[]>([]);
  const [packetForEmail, setPacketForEmail] = useState<string | null>(null);
  const [showDeferred, setShowDeferred] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (error) throw error;
      setDepartments(data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      message.error('Failed to load departments');
    }
  };

  // --- Document preview helpers ---
  const isExecutivePosition = (position?: string) => /chief|ceo|cfo|cto|coo|president|vp|vice president|executive/i.test(position || '');

  const buildOfferLetterHtml = (v: any) => {
    const salaryFormatted = v?.salary ? `$${Number(v.salary).toLocaleString()}/year` : 'Equity-only role';
    const equityLine = v?.equity ? `<li>Equity Stake: <strong>${v.equity}%</strong>${v?.equity_type ? ` (${(v.equity_type || '').toString().replace('_',' ')})` : ''}</li>` : '';
    const isCfo = /chief\s*financial\s*officer|\bcfo\b/i.test(v?.position || '');
    const cfoResp = isCfo ? `
      <div style="margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 16px;">Primary Responsibilities (CFO)</h3>
        <ul style="margin: 0; padding-left: 20px; color: #4a4a4a; font-size: 14px; line-height: 1.8;">
          <li>Financial strategy, capital planning, and KPI management.</li>
          <li>Budgeting, forecasting, FP&A, and board/investor reporting.</li>
          <li>Internal controls, audit readiness, and GAAP compliance.</li>
          <li>Treasury and cash flow management; runway/burn oversight.</li>
          <li>Fundraising support and investor relations.</li>
          <li>Leadership of finance, accounting, and procurement.</li>
        </ul>
      </div>
    ` : '';
    return `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2 style="margin-top:0;">Offer Letter - ${v.position}</h2>
        <p>Dear ${v.first_name} ${v.last_name},</p>
        <p>Craven Inc is pleased to extend an offer for the position of <strong>${v.position}</strong>.</p>
        <ul>
          <li>Department: ${v.department_name || 'Corporate'}</li>
          <li>Start Date: ${dayjs(v.hire_date || new Date()).format('MMM D, YYYY')}</li>
          <li>Compensation: ${salaryFormatted}</li>
          ${equityLine}
        </ul>
        ${cfoResp}
        <p>Reporting to: CEO - Torrence Stroman.</p>
        <p>Sincerely,<br/>Craven Inc HR</p>
      </div>
    `;
  };

  const buildEquityAgreementHtml = (v: any) => {
    if (!v?.equity) return '<div style="padding:24px;">No equity specified.</div>';
    const typeMap: Record<string,string> = { common_stock:'Common Stock', preferred_stock:'Preferred Stock', stock_options:'Stock Options', phantom_stock:'Phantom Stock' };
    const vestingMap: Record<string,string> = { immediate:'Immediate (100% vested)', '4_year_1_cliff':'4 years, 1-year cliff', '3_year_1_cliff':'3 years, 1-year cliff', '2_year_1_cliff':'2 years, 1-year cliff', custom:'Custom schedule' };
    return `
      <div style="font-family: Arial, sans-serif; padding: 24px;">
        <h2 style="margin-top:0;">Equity Offer Agreement</h2>
        <p>Company: Craven Inc (Ohio)</p>
        <ul>
          <li>Grantee: ${v.first_name} ${v.last_name} (${v.position})</li>
          <li>Ownership: <strong>${v.equity}%</strong></li>
          <li>Equity Type: ${typeMap[v.equity_type || 'common_stock'] || 'Common Stock'}</li>
          <li>Vesting: ${vestingMap[v.vesting_schedule || '4_year_1_cliff']}</li>
          ${v.equity_type === 'stock_options' ? `<li>Strike Price: $${Number(v.strike_price || 0).toFixed(2)}</li>` : ''}
        </ul>
        <p>Governing law: Ohio.</p>
      </div>
    `;
  };

  const buildBoardResolutionHtml = (v: any, resolutionNumber: string) => `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <h2 style="margin-top:0;">Board Resolution #${resolutionNumber}</h2>
      <p>Appointment of ${v.first_name} ${v.last_name} as ${v.position} effective ${dayjs(v.hire_date || new Date()).format('MMM D, YYYY')}.</p>
      ${v.equity ? `<p>Includes authorization to grant ${v.equity}% equity.</p>` : ''}
      <p>Status: Approved.</p>
    </div>
  `;

  const buildFoundersHtml = (v: any, resolutionNumber: string) => `
    <div style="font-family: Arial, sans-serif; padding: 24px;">
      <h2 style="margin-top:0;">Founders Equity Insurance Agreement</h2>
      <p>Founder: ${v.first_name} ${v.last_name} (CEO).</p>
      <p>Ownership protected: ${Number(v.equity || 0)}% (anti-dilution, board-supermajority exception).</p>
      <p>Resolution reference: #${resolutionNumber}</p>
    </div>
  `;

  const openPreview = async () => {
    try {
      const vals = await form.validateFields();
      const dept = departments.find(d => d.id === vals.department_id);
      const enriched = { ...vals, department_name: dept?.name };
      setPreviewValues(enriched);
      setIsPreviewVisible(true);
    } catch (e) {
      // validation error shown by antd
    }
  };

  const onPositionChange = () => {
    const v = form.getFieldsValue();
    const pos = POSITIONS.find(p => p.label === v.position || p.code === v.position || p.label === v?.position_label);
    if (pos) {
      const { named, roleAlias } = buildEmails(v.first_name || '', v.last_name || '', pos.code, 'cravenusa.com');
      setSuggestedEmails({ named, roleAlias: pos.isExecutive ? roleAlias : undefined });
    } else {
      setSuggestedEmails({});
    }
  };

  const issueEmails = async () => {
    try {
      const v = await form.validateFields();
      const pos = POSITIONS.find(p => p.label === v.position || p.code === v.position);
      if (!pos) {
        message.error('Select a position');
        return;
      }
      const res = await supabase.functions.invoke('msgraph-provision', {
        body: { firstName: v.first_name, lastName: v.last_name, positionCode: pos.code, domain: 'cravenusa.com' }
      });
      if ((res as any)?.data?.ok) {
        const s = (res as any).data.suggested;
        setSuggestedEmails(s);
        message.success('Provision request queued.');
      } else {
        message.success('Provision request sent.');
      }
    } catch (e) {
      // ignore
    }
  };

  const confirmSendAndHire = async () => {
    if (!previewValues) return;
    setIsSending(true);
    try {
      await handleHire(previewValues);
      setIsPreviewVisible(false);
    } finally {
      setIsSending(false);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          employee_equity(shares_percentage, shares_total, equity_type, vesting_schedule)
        `)
        .order('hire_date', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      message.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadPacketStatus = async (email: string) => {
    const { data: packets } = await supabase.from('hiring_packets').select('id').eq('employee_email', email).order('created_at', { ascending: false }).limit(1);
    if (packets && packets[0]) {
      setPacketForEmail(email);
      const { data: docs } = await supabase.from('hiring_packet_docs').select('*').eq('packet_id', packets[0].id).order('label');
      setPacketDocs(docs || []);
    } else {
      setPacketDocs([]);
      setPacketForEmail(null);
    }
  };

  const resendCommunications = async (emp: Employee) => {
    try {
      // New signature token
      const signatureToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      await supabase.from('executive_signatures').insert([{
        employee_email: emp.email,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        position: emp.position,
        document_type: 'offer_letter',
        token: signatureToken,
      }]);

      // Offer letter (best-effort with minimal data)
      await supabase.functions.invoke('send-executive-offer-letter', {
        body: {
          employeeEmail: emp.email,
          employeeName: `${emp.first_name} ${emp.last_name}`,
          position: emp.position,
          department: emp.department?.name || 'Corporate',
          salary: emp.salary || 0,
          startDate: emp.hire_date || new Date().toISOString(),
          reportingTo: 'CEO - Torrence Stroman',
          signatureToken,
        }
      });

      // Portal access email
      const portals: Array<'board'|'ceo'|'admin'> = /chief|ceo|cfo|cto|coo|president/i.test(emp.position) ? ['board'] : ['admin'];
      await supabase.functions.invoke('send-portal-access-email', {
        body: {
          email: emp.email,
          name: `${emp.first_name} ${emp.last_name}`,
          portals,
          tempPassword: Math.random().toString(36).slice(2,10) + 'A1!',
        }
      });

      // Hiring packet resend (use last known state via work_location lookup if loaded)
      await loadPacketStatus(emp.email);
      if (!packetForEmail) {
        // fall back to creating one for OH
        const docs = DEFAULT_EMPLOYEE_PACKET.states['OH'];
        await supabase.functions.invoke('send-hiring-packet', { body: { candidateEmail: emp.email, candidateName: `${emp.first_name} ${emp.last_name}`, state: 'OH', packetType: 'employee', docs } });
      }

      message.success('Resent offer, portal access, and hiring packet (if applicable).');
    } catch (e) {
      console.error(e);
      message.error('Failed to resend communications');
    }
  };

  const sendHiringPacketNow = async (emp: Employee) => {
    try {
      const stateCode = (emp as any).work_location?.match?.(/\b(OH|MI|FL|GA|NY|MO|KS|LA)\b/i)?.[1]?.toUpperCase() || 'OH';
      const docs = DEFAULT_EMPLOYEE_PACKET.states[stateCode as any] || DEFAULT_EMPLOYEE_PACKET.states['OH'] || [];
      await supabase.functions.invoke('send-hiring-packet', {
        body: {
          candidateEmail: emp.email,
          candidateName: `${emp.first_name} ${emp.last_name}`,
          state: stateCode,
          packetType: 'executive',
          docs,
        }
      });
      message.success('Hiring packet sent.');
    } catch (e) {
      console.error('Error sending hiring packet:', e);
      message.error('Failed to send hiring packet');
    }
  };

  const handleHire = async (values: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            position: values.position,
            department_id: values.department_id,
            employment_type: values.employment_type,
            salary: values.salary,
            hire_date: values.hire_date ? dayjs(values.hire_date).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
            work_location: values.work_location,
            salary_status: values.deferred_salary ? 'deferred' : 'active',
            funding_trigger: values.deferred_salary ? (values.funding_trigger || 500000) : null,
            deferred_salary_clause: !!values.deferred_salary,
            remote_allowed: values.remote_allowed || false,
            hired_by: user?.id,
          }
        ])
        .select();

      if (error) throw error;

      // Check if this is a C-suite position
      const isCLevel = /chief|ceo|cfo|cto|coo|president/i.test(values.position);

      // Save equity for any hire when provided (C-level or not)
      if ((values.equity && values.equity > 0) || (values.shares_total && values.shares_total > 0)) {
        const vestingSchedule = values.vesting_schedule || '4_year_1_cliff';
        const vestingJson = {
          type: vestingSchedule,
          duration_months: vestingSchedule === 'immediate' ? 0 : 
                          vestingSchedule === '2_year_1_cliff' ? 24 :
                          vestingSchedule === '3_year_1_cliff' ? 36 : 48,
          cliff_months: vestingSchedule === 'immediate' ? 0 : 12
        };

        // Normalize equity_type to match DB constraint ('stock','options','phantom')
        const equityTypeInput = (values.equity_type || '').toString().toLowerCase();
        const equityTypeMap: Record<string, 'stock' | 'options' | 'phantom'> = {
          'common_stock': 'stock',
          'preferred_stock': 'stock',
          'stock': 'stock',
          'stock_options': 'options',
          'options': 'options',
          'phantom_stock': 'phantom',
          'phantom': 'phantom',
        };
        const normalizedEquityType = equityTypeMap[equityTypeInput] || 'stock';

        await supabase.from('employee_equity').insert([{
          employee_id: data[0].id,
          shares_percentage: values.equity ? Number(values.equity) : null,
          shares_total: values.shares_total ? Number(values.shares_total) : null,
          equity_type: normalizedEquityType,
          vesting_schedule: vestingJson,
          strike_price: values.strike_price || null,
          authorized_by: user?.id,
        }]);
      }

      // Log to employee history
      if (data && data[0]) {
        await supabase.from('employee_history').insert([
          {
            employee_id: data[0].id,
            action_type: 'hired',
            new_position: values.position,
            new_salary: values.salary,
            new_department_id: values.department_id,
            effective_date: values.hire_date || new Date().toISOString(),
            performed_by: user?.id,
            notes: 'Initial hire',
          }
        ]);
      }

      // Get department info for offer letter
      const dept = departments.find(d => d.id === values.department_id);
      
      // Generate board resolution number
      const resolutionNumber = `BR${new Date().getFullYear()}${String(Math.floor(Math.random() * 9000) + 1000)}`;
      
      // Create board resolution record
      const boardResolution = {
        resolution_number: resolutionNumber,
        resolution_type: 'appointment',
        subject_position: values.position,
        subject_person_name: `${values.first_name} ${values.last_name}`,
        subject_person_email: values.email,
        resolution_title: `Appointment of ${values.first_name} ${values.last_name} as ${values.position}`,
        resolution_text: `Resolution to appoint ${values.first_name} ${values.last_name} to the position of ${values.position}`,
        effective_date: values.hire_date || new Date().toISOString(),
        board_members: [
          { name: 'Torrence Stroman', title: 'CEO', vote: 'for' },
          { name: 'Board Member 1', title: 'Independent Director', vote: 'for' },
          { name: 'Board Member 2', title: 'Independent Director', vote: 'for' }
        ],
        votes_for: 3,
        votes_against: 0,
        votes_abstain: 0,
        status: 'approved',
        required_documents: isCLevel ? 
          (values.position.toLowerCase().includes('ceo') ? 
            ['board_resolution', 'founders_equity_insurance_agreement', 'equity_offer_agreement', 'offer_letter'] :
            ['board_resolution', 'equity_offer_agreement', 'offer_letter']) :
          ['offer_letter'],
        created_by: user?.id,
        executed_by: user?.id,
        executed_at: new Date().toISOString()
      };

      await supabase.from('board_resolutions').insert([boardResolution]);

      // Prepare signature token
      const signatureToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      await supabase.from('executive_signatures').insert([
        {
          employee_email: values.email,
          employee_name: `${values.first_name} ${values.last_name}`,
          position: values.position,
          document_type: 'offer_letter',
          token: signatureToken,
        }
      ]);

      // Provision portal access based on role
      const posLower = (values.position || '').toLowerCase();
      const portals: Array<'board'|'ceo'|'admin'> = [];
      if (/chief|ceo|cfo|cto|coo|president/i.test(values.position || '')) {
        portals.push('board');
        // Record exec user
        const execRole = posLower.includes('ceo') ? 'ceo' : posLower.includes('cfo') ? 'cfo' : posLower.includes('cto') ? 'cto' : posLower.includes('coo') ? 'coo' : 'advisor';
        await supabase.from('exec_users').insert([{ user_id: null, role: execRole, access_level: 2, title: values.position, department: dept?.name || 'Executive', approved_at: new Date().toISOString() }]).select();
        if (posLower.includes('ceo')) {
          portals.push('ceo');
          // Grant CEO email access credentials
          await supabase.from('ceo_access_credentials').insert([{ user_email: values.email }]).select();
        }
        if (posLower.includes('cfo')) {
          portals.push('cfo');
        }
      } else {
        portals.push('admin');
      }

      // Send documents based on position requirements
      try {
        // Always send board resolution first
        await supabase.functions.invoke('send-board-resolution', {
          body: {
            employeeEmail: values.email,
            employeeName: `${values.first_name} ${values.last_name}`,
            position: values.position,
            resolutionNumber: resolutionNumber,
            resolutionType: 'appointment',
            effectiveDate: values.hire_date || new Date().toISOString(),
            companyName: 'Craven Inc',
            state: 'Ohio',
            boardMembers: boardResolution.board_members,
            equityPercentage: isCLevel && values.equity ? values.equity : undefined
          },
        });

        // Pre-acceptance notification: provisional emails
        try {
          const posDef = POSITIONS.find(p => p.code === (values.position || ''));
          if (posDef) {
            const emails = buildEmails(values.first_name, values.last_name, posDef.code, 'cravenusa.com');
            await supabase.functions.invoke('send-preaccept-email', {
              body: {
                candidateEmail: values.email,
                candidateName: `${values.first_name} ${values.last_name}`,
                namedEmail: emails.named,
                roleAlias: posDef.isExecutive ? emails.roleAlias : null,
                position: posDef.label
              }
            });
          }
        } catch (_) {}

        // Send offer letter
        await supabase.functions.invoke('send-executive-offer-letter', {
          body: {
            employeeEmail: values.email,
            employeeName: `${values.first_name} ${values.last_name}`,
            position: values.position,
            department: dept?.name || 'Corporate',
            salary: values.salary,
            equity: isCLevel && values.equity ? values.equity : undefined,
            startDate: values.hire_date || new Date().toISOString(),
            reportingTo: 'CEO - Torrence Stroman',
            signatureToken,
            deferredSalary: !!values.deferred_salary,
            fundingTrigger: values.funding_trigger || null,
          },
        });

        // Send equity agreement if C-suite
        if (isCLevel && values.equity && values.equity > 0) {
          await supabase.functions.invoke('send-equity-offer-agreement', {
            body: {
              employeeEmail: values.email,
              employeeName: `${values.first_name} ${values.last_name}`,
              position: values.position,
              equityPercentage: values.equity,
              equityType: values.equity_type || 'common_stock',
              vestingSchedule: values.vesting_schedule || '4_year_1_cliff',
              strikePrice: values.strike_price,
              startDate: values.hire_date || new Date().toISOString(),
              companyName: 'Craven Inc',
              state: 'Ohio'
            },
          });
        }

        // Send founders agreement if CEO
        if (values.position.toLowerCase().includes('ceo')) {
          await supabase.functions.invoke('send-founders-equity-insurance-agreement', {
            body: {
              employeeEmail: values.email,
              employeeName: `${values.first_name} ${values.last_name}`,
              position: values.position,
              equityPercentage: values.equity || 0,
              startDate: values.hire_date || new Date().toISOString(),
              companyName: 'Craven Inc',
              state: 'Ohio',
              resolutionNumber: resolutionNumber
            },
          });
        }

        const documentsSent = isCLevel ? 
          (values.position.toLowerCase().includes('ceo') ? 
            'Board Resolution, Offer Letter, Equity Agreement, and Founders Agreement' :
            'Board Resolution, Offer Letter, and Equity Agreement') :
          'Board Resolution and Offer Letter';

        // Send portal access email
        await supabase.functions.invoke('send-portal-access-email', {
          body: {
            email: values.email,
            name: `${values.first_name} ${values.last_name}`,
            portals,
            tempPassword: Math.random().toString(36).slice(2,10) + 'A1!',
          }
        });

        // Send Hiring Packet (state-specific)
        const stateCode = (values.work_location || '').match(/\b(OH|MI|FL|GA|NY|MO|KS|LA)\b/i)?.[1]?.toUpperCase() || 'OH';
        const docs = DEFAULT_EMPLOYEE_PACKET.states[stateCode as any] || [];
        await supabase.functions.invoke('send-hiring-packet', {
          body: {
            candidateEmail: values.email,
            candidateName: `${values.first_name} ${values.last_name}`,
            state: stateCode,
            packetType: 'employee',
            docs
          }
        });

        message.success(`🎉 ${values.first_name} ${values.last_name} hired successfully! ${documentsSent} sent. Portal access and hiring packet emailed.`);
      } catch (emailError) {
        console.error('Error sending documents:', emailError);
        message.success(`🎉 ${values.first_name} ${values.last_name} hired successfully! (Some documents failed to send)`);
      }

      setIsModalVisible(false);
      form.resetFields();
      fetchEmployees();

      // Post-acceptance provisioning (welcome email sent by function)
      try {
        const posDef = POSITIONS.find(p => p.code === (values.position || ''));
        await supabase.functions.invoke('msgraph-provision', {
          body: {
            firstName: values.first_name,
            lastName: values.last_name,
            positionCode: posDef?.code || values.position,
            domain: 'cravenusa.com',
            executive: !!posDef?.isExecutive,
            personalEmail: values.email
          }
        });
      } catch (e) {
        console.error('Provisioning failed', e);
      }
    } catch (error: any) {
      console.error('Error hiring employee:', error);
      message.error(error.message || 'Failed to hire employee');
    }
  };

  const handlePromote = async (values: any) => {
    if (!selectedEmployee) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('employees')
        .update({
          position: values.new_position,
          salary: values.new_salary,
          department_id: values.new_department_id || selectedEmployee.department_id,
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      // Log promotion
      await supabase.from('employee_history').insert([
        {
          employee_id: selectedEmployee.id,
          action_type: 'promoted',
          previous_position: selectedEmployee.position,
          new_position: values.new_position,
          previous_salary: selectedEmployee.salary,
          new_salary: values.new_salary,
          previous_department_id: selectedEmployee.department_id,
          new_department_id: values.new_department_id || selectedEmployee.department_id,
          effective_date: new Date().toISOString(),
          reason: values.reason,
          performed_by: user?.id,
        }
      ]);

      message.success(`✅ ${selectedEmployee.first_name} ${selectedEmployee.last_name} promoted successfully!`);
      setIsPromoteModalVisible(false);
      promoteForm.resetFields();
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error promoting employee:', error);
      message.error(error.message || 'Failed to promote employee');
    }
  };

  const handleEditEmployee = async (values: any) => {
    if (!selectedEmployee) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update basic fields
      const { error: empErr } = await supabase
        .from('employees')
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          position: values.position,
          department_id: values.department_id,
          employment_type: values.employment_type,
          salary: values.salary,
        })
        .eq('id', selectedEmployee.id);
      if (empErr) throw empErr;

      // Upsert equity if provided
      if (values.equity_percentage || values.shares_total || values.equity_type) {
        const equityTypeInput = (values.equity_type || '').toString().toLowerCase();
        const equityTypeMap: Record<string, 'stock' | 'options' | 'phantom'> = {
          'common_stock': 'stock',
          'preferred_stock': 'stock',
          'stock': 'stock',
          'stock_options': 'options',
          'options': 'options',
          'phantom_stock': 'phantom',
          'phantom': 'phantom',
        };
        const normalizedEquityType = equityTypeMap[equityTypeInput] || 'stock';
        const equityPayload: any = {
          employee_id: selectedEmployee.id,
          shares_percentage: values.equity_percentage != null ? Number(values.equity_percentage) : null,
          shares_total: values.shares_total != null ? Number(values.shares_total) : null,
          equity_type: normalizedEquityType,
          authorized_by: user?.id || null,
        };
        const { error: eqErr } = await supabase
          .from('employee_equity')
          .upsert(equityPayload, { onConflict: 'employee_id' });
        if (eqErr) throw eqErr;
      }

      message.success('Employee updated');
      setIsEditModalVisible(false);
      setSelectedEmployee(null);
      editForm.resetFields();
      fetchEmployees();
    } catch (error: any) {
      console.error('Error updating employee:', error);
      message.error(error.message || 'Failed to update employee');
    }
  };

  const handleTerminate = async (employee: Employee) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('employees')
        .update({
          employment_status: 'terminated',
          termination_date: new Date().toISOString(),
          terminated_by: user?.id,
        })
        .eq('id', employee.id);

      if (error) throw error;

      // Log termination
      await supabase.from('employee_history').insert([
        {
          employee_id: employee.id,
          action_type: 'terminated',
          effective_date: new Date().toISOString(),
          performed_by: user?.id,
        }
      ]);

      message.success(`${employee.first_name} ${employee.last_name} has been terminated`);
      fetchEmployees();
    } catch (error: any) {
      console.error('Error terminating employee:', error);
      message.error(error.message || 'Failed to terminate employee');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    searchText === '' || 
    emp.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
    emp.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchText.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Employee #',
      dataIndex: 'employee_number',
      key: 'employee_number',
      width: 120,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: Employee) => `${record.first_name} ${record.last_name}`,
      sorter: (a: Employee, b: Employee) => a.first_name.localeCompare(b.first_name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Department',
      key: 'department',
      render: (_: any, record: Employee) => record.department?.name || 'N/A',
      filters: departments.map(d => ({ text: d.name, value: d.id })),
      onFilter: (value: any, record: Employee) => record.department_id === value,
    },
    {
      title: 'Equity %',
      key: 'equity',
      render: (_: any, record: Employee) => {
        const equity = record.employee_equity?.[0];
        return equity ? `${equity.shares_percentage}%` : '-';
      },
      width: 100,
    },
    {
      title: 'Type',
      dataIndex: 'employment_type',
      key: 'employment_type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          'full-time': 'blue',
          'part-time': 'cyan',
          'contract': 'orange',
          'intern': 'purple',
        };
        return <Tag color={colors[type] || 'default'}>{type.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Salary',
      dataIndex: 'salary',
      key: 'salary',
      render: (salary: number) => salary ? `$${salary.toLocaleString()}` : 'N/A',
      sorter: (a: Employee, b: Employee) => (a.salary || 0) - (b.salary || 0),
    },
    {
      title: 'Hire Date',
      dataIndex: 'hire_date',
      key: 'hire_date',
      render: (date: string) => dayjs(date).format('MMM D, YYYY'),
      sorter: (a: Employee, b: Employee) => dayjs(a.hire_date).unix() - dayjs(b.hire_date).unix(),
    },
    {
      title: 'Status',
      dataIndex: 'employment_status',
      key: 'employment_status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          'on-leave': 'orange',
          suspended: 'red',
          terminated: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      },
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'On Leave', value: 'on-leave' },
        { text: 'Terminated', value: 'terminated' },
      ],
      onFilter: (value: any, record: Employee) => record.employment_status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Space size="small">
          {record.employment_status === 'active' && (
            <>
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setSelectedEmployee(record);
                  const eq: any = (record as any).employee_equity?.[0] || {};
                  editForm.setFieldsValue({
                    first_name: (record as any).first_name,
                    last_name: (record as any).last_name,
                    email: (record as any).email,
                    position: (record as any).position,
                    department_id: (record as any).department_id,
                    employment_type: (record as any).employment_type,
                    salary: (record as any).salary,
                    equity_percentage: eq.shares_percentage,
                    shares_total: eq.shares_total,
                    equity_type: eq.equity_type || 'stock',
                  });
                  setIsEditModalVisible(true);
                }}
              >
                Edit
              </Button>
              <Button 
                type="link" 
                icon={<RiseOutlined />} 
                size="small"
                onClick={() => {
                  setSelectedEmployee(record);
                  promoteForm.setFieldsValue({
                    current_position: record.position,
                    current_salary: record.salary,
                  });
                  setIsPromoteModalVisible(true);
                }}
              >
                Promote
              </Button>
              <Popconfirm
                title="Are you sure you want to terminate this employee?"
                description="This action cannot be undone easily."
                onConfirm={() => handleTerminate(record)}
                okText="Yes, Terminate"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button type="link" danger icon={<DeleteOutlined />} size="small">
                  Terminate
                </Button>
              </Popconfirm>
          <Button type="link" size="small" onClick={() => resendCommunications(record)}>
            Resend Offer/Emails
          </Button>
          <Button type="link" size="small" onClick={() => sendHiringPacketNow(record)}>
            Send Hiring Packet
          </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  const activeEmployees = employees.filter(e => e.employment_status === 'active');
  const totalPayroll = employees.reduce((sum, e) => sum + (e.salary || 0), 0);
  const recentHires = employees.filter(e => dayjs(e.hire_date).isAfter(dayjs().subtract(30, 'days')));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Personnel Management</h2>
          <p className="text-slate-600">Hire, manage, and monitor all employees</p>
        </div>
        <Space>
          <Search
            placeholder="Search personnel..."
            allowClear
            onSearch={setSearchText}
            style={{ width: 300 }}
          />
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="large"
            onClick={() => setIsModalVisible(true)}
          >
            Hire New Employee
          </Button>
        </Space>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <Statistic
            title="Total Employees"
            value={employees.length}
            prefix={<TeamOutlined />}
            valueStyle={{ color: '#3f8600' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Active Employees"
            value={activeEmployees.length}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Monthly Payroll"
            value={Math.round(totalPayroll / 12)}
            prefix={<DollarOutlined />}
            precision={0}
            valueStyle={{ color: '#cf1322' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Hired (30 days)"
            value={recentHires.length}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </div>

      <Table
        columns={columns}
        dataSource={filteredEmployees}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} employees` }}
        className="shadow-lg"
        scroll={{ x: 1200 }}
      />

      {/* Edit Employee Modal */}
      <Modal
        title={`✏️ Edit ${selectedEmployee ? `${(selectedEmployee as any).first_name} ${(selectedEmployee as any).last_name}` : 'Employee'}`}
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedEmployee(null);
          editForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form layout="vertical" form={editForm} onFinish={handleEditEmployee}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="First Name" name="first_name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Last Name" name="last_name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </div>

          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Position" name="position" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Department" name="department_id">
              <Select allowClear placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Employment Type" name="employment_type" initialValue="full-time">
              <Select>
                <Option value="full-time">Full-Time</Option>
                <Option value="part-time">Part-Time</Option>
                <Option value="contract">Contract</Option>
                <Option value="intern">Intern</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Annual Salary" name="salary">
              <InputNumber style={{ width: '100%' }} min={0} step={5000}
                formatter={v => `$ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={v => v!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label="Equity %" name="equity_percentage">
              <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.25} precision={2} />
            </Form.Item>
            <Form.Item label="Shares Total" name="shares_total">
              <InputNumber style={{ width: '100%' }} min={0} step={1000} />
            </Form.Item>
            <Form.Item label="Equity Type" name="equity_type" initialValue="stock">
              <Select>
                <Option value="stock">Stock</Option>
                <Option value="options">Options</Option>
                <Option value="phantom">Phantom</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsEditModalVisible(false);
                setSelectedEmployee(null);
                editForm.resetFields();
              }}>Cancel</Button>
              <Button type="primary" htmlType="submit">Save Changes</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Hire Modal */}
      <Modal
        title="🎯 Hire New Employee"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form layout="vertical" form={form} onFinish={handleHire}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="First Name"
              name="first_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="John" />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="last_name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input placeholder="Smith" />
            </Form.Item>
          </div>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
          >
            <Input placeholder="employee@craven.com" />
          </Form.Item>

          <Form.Item label="Phone" name="phone">
            <Input placeholder="(555) 123-4567" />
          </Form.Item>

          <Form.Item
            label="Position"
            name="position"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select placeholder="Select position" onChange={onPositionChange} onSelect={onPositionChange} onBlur={onPositionChange} showSearch>
              {POSITIONS.map(p => (
                <Option key={p.code} value={p.code}>{p.label}</Option>
              ))}
            </Select>
          </Form.Item>

          {suggestedEmails?.named && (
            <div className="p-3 rounded-md border bg-slate-50 mb-2">
              <div className="text-sm text-slate-600 mb-1">Suggested emails for this hire:</div>
              <div className="font-mono text-sm">{suggestedEmails.named}</div>
              {suggestedEmails.roleAlias && <div className="font-mono text-sm">{suggestedEmails.roleAlias}</div>}
              <div className="mt-2">
                <Button size="small" onClick={issueEmails}>Issue Emails</Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Department"
              name="department_id"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Select placeholder="Select department">
                {departments.map(dept => (
                  <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Employment Type"
              name="employment_type"
              rules={[{ required: true, message: 'Required' }]}
              initialValue="full-time"
            >
              <Select>
                <Option value="full-time">Full-Time</Option>
                <Option value="part-time">Part-Time</Option>
                <Option value="contract">Contract</Option>
                <Option value="intern">Intern</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Annual Salary"
              name="salary"
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const executiveDept = departments.find(d => d.name === 'Executive');
                    const deptId = getFieldValue('department_id');
                    const isExecutive = executiveDept && deptId === executiveDept.id;
                    if (isExecutive) {
                      // Executive department: salary optional
                      return Promise.resolve();
                    }
                    // Non-executive: require a numeric salary > 0
                    if (value === undefined || value === null || value === '' || Number(value) <= 0) {
                      return Promise.reject(new Error('Required for non-executive roles'));
                    }
                    return Promise.resolve();
                  }
                })
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                min={0}
                max={1000000}
                step={5000}
                placeholder="Leave blank for equity-only compensation"
              />
            </Form.Item>

            <Form.Item
              label="Hire Date"
              name="hire_date"
              initialValue={dayjs()}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="deferred_salary" valuePropName="checked" label=" ">
              <Checkbox onChange={(e)=> setShowDeferred(e.target.checked)}>Defer Salary Until Funding?</Checkbox>
            </Form.Item>
            {showDeferred && (
              <Form.Item
                label="Funding Trigger (USD)"
                name="funding_trigger"
                initialValue={500000}
                rules={[{ required: true, message: 'Funding trigger required when deferring salary' }]}
              >
                <InputNumber min={0} step={5000} style={{ width: '100%' }} />
              </Form.Item>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Equity Stake (%)"
              name="equity"
              tooltip="For C-suite positions only (CEO, CFO, CTO, COO, President)"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={100}
                precision={2}
                step={0.5}
                placeholder="e.g., 10.50 for 10.5%"
              />
            </Form.Item>

            <Form.Item
              label="Equity Type"
              name="equity_type"
              tooltip="Type of equity being granted"
            >
              <Select placeholder="Select equity type">
                <Option value="common_stock">Common Stock</Option>
                <Option value="preferred_stock">Preferred Stock</Option>
                <Option value="stock_options">Stock Options</Option>
                <Option value="phantom_stock">Phantom Stock</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            label="Shares Total"
            name="shares_total"
            tooltip="Total number of shares granted (optional)"
          >
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Vesting Schedule"
              name="vesting_schedule"
              tooltip="How the equity vests over time"
            >
              <Select placeholder="Select vesting schedule">
                <Option value="immediate">Immediate (100% vested)</Option>
                <Option value="4_year_1_cliff">4 years, 1 year cliff</Option>
                <Option value="3_year_1_cliff">3 years, 1 year cliff</Option>
                <Option value="2_year_1_cliff">2 years, 1 year cliff</Option>
                <Option value="custom">Custom Schedule</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Strike Price (if options)"
              name="strike_price"
              tooltip="Exercise price for stock options"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="e.g., 0.01 for $0.01"
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
          </div>

          <Form.Item label="Work Location" name="work_location">
            <Input placeholder="e.g., HQ - Los Angeles, Remote" />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button onClick={openPreview} size="large">
                👀 Preview Documents
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                🎉 Hire Employee (Skip Preview)
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        title="📄 Review Documents"
        open={isPreviewVisible}
        onCancel={() => setIsPreviewVisible(false)}
        width={900}
        footer={null}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Live-edit fields */}
          <div className="md:col-span-1 space-y-3">
            <div className="text-slate-700 font-semibold">Edit fields</div>
            <Input
              placeholder="Position"
              value={previewValues?.position}
              onChange={e => setPreviewValues((p:any) => ({...p, position: e.target.value}))}
            />
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Equity %"
              value={previewValues?.equity}
              min={0}
              max={100}
              step={0.5}
              onChange={(v) => setPreviewValues((p:any) => ({...p, equity: v}))}
            />
            <Select
              value={previewValues?.equity_type || 'common_stock'}
              onChange={(v) => setPreviewValues((p:any) => ({...p, equity_type: v}))}
            >
              <Option value="common_stock">Common Stock</Option>
              <Option value="preferred_stock">Preferred Stock</Option>
              <Option value="stock_options">Stock Options</Option>
              <Option value="phantom_stock">Phantom Stock</Option>
            </Select>
            <Select
              value={previewValues?.vesting_schedule || '4_year_1_cliff'}
              onChange={(v) => setPreviewValues((p:any) => ({...p, vesting_schedule: v}))}
            >
              <Option value="immediate">Immediate (100% vested)</Option>
              <Option value="4_year_1_cliff">4 years, 1 year cliff</Option>
              <Option value="3_year_1_cliff">3 years, 1 year cliff</Option>
              <Option value="2_year_1_cliff">2 years, 1 year cliff</Option>
              <Option value="custom">Custom</Option>
            </Select>
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Strike Price (if options)"
              value={previewValues?.strike_price}
              min={0}
              step={0.01}
              onChange={(v) => setPreviewValues((p:any) => ({...p, strike_price: v}))}
            />
          </div>

          {/* Previews */}
          <div className="md:col-span-2 space-y-6">
            <div className="border rounded-md overflow-hidden">
              <div className="px-3 py-2 text-sm font-semibold bg-slate-50 border-b">Board Resolution</div>
              <div className="p-4 max-h-80 overflow-auto" dangerouslySetInnerHTML={{ __html: buildBoardResolutionHtml(previewValues || {}, 'PREVIEW') }} />
            </div>
            <div className="border rounded-md overflow-hidden">
              <div className="px-3 py-2 text-sm font-semibold bg-slate-50 border-b">Offer Letter</div>
              <div className="p-4 max-h-80 overflow-auto" dangerouslySetInnerHTML={{ __html: buildOfferLetterHtml(previewValues || {}) }} />
            </div>
            {isExecutivePosition(previewValues?.position) && (previewValues?.equity > 0) && (
              <div className="border rounded-md overflow-hidden">
                <div className="px-3 py-2 text-sm font-semibold bg-slate-50 border-b">Equity Offer Agreement</div>
                <div className="p-4 max-h-80 overflow-auto" dangerouslySetInnerHTML={{ __html: buildEquityAgreementHtml(previewValues || {}) }} />
              </div>
            )}
            {(previewValues?.position || '').toLowerCase().includes('ceo') && (
              <div className="border rounded-md overflow-hidden">
                <div className="px-3 py-2 text-sm font-semibold bg-slate-50 border-b">Founders Equity Insurance Agreement</div>
                <div className="p-4 max-h-80 overflow-auto" dangerouslySetInnerHTML={{ __html: buildFoundersHtml(previewValues || {}, 'PREVIEW') }} />
              </div>
            )}
          </div>
        </div>

        <Space className="w-full justify-end">
          <Button onClick={() => setIsPreviewVisible(false)}>Back</Button>
          <Button type="primary" loading={isSending} onClick={confirmSendAndHire}>
            Send Documents & Hire
          </Button>
        </Space>
      </Modal>

      {/* Hiring Packet Status */}
      <div className="mt-6 mb-6">
        <div className="flex items-center justify-between">
          <div style={{ fontWeight: 700, fontSize: 18 }}>Hiring Packet Status</div>
          <Space>
            <Input.Search placeholder="Lookup by email" onSearch={loadPacketStatus} allowClear style={{ width: 320 }} />
          </Space>
        </div>
        {packetForEmail && (
          <div className="text-sm text-slate-600 mt-1">Showing: {packetForEmail}</div>
        )}
        <Table
          className="mt-3"
          dataSource={packetDocs.map(d => ({ key: d.id, ...d }))}
          pagination={false}
          columns={[
            { title: 'Document', dataIndex: 'label' },
            { title: 'Required', dataIndex: 'required', render: (v)=> v? 'Yes':'No', width: 90 },
            { title: 'Status', dataIndex: 'status', width: 120 },
            { title: 'File', dataIndex: 'file_url', render: (v)=> v? <a href={v} target="_blank">View</a> : '-' },
            { title: 'Actions', key:'actions', render: (_:any, rec:any) => (
              <Space>
                <Upload
                  beforeUpload={() => false}
                  maxCount={1}
                  onChange={async ({ file }) => {
                    // @ts-ignore
                    if (!file || file.originFileObj == null) return;
                    // @ts-ignore
                    const blob = file.originFileObj;
                    const filename = `${rec.id}_${Date.now()}_${file.name}`;
                    const { data, error } = await supabase.storage.from('hiring-packets').upload(filename, blob);
                    if (!error && data) {
                      const { data: pub } = supabase.storage.from('hiring-packets').getPublicUrl(data.path);
                      await supabase.functions.invoke('mark-packet-doc', { body: { docId: rec.id, status: 'uploaded', fileUrl: pub.publicUrl } });
                      if (packetForEmail) loadPacketStatus(packetForEmail);
                      message.success('Uploaded');
                    }
                  }}
                >
                  <Button size="small">Upload Signed</Button>
                </Upload>
              </Space>
            ) }
          ]}
        />
      </div>

      {/* Promote Modal */}
      <Modal
        title={`⬆️ Promote ${selectedEmployee ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}` : 'Employee'}`}
        open={isPromoteModalVisible}
        onCancel={() => {
          setIsPromoteModalVisible(false);
          setSelectedEmployee(null);
          promoteForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form layout="vertical" form={promoteForm} onFinish={handlePromote}>
          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-slate-600 mb-2">Current Position:</div>
            <div className="font-semibold">{selectedEmployee?.position}</div>
            <div className="text-sm text-slate-600 mt-2 mb-2">Current Salary:</div>
            <div className="font-semibold">${selectedEmployee?.salary?.toLocaleString()}</div>
          </div>

          <Form.Item
            label="New Position"
            name="new_position"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input placeholder="e.g., Senior Operations Director" />
          </Form.Item>

          <Form.Item
            label="New Salary"
            name="new_salary"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/\$\s?|(,*)/g, '')}
              min={(selectedEmployee?.salary || 0) + 5000}
              step={5000}
            />
          </Form.Item>

          <Form.Item label="Transfer to Department" name="new_department_id">
            <Select placeholder="Keep current department" allowClear>
              {departments.map(dept => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Reason for Promotion"
            name="reason"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Input.TextArea rows={3} placeholder="Excellent performance, leadership skills, etc." />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsPromoteModalVisible(false);
                setSelectedEmployee(null);
                promoteForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large">
                ✅ Confirm Promotion
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
