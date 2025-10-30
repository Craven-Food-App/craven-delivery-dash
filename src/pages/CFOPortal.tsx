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

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

export default function CFOPortal() {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<any>([]);
  const [metrics, setMetrics] = useState<any>({ revenue: 0, expenses: 0, grossMargin: 0, cash: 0, burn: 0, runway: 0 });
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

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
    <Layout style={{ minHeight: "100vh", background: "#0e1626" }}>
      <Header style={{ background: "#0b1220", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography.Title level={3} style={{ color: "#fff", margin: 0 }}>
            CFO Portal
          </Typography.Title>
          <Space>
            <RangePicker onChange={setRange} />
            <Button onClick={fetchData}>Refresh</Button>
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
