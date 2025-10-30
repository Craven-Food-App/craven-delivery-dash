// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Layout, Typography, Row, Col, Statistic, Tabs, Table, DatePicker, Space, Button, Divider, Alert } from "antd";
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

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export default function CFOPortal() {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<any>([]);
  const [metrics, setMetrics] = useState<any>({ revenue: 0, expenses: 0, grossMargin: 0, cash: 0, burn: 0, runway: 0 });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
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
      <Header style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography.Title level={3} style={{ color: '#0f172a', margin: 0 }}>CFO Portal</Typography.Title>
          <Space>
            <RangePicker onChange={setRange} />
            <Button onClick={fetchData}>Refresh</Button>
            <Button onClick={() => {
              const host = window.location.hostname;
              if (/^cfo\./i.test(host)) {
                const target = host.replace(/^cfo\./i, 'board.');
                window.location.href = `${window.location.protocol}//${target}`;
              } else {
                navigate('/board');
              }
            }}>Board Portal</Button>
            <Button onClick={() => {
              const host = window.location.hostname;
              if (/^cfo\./i.test(host)) {
                const target = host.replace(/^cfo\./i, 'admin.');
                window.location.href = `${window.location.protocol}//${target}`;
              } else {
                navigate('/admin');
              }
            }}>Admin Portal</Button>
            <Button onClick={() => {
              const host = window.location.hostname;
              if (/^cfo\./i.test(host)) {
                const target = host.replace(/^cfo\./i, 'ceo.');
                window.location.href = `${window.location.protocol}//${target}`;
              } else {
                navigate('/');
              }
            }}>CEO Command Center</Button>
          </Space>
        </div>
      </Header>
      <Content style={{ padding: 24 }}>
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

          {/* Key Finance Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} lg={4}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8" }}>Revenue</span>}
                  value={metrics.revenue}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: "#fff", fontWeight: 700 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8" }}>Expenses</span>}
                  value={metrics.expenses}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: "#fff", fontWeight: 700 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8" }}>Gross Margin</span>}
                  value={metrics.grossMargin}
                  prefix={<FundOutlined />}
                  valueStyle={{ color: "#fff", fontWeight: 700 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8" }}>Cash</span>}
                  value={metrics.cash}
                  prefix="$"
                  valueStyle={{ color: "#fff", fontWeight: 700 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8" }}>Burn</span>}
                  value={metrics.burn}
                  prefix="$"
                  valueStyle={{ color: "#fff", fontWeight: 700 }}
                />
              </div>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "12px 16px" }}>
                <Statistic
                  title={<span style={{ color: "#94a3b8" }}>Runway</span>}
                  value={metrics.runway}
                  suffix="months"
                  valueStyle={{ color: "#fff", fontWeight: 700 }}
                />
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: "rgba(148,163,184,0.2)" }} />

          <Tabs
            defaultActiveKey="overview"
            size="large"
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
            <TabPane tab={<span>Budget vs Actuals</span>} key="bva">
              <BudgetVsActuals />
            </TabPane>
            <TabPane tab={<span>Cash Flow Forecast</span>} key="forecast">
              <CashFlowForecast />
            </TabPane>
            <TabPane tab={<span>Approvals</span>} key="approvals">
              <ApprovalsPanel />
            </TabPane>
            <TabPane tab={<span>Accounts Payable</span>} key="ap">
              <AccountsPayable />
            </TabPane>
            <TabPane tab={<span>Accounts Receivable</span>} key="ar">
              <AccountsReceivable />
            </TabPane>
            <TabPane tab={<span>Close</span>} key="close">
              <CloseManagement />
            </TabPane>
            <TabPane tab={<span>Treasury</span>} key="treasury">
              <TreasuryView />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <FileSearchOutlined /> Transactions
                </span>
              }
              key="transactions"
            >
              <Table
                loading={loading}
                dataSource={transactions}
                rowKey={(r) => r.id || r.created_at}
                columns={[
                  { title: "Date", dataIndex: "created_at", render: (v) => new Date(v).toLocaleString(), width: 200 },
                  { title: "Amount", dataIndex: "total_amount", render: (v) => `$${(v || 0).toLocaleString()}` },
                ]}
              />
            </TabPane>
            <TabPane
              tab={
                <span>
                  <BankOutlined /> Payouts
                </span>
              }
              key="payouts"
            >
              <Table
                loading={loading}
                dataSource={payouts}
                rowKey={(r) => r.id}
                columns={[
                  { title: "Payout ID", dataIndex: "id" },
                  { title: "Amount", dataIndex: "amount", render: (v) => `$${(v || 0).toLocaleString()}` },
                  { title: "Status", dataIndex: "status" },
                  { title: "Created", dataIndex: "created_at", render: (v) => new Date(v).toLocaleString() },
                ]}
              />
            </TabPane>
          </Tabs>
        </div>
      </Content>
    </Layout>
  );
}

function BudgetVsActuals() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
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
      <Table
        loading={loading}
        dataSource={rows}
        pagination={{ pageSize: 10 }}
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
  );
}

function CashFlowForecast() {
  const [series, setSeries] = useState<Array<{ period: string, cash: number }>>([]);
  const [loading, setLoading] = useState(false);
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
      <Table
        loading={loading}
        dataSource={series.map((s) => ({ key: s.period, ...s }))}
        pagination={false}
        columns={[
          { title: 'Period', dataIndex: 'period' },
          { title: 'Projected Cash', dataIndex: 'cash', render: (v: number) => `$${(v||0).toLocaleString()}` },
        ]}
      />
    </div>
  );
}

function ApprovalsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(false);
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
  }, [status]);
  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Typography.Text>Filter:</Typography.Text>
        <Button type={status==='pending'? 'primary':'default'} onClick={() => setStatus('pending')}>Pending</Button>
        <Button type={status==='approved'? 'primary':'default'} onClick={() => setStatus('approved')}>Approved</Button>
        <Button type={status==='rejected'? 'primary':'default'} onClick={() => setStatus('rejected')}>Rejected</Button>
      </Space>
      <Table
        loading={loading}
        dataSource={rows}
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
  );
}

function AccountsPayable() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('invoices')
          .select('id, vendor, invoice_number, amount, due_date, status, invoice_date')
          .eq('status', status)
          .order('due_date', { ascending: true });
        setInvoices((data || []).map((d: any) => ({ key: d.id, ...d })));
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);
  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Typography.Text>Status:</Typography.Text>
        <Button type={status==='pending'? 'primary':'default'} onClick={() => setStatus('pending')}>Pending</Button>
        <Button type={status==='approved'? 'primary':'default'} onClick={() => setStatus('approved')}>Approved</Button>
        <Button type={status==='paid'? 'primary':'default'} onClick={() => setStatus('paid')}>Paid</Button>
      </Space>
      <Table
        loading={loading}
        dataSource={invoices}
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
  );
}

function AccountsReceivable() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
  }, []);
  return (
    <div>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        {['Current','0-30','31-60','61-90','90+'].map((b) => {
          const sum = rows.filter(r => r.bucket === b).reduce((s, r) => s + (r.amount || 0), 0);
          return (
            <Col key={b} xs={12} md={6} lg={4}><div style={{ background:'#f1f5f9', padding:12, borderRadius:8 }}><div style={{ color:'#64748b' }}>{b}</div><div style={{ fontWeight:700 }}>$ {sum.toLocaleString()}</div></div></Col>
          );
        })}
      </Row>
      <Table
        loading={loading}
        dataSource={rows}
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
  );
}

function CloseManagement() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
  }, []);
  return (
    <Row gutter={[16,16]}>
      <Col xs={24} lg={14}>
        <Typography.Title level={5}>Close Checklist</Typography.Title>
        <Table
          loading={loading}
          dataSource={tasks}
          pagination={false}
          columns={[
            { title: 'Period', dataIndex: 'period', width: 110 },
            { title: 'Task', dataIndex: 'name' },
            { title: 'Owner', dataIndex: 'owner', width: 140 },
            { title: 'Due (Day)', dataIndex: 'due_day', width: 100 },
            { title: 'Status', dataIndex: 'status', width: 120 },
          ]}
        />
      </Col>
      <Col xs={24} lg={10}>
        <Typography.Title level={5}>Reconciliations</Typography.Title>
        <Table
          loading={loading}
          dataSource={recs}
          pagination={false}
          columns={[
            { title: 'Period', dataIndex: 'period', width: 110 },
            { title: 'Type', dataIndex: 'type', width: 140 },
            { title: 'Status', dataIndex: 'status', width: 120 },
            { title: 'Notes', dataIndex: 'notes' },
          ]}
        />
      </Col>
    </Row>
  );
}

function TreasuryView() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
  }, []);
  const total = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  return (
    <div>
      <Row gutter={[16,16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={8}><div style={{ background:'#ecfeff', padding:16, borderRadius:8 }}><div style={{ color:'#0891b2' }}>Total Cash</div><div style={{ fontWeight:700, fontSize:18 }}>$ {total.toLocaleString()}</div></div></Col>
      </Row>
      <Table
        loading={loading}
        dataSource={accounts}
        columns={[
          { title: 'Account', dataIndex: 'name' },
          { title: 'Institution', dataIndex: 'institution' },
          { title: 'Currency', dataIndex: 'currency', width: 100 },
          { title: 'Current Balance', dataIndex: 'current_balance', render: (v: number) => `$${(v||0).toLocaleString()}` },
          { title: 'Updated', dataIndex: 'updated_at', render: (v: string) => new Date(v).toLocaleString(), width: 180 },
        ]}
      />
    </div>
  );
}
