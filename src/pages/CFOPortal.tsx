// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Layout, Typography, Row, Col, Statistic, Tabs, Table, DatePicker, Space, Button, Divider, Alert, Modal, InputNumber, Form, message, Select } from "antd";
import {
  DollarOutlined,
  BarChartOutlined,
  BankOutlined,
  FundOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from "recharts";
import { MessageCenter } from "@/components/messaging/MessageCenter";

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

function BigNavButton({ color, hover, title, subtitle, onClick }: { color: string; hover: string; title: string; subtitle: string; onClick: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <button
      onClick={onClick}
      style={{
        background: color,
        color: '#fff',
        borderRadius: 12,
        padding: isMobile ? '12px 14px' : '16px 18px',
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
      }}
      onMouseOver={(e)=> (e.currentTarget.style.background = hover)}
      onMouseOut={(e)=> (e.currentTarget.style.background = color)}
    >
      <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 700, lineHeight: 1.2 }}>{title}</div>
      <div style={{ opacity: 0.9, fontSize: isMobile ? 12 : 14 }}>{subtitle}</div>
    </button>
  );
}

export default function CFOPortal() {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<any>([]);
  const [metrics, setMetrics] = useState<any>({ revenue: 0, expenses: 0, grossMargin: 0, cash: 0, burn: 0, runway: 0 });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Check screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Minimal placeholders; wire real finance queries here
      const { data: orders } = await supabase.from("orders").select("total_amount, created_at").limit(200);
      const revenue = (orders || []).reduce((s, o) => s + (o.total_amount || 0), 0);
      const expenses = Math.round(revenue * 0.65);
      const burn = Math.round(expenses / 12);
      const cash = Math.round(revenue * 0.35);
      const runway = burn > 0 ? Math.floor(cash / burn) : 0;
      setMetrics({ revenue, expenses, grossMargin: Math.max(0, revenue - expenses), cash, burn, runway });

      setPayouts([]);
      setTransactions(orders || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: isMobile ? '12px 12px' : '12px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? 8 : 0 }}>
          <Typography.Title level={3} style={{ color: '#0f172a', margin: 0, fontSize: isMobile ? 18 : 24 }}>CFO Portal</Typography.Title>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small" style={{ width: isMobile ? '100%' : 'auto' }}>
            <RangePicker onChange={setRange} size={isMobile ? 'small' : 'default'} style={{ width: isMobile ? '100%' : 'auto' }} />
            <Button onClick={fetchData} size={isMobile ? 'small' : 'default'}>Refresh</Button>
            <Button onClick={() => {
              const host = window.location.hostname;
              if (/^cfo\./i.test(host)) {
                const target = host.replace(/^cfo\./i, 'board.');
                window.location.href = `${window.location.protocol}//${target}`;
              } else {
                navigate('/board');
              }
            }} size={isMobile ? 'small' : 'default'}>Board Portal</Button>
            <Button onClick={() => {
              const host = window.location.hostname;
              if (/^cfo\./i.test(host)) {
                const target = host.replace(/^cfo\./i, 'admin.');
                window.location.href = `${window.location.protocol}//${target}`;
              } else {
                navigate('/admin');
              }
            }} size={isMobile ? 'small' : 'default'}>Admin Portal</Button>
            <Button onClick={() => {
              const host = window.location.hostname;
              if (/^cfo\./i.test(host)) {
                const target = host.replace(/^cfo\./i, 'ceo.');
                window.location.href = `${window.location.protocol}//${target}`;
              } else {
                navigate('/');
              }
            }} size={isMobile ? 'small' : 'default'}>CEO Command Center</Button>
          </Space>
        </div>
      </Header>
      <Content style={{ padding: isMobile ? 12 : 24 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <Alert
            type="success"
            showIcon
            message={
              <div className="flex items-center gap-2">
                <CheckCircleOutlined /> Finance systems operational
              </div>
            }
            style={{ marginBottom: 16, background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.25)" }}
          />

          {/* Key Finance Metrics - Responsive */}
          <Row gutter={isMobile ? [8, 8] : [16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={12} lg={4} style={{ paddingLeft: isMobile ? 4 : 0, paddingRight: isMobile ? 4 : 0 }}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: isMobile ? "6px 8px" : "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 14 }}>Revenue</span>}
                  value={metrics.revenue}
                  prefix={<DollarOutlined style={{ fontSize: isMobile ? 12 : 16 }} />}
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 20 }}
                />
              </div>
            </Col>
            <Col xs={12} sm={12} lg={4} style={{ paddingLeft: isMobile ? 4 : 0, paddingRight: isMobile ? 4 : 0 }}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: isMobile ? "6px 8px" : "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 14 }}>Expenses</span>}
                  value={metrics.expenses}
                  prefix={<BankOutlined style={{ fontSize: isMobile ? 12 : 16 }} />}
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 20 }}
                />
              </div>
            </Col>
            <Col xs={12} sm={12} lg={4} style={{ paddingLeft: isMobile ? 4 : 0, paddingRight: isMobile ? 4 : 0 }}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: isMobile ? "6px 8px" : "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 14 }}>Gross Margin</span>}
                  value={metrics.grossMargin}
                  prefix={<FundOutlined style={{ fontSize: isMobile ? 12 : 16 }} />}
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 20 }}
                />
              </div>
            </Col>
            <Col xs={12} sm={12} lg={4} style={{ paddingLeft: isMobile ? 4 : 0, paddingRight: isMobile ? 4 : 0 }}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: isMobile ? "6px 8px" : "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 14 }}>Cash</span>}
                  value={metrics.cash}
                  prefix="$"
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 20 }}
                />
              </div>
            </Col>
            <Col xs={12} sm={12} lg={4} style={{ paddingLeft: isMobile ? 4 : 0, paddingRight: isMobile ? 4 : 0 }}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: isMobile ? "6px 8px" : "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 14 }}>Burn</span>}
                  value={metrics.burn}
                  prefix="$"
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 20 }}
                />
              </div>
            </Col>
            <Col xs={12} sm={12} lg={4} style={{ paddingLeft: isMobile ? 4 : 0, paddingRight: isMobile ? 4 : 0 }}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: isMobile ? "6px 8px" : "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 14 }}>Runway</span>}
                  value={metrics.runway}
                  suffix="months"
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 20 }}
                />
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: "rgba(148,163,184,0.2)" }} />

          {/* High-Priority Quick Access - Responsive Grid */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(1, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap:12, marginBottom: 16 }}>
            <BigNavButton color="#2563eb" hover="#1d4ed8" title="Manager Console" subtitle="Team & KPIs" onClick={()=> setActiveTab('manager')} />
            <BigNavButton color="#16a34a" hover="#15803d" title="Accounts Payable" subtitle="Invoices & Runs" onClick={()=> setActiveTab('ap')} />
            <BigNavButton color="#f97316" hover="#ea580c" title="Accounts Receivable" subtitle="Aging & Collections" onClick={()=> setActiveTab('ar')} />
            <BigNavButton color="#dc2626" hover="#b91c1c" title="Approvals" subtitle="Spend Reviews" onClick={()=> setActiveTab('approvals')} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(1, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap:12, marginBottom: 16 }}>
            <BigNavButton color="#0ea5e9" hover="#0284c7" title="Forecast" subtitle="Cash Flow" onClick={()=> setActiveTab('forecast')} />
            <BigNavButton color="#7c3aed" hover="#6d28d9" title="Budget vs Actuals" subtitle="Variance" onClick={()=> setActiveTab('bva')} />
            <BigNavButton color="#9333ea" hover="#7e22ce" title="Close" subtitle="Checklist & Recs" onClick={()=> setActiveTab('close')} />
            <BigNavButton color="#0891b2" hover="#0e7490" title="Treasury" subtitle="Bank Balances" onClick={()=> setActiveTab('treasury')} />
          </div>

          <Tabs
            activeKey={['overview','transactions','payouts','messages'].includes(activeTab) ? activeTab : 'overview'}
            onChange={setActiveTab}
            size={isMobile ? 'small' : 'large'}
            tabBarStyle={{ borderBottom: "1px solid rgba(148,163,184,0.2)" }}
          >
            <TabPane
              tab={
                <span>
                  <BarChartOutlined /> Overview
                </span>
              }
              key="overview"
            >
              <Typography.Paragraph style={{ color: "#cbd5e1" }}>
                High-level KPIs and trends will be displayed here.
              </Typography.Paragraph>
            </TabPane>
            {/* High-priority sections moved to button navigation; keep tabs minimal */}
            <TabPane
              tab={
                <span>
                  <FileSearchOutlined /> Transactions
                </span>
              }
              key="transactions"
            >
              <div className="overflow-hidden">
                <Table
                  loading={loading}
                  dataSource={transactions}
                  rowKey={(r) => r.id || r.created_at}
                  size={isMobile ? 'small' : 'default'}
                  scroll={{ x: isMobile ? 600 : 'auto' }}
                  pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
                  columns={[
                    { title: "Date", dataIndex: "created_at", render: (v) => new Date(v).toLocaleString(), width: 200 },
                    { title: "Amount", dataIndex: "total_amount", render: (v) => `$${(v || 0).toLocaleString()}` },
                  ]}
                />
              </div>
            </TabPane>
            <TabPane
              tab={
                <span>
                  <BankOutlined /> Payouts
                </span>
              }
              key="payouts"
            >
              <div className="overflow-hidden">
                <Table
                  loading={loading}
                  dataSource={payouts}
                  rowKey={(r) => r.id}
                  size={isMobile ? 'small' : 'default'}
                  scroll={{ x: isMobile ? 600 : 'auto' }}
                  pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
                  columns={[
                    { title: "Payout ID", dataIndex: "id" },
                    { title: "Amount", dataIndex: "amount", render: (v) => `$${(v || 0).toLocaleString()}` },
                    { title: "Status", dataIndex: "status" },
                    { title: "Created", dataIndex: "created_at", render: (v) => new Date(v).toLocaleString() },
                  ]}
                />
              </div>
            </TabPane>
            <TabPane tab={<span>Message Center</span>} key="messages">
              <MessageCenter />
            </TabPane>
          </Tabs>
          {/* Render selected high-priority section below when chosen via buttons */}
          {activeTab === 'manager' && <ManagerConsole />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'ap' && <AccountsPayable />}
          {activeTab === 'ar' && <AccountsReceivable />}
          {activeTab === 'close' && <CloseManagement />}
          {activeTab === 'treasury' && <TreasuryView />}
          {activeTab === 'approvals' && <ApprovalsPanel />}
          {activeTab === 'forecast' && <CashFlowForecast />}
          {activeTab === 'bva' && <BudgetVsActuals />}
        </div>
      </Content>
    </Layout>
  );
}

function ManagerConsole() {
  const [metrics, setMetrics] = useState<any>({ apPending:0, apOverdue:0, arPastDue:0, closeOpen:0, recsOpen:0 });
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleModal, setRoleModal] = useState(false);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inv, rec, tasks, recon, fr] = await Promise.all([
          supabase.from('invoices').select('id, amount, due_date, status'),
          supabase.from('receivables').select('id, amount, due_date, status'),
          supabase.from('close_tasks').select('id, status'),
          supabase.from('reconciliations').select('id, status'),
          supabase.from('finance_roles').select('user_id, role, user_label')
        ]);
        const now = Date.now();
        const apPending = (inv.data || []).filter(i=> i.status==='pending' || i.status==='approved').length;
        const apOverdue = (inv.data || []).filter(i=> new Date(i.due_date).getTime() < now && i.status!=='paid').length;
        const arPastDueAmt = (rec.data || [])
          .filter(r=> new Date(r.due_date).getTime() < now && r.status!=='paid')
          .reduce((s,r)=> s + (r.amount || 0), 0);
        const closeOpen = (tasks.data || []).filter(t=> t.status!=='done').length;
        const recsOpen = (recon.data || []).filter(r=> r.status!=='tied').length;
        setMetrics({ apPending, apOverdue, arPastDue: arPastDueAmt, closeOpen, recsOpen });
        setRoles((fr.data || []).map((r:any, idx:number)=> ({ key: `${r.user_id}-${r.role}-${idx}`, ...r })));
      } finally { setLoading(false); }
    })();
    
    // Check screen size
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <div>
      {(metrics.apOverdue > 0 || metrics.arPastDue > 0 || metrics.closeOpen > 5) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            <div>
              {metrics.apOverdue > 0 && <div>AP overdue invoices: <strong>{metrics.apOverdue}</strong></div>}
              {metrics.arPastDue > 0 && <div>AR past due: <strong>$ {metrics.arPastDue.toLocaleString()}</strong></div>}
              {metrics.closeOpen > 5 && <div>Close tasks open: <strong>{metrics.closeOpen}</strong></div>}
            </div>
          }
        />
      )}
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        <Col xs={12} sm={12} lg={6}><div style={{ background:'#f8fafc', padding: isMobile ? 12 : 16, borderRadius:8 }}><div style={{ color:'#64748b', fontSize: isMobile ? 12 : 14 }}>AP Queue (pending/approved)</div><div style={{ fontWeight:700, fontSize: isMobile ? 18 : 20 }}>{metrics.apPending}</div></div></Col>
        <Col xs={12} sm={12} lg={6}><div style={{ background:'#fff7ed', padding: isMobile ? 12 : 16, borderRadius:8 }}><div style={{ color:'#9a3412', fontSize: isMobile ? 12 : 14 }}>AP Overdue</div><div style={{ fontWeight:700, fontSize: isMobile ? 18 : 20 }}>{metrics.apOverdue}</div></div></Col>
        <Col xs={12} sm={12} lg={6}><div style={{ background:'#fff1f2', padding: isMobile ? 12 : 16, borderRadius:8 }}><div style={{ color:'#9f1239', fontSize: isMobile ? 12 : 14 }}>AR Past Due $</div><div style={{ fontWeight:700, fontSize: isMobile ? 18 : 20 }}>$ {metrics.arPastDue.toLocaleString()}</div></div></Col>
        <Col xs={12} sm={12} lg={6}><div style={{ background:'#eef2ff', padding: isMobile ? 12 : 16, borderRadius:8 }}><div style={{ color:'#3730a3', fontSize: isMobile ? 12 : 14 }}>Close Tasks Open</div><div style={{ fontWeight:700, fontSize: isMobile ? 18 : 20 }}>{metrics.closeOpen}</div></div></Col>
      </Row>
      <Typography.Title level={5}>Team Workload</Typography.Title>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        {['CFO','Controller','AP','AR','Treasury','Auditor'].map((r) => {
          const count = roles.filter(x => x.role === r).length;
          return (
            <Col key={r} xs={12} md={8} lg={4}><div style={{ background:'#f1f5f9', padding: isMobile ? 10 : 12, borderRadius:8 }}><div style={{ color:'#475569', fontSize: isMobile ? 12 : 14 }}>{r}</div><div style={{ fontWeight:700, fontSize: isMobile ? 14 : 16 }}>{count} member(s)</div></div></Col>
          );
        })}
      </Row>
      <Divider>Team Roles</Divider>
      <Space style={{ marginBottom: 8 }}>
        <Button onClick={() => setRoleModal(true)} size={isMobile ? 'small' : 'default'}>Assign Role</Button>
      </Space>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={roles}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 600 : 'auto' }}
          columns={[
            { title: 'User', dataIndex: 'user_label' },
            { title: 'User ID', dataIndex: 'user_id' },
            { title: 'Role', dataIndex: 'role' },
          ]}
        />
      </div>
      <Modal
        title="Assign Finance Role"
        open={roleModal}
        width={isMobile ? '90%' : 600}
        onCancel={() => setRoleModal(false)}
        onOk={async () => {
          const vals = await form.validateFields();
          setLoading(true);
          try {
            const { error } = await supabase.from('finance_roles').insert({ user_id: vals.user_id, user_label: vals.user_label, role: vals.role });
            if (error) throw error;
            const { data } = await supabase.from('finance_roles').select('user_id, role, user_label');
            setRoles((data || []).map((r:any, idx:number)=> ({ key: `${r.user_id}-${r.role}-${idx}`, ...r })));
            setRoleModal(false);
            form.resetFields();
            message.success('Role assigned');
          } finally { setLoading(false); }
        }}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="user_label" label="User (name or email)" rules={[{ required: true }]}>
            <input className="ant-input" />
          </Form.Item>
          <Form.Item name="user_id" label="User ID (optional)" tooltip="If known; otherwise leave blank">
            <input className="ant-input" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={[{value:'CFO',label:'CFO'},{value:'Controller',label:'Controller'},{value:'AP',label:'AP'},{value:'AR',label:'AR'},{value:'Treasury',label:'Treasury'},{value:'Auditor',label:'Auditor'}]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function RoleManagement() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('finance_roles').select('user_id, user_label, role').order('user_label', { ascending: true });
        setRoles((data || []).map((r:any, idx:number)=> ({ key: `${r.user_id}-${r.role}-${idx}`, ...r })));
      } finally { setLoading(false); }
    })();
  }, []);
  return (
    <div>
      <Typography.Title level={5}>Invite User & Assign Role</Typography.Title>
      <Form
        layout="inline"
        form={form}
        onFinish={async (vals) => {
          setLoading(true);
          try {
            const { error } = await supabase.from('finance_roles').insert({ user_id: vals.user_id || crypto.randomUUID(), user_label: vals.user_label, role: vals.role });
            if (error) throw error;
            const { data } = await supabase.from('finance_roles').select('user_id, user_label, role').order('user_label', { ascending: true });
            setRoles((data || []).map((r:any, idx:number)=> ({ key: `${r.user_id}-${r.role}-${idx}`, ...r })));
            form.resetFields();
            message.success('Role assigned');
          } finally { setLoading(false); }
        }}
      >
        <Form.Item name="user_label" rules={[{ required: true }]}>
          <input className="ant-input" placeholder="User email or name" />
        </Form.Item>
        <Form.Item name="user_id">
          <input className="ant-input" placeholder="User ID (optional)" />
        </Form.Item>
        <Form.Item name="role" rules={[{ required: true }]}>
          <Select style={{ minWidth: 180 }} options={[{value:'CFO',label:'CFO'},{value:'Controller',label:'Controller'},{value:'AP',label:'AP'},{value:'AR',label:'AR'},{value:'Treasury',label:'Treasury'},{value:'Auditor',label:'Auditor'}]} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">Assign</Button>
        </Form.Item>
      </Form>

      <Divider />
      <Table
        loading={loading}
        dataSource={roles}
        columns={[
          { title: 'User', dataIndex: 'user_label' },
          { title: 'User ID', dataIndex: 'user_id' },
          { title: 'Role', dataIndex: 'role' },
        ]}
      />
    </div>
  );
}
function BudgetVsActuals() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [{ data: budgets, error: bErr }, { data: orders, error: oErr }] = await Promise.all([
          supabase.from('budgets').select('id, period, dept, amount').order('period', { ascending: true }),
          supabase.from('orders').select('total_amount, created_at').gte('created_at', new Date(Date.now() - 365*24*60*60*1000).toISOString())
        ]);
        if (bErr) {
          setRows([]);
          return;
        }
        const actualsByPeriod: Record<string, number> = (orders || []).reduce((m: Record<string, number>, o: any) => {
          const period = new Date(o.created_at).toISOString().slice(0,7); // YYYY-MM
          m[period] = (m[period] || 0) + (o.total_amount || 0);
          return m;
        }, {});
        const grouped = (budgets || []).map((b: any) => {
          const actual = actualsByPeriod[b.period] || 0;
          const variance = actual - (b.amount || 0);
          const variancePct = b.amount ? (variance / b.amount) * 100 : 0;
          return { key: b.id, ...b, actual, variance, variancePct };
        });
        setRows(grouped);
        // Aggregate by period for chart
        const byPeriod: Record<string, { budget: number; actual: number }> = {};
        for (const r of grouped) {
          byPeriod[r.period] = byPeriod[r.period] || { budget: 0, actual: 0 };
          byPeriod[r.period].budget += r.amount || 0;
          byPeriod[r.period].actual += r.actual || 0;
        }
        const chart = Object.keys(byPeriod).sort().map((p) => ({ period: p, ...byPeriod[p] }));
        setChartData(chart);
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <ChartContainer config={{ budget: { label: 'Budget', color: '#94a3b8' }, actual: { label: 'Actual', color: '#2563eb' } }}>
          <BarChart data={chartData} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v)=>`$${v.toLocaleString()}`} width={72} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="budget" fill="var(--color-budget)" />
            <Bar dataKey="actual" fill="var(--color-actual)" />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={rows}
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 800 : 'auto' }}
          columns={[
            { title: 'Period', dataIndex: 'period' },
            { title: 'Dept', dataIndex: 'dept' },
            { title: 'Budget', dataIndex: 'amount', render: (v: number) => `$${(v||0).toLocaleString()}` },
            { title: 'Actual', dataIndex: 'actual', render: (v: number) => `$${(v||0).toLocaleString()}` },
            { title: 'Variance', dataIndex: 'variance', render: (v: number) => {
                const color = v >= 0 ? '#16a34a' : '#dc2626';
                const prefix = v >= 0 ? '+' : '-';
                return <span style={{ color }}>{prefix}$${Math.abs(v).toLocaleString()}</span>;
              } },
            { title: 'Variance %', dataIndex: 'variancePct', render: (v: number) => `${(v||0).toFixed(1)}%` },
          ]}
        />
      </div>
    </div>
  );
}

function CashFlowForecast() {
  const [series, setSeries] = useState<Array<{ period: string, cash: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, created_at')
          .gte('created_at', new Date(Date.now() - 180*24*60*60*1000).toISOString());
        const revenueByMonth: Record<string, number> = (orders || []).reduce((m: Record<string, number>, o: any) => {
          const key = new Date(o.created_at).toISOString().slice(0,7);
          m[key] = (m[key] || 0) + (o.total_amount || 0);
          return m;
        }, {});
        // Simple expense model: 65% of revenue
        const months = 6;
        const now = new Date();
        const forecast: Array<{ period: string, cash: number }> = [];
        let cash = 0;
        for (let i = -3; i < months; i++) {
          const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
          const period = d.toISOString().slice(0,7);
          const revenue = revenueByMonth[period] || (i >= 0 ? (revenueByMonth[Object.keys(revenueByMonth).slice(-1)[0]] || 0) : 0);
          const expenses = Math.round(revenue * 0.65);
          cash += Math.max(0, revenue - expenses);
          forecast.push({ period, cash });
        }
        setSeries(forecast);
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <div>
      <Typography.Paragraph style={{ color: '#334155' }}>Projected cumulative cash over time based on recent revenue and estimated expenses.</Typography.Paragraph>
      <div style={{ height: 320, marginBottom: 16 }}>
        <ChartContainer config={{ cash: { label: 'Cash', color: '#16a34a' } }}>
          <LineChart data={series} margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v)=>`$${v.toLocaleString()}`} width={72} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line type="monotone" dataKey="cash" stroke="var(--color-cash)" strokeWidth={2} dot={false} />
          </LineChart>
        </ChartContainer>
      </div>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={series.map((s) => ({ key: s.period, ...s }))}
          pagination={false}
          size={isMobile ? 'small' : 'default'}
          columns={[
            { title: 'Period', dataIndex: 'period' },
            { title: 'Projected Cash', dataIndex: 'cash', render: (v: number) => `$${(v||0).toLocaleString()}` },
          ]}
        />
      </div>
    </div>
  );
}

function ApprovalsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('ceo_financial_approvals')
          .select('id, requester, description, amount, status, created_at')
          .eq('status', status)
          .order('created_at', { ascending: false });
        setRows((data || []).map((d: any) => ({ key: d.id, ...d })));
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [status]);
  return (
    <div>
      <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ marginBottom: 12, width: isMobile ? '100%' : 'auto' }}>
        <Typography.Text>Filter:</Typography.Text>
        <Button type={status==='pending'? 'primary':'default'} onClick={() => setStatus('pending')} block={isMobile}>Pending</Button>
        <Button type={status==='approved'? 'primary':'default'} onClick={() => setStatus('approved')} block={isMobile}>Approved</Button>
        <Button type={status==='rejected'? 'primary':'default'} onClick={() => setStatus('rejected')} block={isMobile}>Rejected</Button>
      </Space>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={rows}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 800 : 'auto' }}
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 90 },
            { title: 'Requester', dataIndex: 'requester' },
            { title: 'Description', dataIndex: 'description' },
            { title: 'Amount', dataIndex: 'amount', render: (v: number) => `$${(v||0).toLocaleString()}` },
            { title: 'Status', dataIndex: 'status' },
            { title: 'Created', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString(), width: 180 },
          ]}
        />
      </div>
    </div>
  );
}

function AccountsPayable() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [creatingRun, setCreatingRun] = useState(false);
  const [runDate, setRunDate] = useState<Date>(new Date());
  const [linking, setLinking] = useState(false);
  const [runs, setRuns] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [selectedRun, setSelectedRun] = useState<string | undefined>(undefined);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [inv, pr] = await Promise.all([
          supabase
          .from('invoices')
          .select('id, vendor, invoice_number, amount, due_date, status, invoice_date')
          .eq('status', status)
          .order('due_date', { ascending: true }),
          supabase
            .from('payment_runs')
            .select('id, scheduled_date, status, total_amount, processed_at')
            .order('scheduled_date', { ascending: false })
        ]);
        setInvoices((inv.data || []).map((d: any) => ({ key: d.id, ...d })));
        setRuns((pr.data || []).map((r: any) => ({ key: r.id, ...r })));
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [status]);
  return (
    <div>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={12}>
          <Typography.Text strong>AP Aging (by Due Date)</Typography.Text>
          <div style={{ height: 220, background:'#fff' }}>
            <ChartContainer config={{ current:{label:'Current', color:'#94a3b8'}, b30:{label:'0-30', color:'#22c55e'}, b60:{label:'31-60', color:'#eab308'}, b90:{label:'61-90', color:'#f97316'}, b90p:{label:'90+', color:'#ef4444'} }}>
              <BarChart data={[(() => {
                const now = Date.now();
                const buckets = { current:0, b30:0, b60:0, b90:0, b90p:0 } as any;
                invoices.forEach(i => {
                  const days = Math.floor((new Date(i.due_date).getTime() - now)/86400000);
                  const amt = i.amount || 0;
                  if (days >= 0) buckets.current += amt; else if (days >= -30) buckets.b30 += amt; else if (days >= -60) buckets.b60 += amt; else if (days >= -90) buckets.b90 += amt; else buckets.b90p += amt;
                });
                return { name:'Aging', ...buckets };
              })()]}
              margin={{ left: 12, right: 12, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis tickFormatter={(v)=>`$${v.toLocaleString()}`} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="current" fill="var(--color-current)" />
                <Bar dataKey="b30" fill="var(--color-b30)" />
                <Bar dataKey="b60" fill="var(--color-b60)" />
                <Bar dataKey="b90" fill="var(--color-b90)" />
                <Bar dataKey="b90p" fill="var(--color-b90p)" />
              </BarChart>
            </ChartContainer>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Typography.Text strong>Upcoming Cash Needs (Approved/Pending)</Typography.Text>
          <div style={{ height: 220, background:'#fff' }}>
            <ChartContainer config={{ pending:{label:'Pending', color:'#60a5fa'}, approved:{label:'Approved', color:'#34d399'} }}>
              <LineChart data={[1,2,3,4,5,6].map(m => {
                const d = new Date(); d.setMonth(d.getMonth()+m-1); const ym = d.toISOString().slice(0,7);
                const sum = (state:string) => invoices.filter(i=> (i.status===state) && new Date(i.due_date).toISOString().slice(0,7)===ym).reduce((s,i)=> s+(i.amount||0),0);
                return { period: ym, pending: sum('pending'), approved: sum('approved') };
              })} margin={{ left:12, right:12, top:8, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v)=>`$${v.toLocaleString()}`} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="pending" stroke="var(--color-pending)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="approved" stroke="var(--color-approved)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </Col>
      </Row>
      <Space style={{ marginBottom: 12 }}>
        <Typography.Text>Status:</Typography.Text>
        <Button type={status==='pending'? 'primary':'default'} onClick={() => setStatus('pending')}>Pending</Button>
        <Button type={status==='approved'? 'primary':'default'} onClick={() => setStatus('approved')}>Approved</Button>
        <Button type={status==='paid'? 'primary':'default'} onClick={() => setStatus('paid')}>Paid</Button>
        <Divider type="vertical" />
        <Button onClick={async () => {
          setCreatingRun(true);
        }}>Create Payment Run</Button>
        <Button onClick={() => setLinking(true)} disabled={!selectedInvoices.length}>Link to Run</Button>
        <Button onClick={async () => {
          // Approve all pending invoices (demo flow)
          setLoading(true);
          try {
            const pendingIds = invoices.filter((i) => i.status === 'pending').map((i) => i.key);
            if (pendingIds.length) {
              const { error } = await supabase.from('invoices').update({ status: 'approved' }).in('id', pendingIds);
              if (error) throw error;
              message.success('Approved pending invoices');
              const { data } = await supabase
                .from('invoices')
                .select('id, vendor, invoice_number, amount, due_date, status, invoice_date')
                .eq('status', status)
                .order('due_date', { ascending: true });
              setInvoices((data || []).map((d: any) => ({ key: d.id, ...d })));
            } else {
              message.info('No pending invoices');
            }
          } finally {
            setLoading(false);
          }
        }}>Approve Pending</Button>
      </Space>
      <Modal
        title="Create Payment Run"
        open={creatingRun}
        onCancel={() => setCreatingRun(false)}
        width={isMobile ? '90%' : 600}
        onOk={async () => {
          setLoading(true);
          try {
            const dueBefore = runDate;
            const selected = invoices.filter((i) => new Date(i.due_date) <= dueBefore && (i.status === 'approved' || i.status === 'pending'));
            const total = selected.reduce((s, i) => s + (i.amount || 0), 0);
            const { error } = await supabase.from('payment_runs').insert({ scheduled_date: dueBefore.toISOString().slice(0,10), status: 'draft', total_amount: total });
            if (error) throw error;
            message.success(`Payment run created for $${total.toLocaleString()}`);
            setCreatingRun(false);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>Select due date cutoff</Typography.Text>
          <DatePicker onChange={(d)=> setRunDate(d ? d.toDate() : new Date())} style={{ width: '100%' }} />
          <Typography.Text type="secondary">Includes invoices with due date on or before selected date.</Typography.Text>
        </Space>
      </Modal>
      <Modal
        title="Link Invoices to Payment Run"
        open={linking}
        onCancel={() => setLinking(false)}
        width={isMobile ? '90%' : 600}
        onOk={async () => {
          if (!selectedRun || !selectedInvoices.length) { message.info('Select a run and invoices'); return; }
          setLoading(true);
          try {
            const ids = selectedInvoices.map(i=> i.key);
            const { error } = await supabase.from('invoices').update({ payment_run_id: selectedRun }).in('id', ids);
            if (error) throw error;
            message.success('Invoices linked to run');
            setLinking(false);
            const { data } = await supabase
              .from('invoices')
              .select('id, vendor, invoice_number, amount, due_date, status, invoice_date')
              .eq('status', status)
              .order('due_date', { ascending: true });
            setInvoices((data || []).map((d: any) => ({ key: d.id, ...d })));
          } finally {
            setLoading(false);
          }
        }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text>Select Payment Run</Typography.Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Select run"
            value={selectedRun}
            onChange={setSelectedRun}
            options={runs.map(r => ({ label: `${r.scheduled_date} • ${r.status} • $${(r.total_amount||0).toLocaleString()}`, value: r.id }))}
          />
          <Typography.Text type="secondary">Link selected invoices to the chosen run.</Typography.Text>
        </Space>
      </Modal>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={invoices}
          rowSelection={{ selectedRowKeys: selectedInvoices.map(s=>s.key), onChange: (_keys, sel)=> setSelectedInvoices(sel as any[]) }}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 800 : 'auto' }}
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          columns={[
            { title: 'Vendor', dataIndex: 'vendor' },
            { title: 'Invoice #', dataIndex: 'invoice_number' },
            { title: 'Invoice Date', dataIndex: 'invoice_date', render: (v: string) => new Date(v).toLocaleDateString() },
            { title: 'Due', dataIndex: 'due_date', render: (v: string) => new Date(v).toLocaleDateString() },
            { title: 'Amount', dataIndex: 'amount', render: (v: number) => `$${(v||0).toLocaleString()}` },
            { title: 'Status', dataIndex: 'status' },
          ]}
        />
      </div>
      <Divider />
      <Typography.Title level={5}>Payment Runs</Typography.Title>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={runs}
          rowKey={(r)=> r.id}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 800 : 'auto' }}
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          columns={[
            { title: 'Scheduled', dataIndex: 'scheduled_date', width: 140 },
            { title: 'Status', dataIndex: 'status', width: 120 },
            { title: 'Total', dataIndex: 'total_amount', render: (v:number)=> `$${(v||0).toLocaleString()}`, width: 140 },
            { title: 'Processed', dataIndex: 'processed_at', render: (v:string)=> v ? new Date(v).toLocaleString() : '-', width: 180 },
            { title: 'Actions', key: 'actions', render: (_:any, rec:any) => (
              <Space>
                <Button size="small" onClick={async () => {
                  // mark run processed and mark linked invoices as paid
                  setLoading(true);
                  try {
                    const { error: e1 } = await supabase.from('payment_runs').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', rec.id);
                    if (e1) throw e1;
                    const { error: e2 } = await supabase.from('invoices').update({ status: 'paid' }).eq('payment_run_id', rec.id);
                    if (e2) throw e2;
                    message.success('Run processed');
                    const [inv, pr] = await Promise.all([
                      supabase
                        .from('invoices')
                        .select('id, vendor, invoice_number, amount, due_date, status, invoice_date')
                        .eq('status', status)
                        .order('due_date', { ascending: true }),
                      supabase
                        .from('payment_runs')
                        .select('id, scheduled_date, status, total_amount, processed_at')
                        .order('scheduled_date', { ascending: false })
                    ]);
                    setInvoices((inv.data || []).map((d: any) => ({ key: d.id, ...d })));
                    setRuns((pr.data || []).map((r: any) => ({ key: r.id, ...r })));
                  } finally {
                    setLoading(false);
                  }
                }}>Process Run</Button>
              </Space>
            )},
          ]}
        />
      </div>
    </div>
  );
}

function AccountsReceivable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('receivables')
          .select('id, customer, reference, amount, due_date, status, issue_date')
          .order('due_date', { ascending: true });
        const list = (data || []).map((r: any) => {
          const daysPast = Math.max(0, Math.floor((Date.now() - new Date(r.due_date).getTime()) / 86400000));
          const bucket = daysPast === 0 ? 'Current' : daysPast <= 30 ? '0-30' : daysPast <= 60 ? '31-60' : daysPast <= 90 ? '61-90' : '90+';
          return { key: r.id, ...r, daysPast, bucket };
        });
        setRows(list);
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <div>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={12}>
          <Typography.Text strong>AR Aging Buckets</Typography.Text>
          <div style={{ height: 220, background:'#fff' }}>
            <ChartContainer config={{ current:{label:'Current', color:'#94a3b8'}, b30:{label:'0-30', color:'#22c55e'}, b60:{label:'31-60', color:'#eab308'}, b90:{label:'61-90', color:'#f97316'}, b90p:{label:'90+', color:'#ef4444'} }}>
              <BarChart data={[(() => {
                const buckets = { current:0, b30:0, b60:0, b90:0, b90p:0 } as any;
                rows.forEach(r => {
                  const amt = r.amount || 0;
                  if (r.bucket==='Current') buckets.current += amt; else if (r.bucket==='0-30') buckets.b30 += amt; else if (r.bucket==='31-60') buckets.b60 += amt; else if (r.bucket==='61-90') buckets.b90 += amt; else buckets.b90p += amt;
                });
                return { name:'Aging', ...buckets };
              })()]}
              margin={{ left:12, right:12, top:8, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis tickFormatter={(v)=>`$${v.toLocaleString()}`} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="current" fill="var(--color-current)" />
                <Bar dataKey="b30" fill="var(--color-b30)" />
                <Bar dataKey="b60" fill="var(--color-b60)" />
                <Bar dataKey="b90" fill="var(--color-b90)" />
                <Bar dataKey="b90p" fill="var(--color-b90p)" />
              </BarChart>
            </ChartContainer>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <Typography.Text strong>Collections Trend (last 6 months)</Typography.Text>
          <div style={{ height: 220, background:'#fff' }}>
            <ChartContainer config={{ collected:{label:'Collected', color:'#16a34a'} }}>
              <LineChart data={[...Array(6)].map((_,i) => {
                const d = new Date(); d.setMonth(d.getMonth()- (5-i));
                const ym = d.toISOString().slice(0,7);
                // naive proxy: consider receivables with status paid in that month
                const collected = rows.filter(r=> r.status==='paid' && new Date(r.due_date).toISOString().slice(0,7)===ym).reduce((s,r)=> s+(r.amount||0),0);
                return { period: ym, collected };
              })} margin={{ left:12, right:12, top:8, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v)=>`$${v.toLocaleString()}`} width={72} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="collected" stroke="var(--color-collected)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
        </Col>
      </Row>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={async () => {
          if (!selected.length) { message.info('Select at least one receivable'); return; }
          setLoading(true);
          try {
            const inserts = selected.map((r) => ({ receivable_id: r.key, action: 'email_1', notes: 'Automated dunning email 1' }));
            const { error } = await supabase.from('dunning_events').insert(inserts);
            if (error) throw error;
            message.success('Dunning events logged');
          } finally {
            setLoading(false);
          }
        }}>Log Dunning (Email 1)</Button>
        <Button onClick={() => {
          // CSV export of current grid
          const headers = ['Customer','Reference','Issue Date','Due Date','Days Past Due','Bucket','Amount','Status'];
          const lines = rows.map(r => [r.customer, r.reference, new Date(r.issue_date).toISOString().slice(0,10), new Date(r.due_date).toISOString().slice(0,10), r.daysPast, r.bucket, r.amount, r.status]);
          const csv = [headers, ...lines].map((arr) => arr.map((v) => `"${(v??'').toString().replace(/"/g,'""')}"`).join(',')).join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ar_aging_${new Date().toISOString().slice(0,10)}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }}>Export CSV</Button>
      </Space>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        {['Current','0-30','31-60','61-90','90+'].map((b) => {
          const sum = rows.filter(r => r.bucket === b).reduce((s, r) => s + (r.amount || 0), 0);
          return (
            <Col key={b} xs={12} md={6} lg={4}><div style={{ background:'#f1f5f9', padding:12, borderRadius:8 }}><div style={{ color:'#64748b' }}>{b}</div><div style={{ fontWeight:700 }}>$ {sum.toLocaleString()}</div></div></Col>
          );
        })}
      </Row>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={rows}
          rowSelection={{ selectedRowKeys: selected.map(s=>s.key), onChange: (_keys, selRows)=> setSelected(selRows as any[]) }}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 1000 : 'auto' }}
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          columns={[
            { title: 'Customer', dataIndex: 'customer' },
            { title: 'Ref', dataIndex: 'reference' },
            { title: 'Issue Date', dataIndex: 'issue_date', render: (v: string) => new Date(v).toLocaleDateString() },
            { title: 'Due', dataIndex: 'due_date', render: (v: string) => new Date(v).toLocaleDateString() },
            { title: 'Days Past Due', dataIndex: 'daysPast' },
            { title: 'Bucket', dataIndex: 'bucket' },
            { title: 'Amount', dataIndex: 'amount', render: (v: number) => `$${(v||0).toLocaleString()}` },
            { title: 'Status', dataIndex: 'status' },
          ]}
        />
      </div>
    </div>
  );
}

function CloseManagement() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, r] = await Promise.all([
          supabase.from('close_tasks').select('id, period, name, owner, status, due_day').order('due_day', { ascending: true }),
          supabase.from('reconciliations').select('id, period, type, status, notes').order('type', { ascending: true }),
        ]);
        setTasks((t.data || []).map((x: any) => ({ key: x.id, ...x })));
        setRecs((r.data || []).map((x: any) => ({ key: x.id, ...x })));
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <Row gutter={[16,16]}>
      <Col xs={24} lg={14}>
        <Typography.Title level={5}>Close Checklist</Typography.Title>
        <Space style={{ marginBottom: 8 }}>
          <Button onClick={async () => {
            setRolling(true);
            try {
              const now = new Date();
              const currentPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0,7);
              const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth()-1, 1)).toISOString().slice(0,7);
              // Pull previous tasks and clone to current
              const { data: prevTasks } = await supabase.from('close_tasks').select('*').eq('period', prev);
              if (prevTasks && prevTasks.length) {
                const inserts = prevTasks.map((t: any) => ({ period: currentPeriod, name: t.name, owner: t.owner, status: 'todo', due_day: t.due_day }));
                await supabase.from('close_tasks').insert(inserts);
                message.success('Rolled close tasks forward');
                const t = await supabase.from('close_tasks').select('id, period, name, owner, status, due_day').order('due_day', { ascending: true });
                setTasks((t.data || []).map((x: any) => ({ key: x.id, ...x })));
              } else {
                message.info('No previous tasks to roll');
              }
            } finally {
              setRolling(false);
            }
          }}>Roll Previous Month</Button>
        </Space>
        <div className="overflow-hidden">
          <Table
            loading={loading}
            dataSource={tasks}
            pagination={false}
            size={isMobile ? 'small' : 'default'}
            scroll={{ x: isMobile ? 600 : 'auto' }}
            columns={[
              { title: 'Period', dataIndex: 'period', width: 110 },
              { title: 'Task', dataIndex: 'name' },
              { title: 'Owner', dataIndex: 'owner', width: 140 },
              { title: 'Due (Day)', dataIndex: 'due_day', width: 100 },
              { title: 'Status', dataIndex: 'status', width: 120 },
            ]}
          />
        </div>
      </Col>
      <Col xs={24} lg={10}>
        <Typography.Title level={5}>Reconciliations</Typography.Title>
        <div className="overflow-hidden">
          <Table
            loading={loading}
            dataSource={recs}
            pagination={false}
            size={isMobile ? 'small' : 'default'}
            scroll={{ x: isMobile ? 600 : 'auto' }}
            columns={[
              { title: 'Period', dataIndex: 'period', width: 110 },
              { title: 'Type', dataIndex: 'type', width: 140 },
              { title: 'Status', dataIndex: 'status', width: 120 },
              { title: 'Notes', dataIndex: 'notes' },
            ]}
          />
        </div>
      </Col>
    </Row>
  );
}

function TreasuryView() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editAcc, setEditAcc] = useState<any | null>(null);
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from('bank_accounts').select('id, name, institution, currency, current_balance, updated_at');
        setAccounts((data || []).map((x: any) => ({ key: x.id, ...x })));
      } finally {
        setLoading(false);
      }
    })();
    
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const total = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  return (
    <div>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={8}><div style={{ background:'#ecfeff', padding: isMobile ? 12 : 16, borderRadius:8 }}><div style={{ color:'#0891b2', fontSize: isMobile ? 12 : 14 }}>Total Cash</div><div style={{ fontWeight:700, fontSize: isMobile ? 16 : 18 }}>$ {total.toLocaleString()}</div></div></Col>
      </Row>
      <div className="overflow-hidden">
        <Table
          loading={loading}
          dataSource={accounts}
          size={isMobile ? 'small' : 'default'}
          scroll={{ x: isMobile ? 800 : 'auto' }}
          pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
          columns={[
            { title: 'Account', dataIndex: 'name' },
            { title: 'Institution', dataIndex: 'institution' },
            { title: 'Currency', dataIndex: 'currency', width: 100 },
            { title: 'Current Balance', dataIndex: 'current_balance', render: (v: number) => `$${(v||0).toLocaleString()}` },
            { title: 'Updated', dataIndex: 'updated_at', render: (v: string) => new Date(v).toLocaleString(), width: 180 },
            { title: 'Actions', key: 'actions', render: (_: any, rec: any) => <Button size="small" onClick={() => { setEditAcc(rec); form.setFieldsValue({ current_balance: rec.current_balance }); }}>Update</Button> },
          ]}
        />
      </div>
      <Modal
        title={`Update Balance - ${editAcc?.name || ''}`}
        open={!!editAcc}
        width={isMobile ? '90%' : 600}
        onCancel={() => setEditAcc(null)}
        onOk={async () => {
          const vals = await form.validateFields();
          setLoading(true);
          try {
            const { error } = await supabase.from('bank_accounts').update({ current_balance: vals.current_balance, updated_at: new Date().toISOString() }).eq('id', editAcc.id);
            if (error) throw error;
            message.success('Balance updated');
            const { data } = await supabase.from('bank_accounts').select('id, name, institution, currency, current_balance, updated_at');
            setAccounts((data || []).map((x: any) => ({ key: x.id, ...x })));
            setEditAcc(null);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Current Balance" name="current_balance" rules={[{ required: true, message: 'Enter balance' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={100} formatter={(v)=> String(v)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
