// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Typography, Row, Col, Statistic, Table, DatePicker, Space, Button, Divider, Alert, Modal, InputNumber, Form, message, Select, Input, Tooltip, Popover } from "antd";
import {
  DollarOutlined,
  BarChartOutlined,
  BankOutlined,
  FundOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  TeamOutlined,
  FileTextOutlined,
  AccountBookOutlined,
  CheckCircleTwoTone,
  LineChartOutlined,
  CalculatorOutlined,
  CheckSquareOutlined,
  WalletOutlined,
  EditOutlined,
  FileOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  PrinterOutlined,
  ShareAltOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  InfoCircleOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, AreaChart, Area, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { ExecutiveInboxIMessage } from '@/components/executive/ExecutiveInboxIMessage';
import {
  Aperture,
  DollarSign,
  TrendingDown,
  Clock,
  Scale,
  Sigma,
  BarChart3,
  Users,
  Rocket,
  Lightbulb,
  ShieldAlert,
  FileText,
  Mail,
} from 'lucide-react';
import { FuturisticChart } from '@/components/cfo/FuturisticChart';
import BusinessEmailSystem from '@/components/executive/BusinessEmailSystem';
import ExecutivePortalLayout, { ExecutiveNavItem } from '@/components/executive/ExecutivePortalLayout';

const { RangePicker } = DatePicker;

// Reusable InfoIcon component with Popover
function InfoIcon({ content, title }: { content: string; title?: string }) {
  const [open, setOpen] = useState(false);
  
  const popoverContent = (
    <div style={{ maxWidth: '300px' }}>
      {title && <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{title}</div>}
      <div style={{ fontSize: '13px', lineHeight: '1.5' }}>{content}</div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      title={title || "Information"}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
    >
      <InfoCircleOutlined
        style={{
          fontSize: '14px',
          color: '#1890ff',
          cursor: 'pointer',
          position: 'absolute',
          top: '8px',
          right: '8px',
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      />
    </Popover>
  );
}

function BigNavButton({ color, hover, title, subtitle, onClick, infoContent }: { color: string; hover: string; title: string; subtitle: string; onClick: () => void; infoContent?: string }) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      {infoContent && <InfoIcon content={infoContent} title={title} />}
      <button
        onClick={onClick}
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${hover} 100%)`,
          color: '#fff',
          borderRadius: 16,
          padding: isMobile ? '10px 12px' : '12px 16px',
          textAlign: 'left',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          width: '100%',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          minHeight: isMobile ? 80 : 90,
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '50%',
          filter: 'blur(0px)',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 700 }}>{title}</h3>
          <p style={{ margin: '6px 0 0 0', fontSize: isMobile ? 12 : 13, color: 'rgba(255, 255, 255, 0.85)' }}>{subtitle}</p>
        </div>
      </button>
    </div>
  );
}

// KPI Metric Card Component
interface KpiData {
  title: string;
  value: string;
  change: number;
  changeUnit: string;
  icon: React.ElementType;
  color: string;
}

const SectionCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
      padding: 24,
      ...style,
    }}
  >
    {children}
  </div>
);

const MetricCard: React.FC<KpiData> = ({ title, value, change, changeUnit, icon: Icon, color }) => {
  const isPositiveMetric = title !== 'Operating Expenses' && title !== 'COGS';
  const isPositive = isPositiveMetric ? change >= 0 : change <= 0;
  
  const getGradient = () => {
    if (title === 'Monthly Revenue') return 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)';
    if (title === 'Gross Margin %') return 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)';
    if (title === 'Net Cash Flow (Burn $)') return 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)';
    if (title === 'COGS') return 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)';
    if (title === 'Operating Expenses') return 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)';
    return 'rgba(255, 255, 255, 0.1)';
  };

  const getIconColor = () => {
    if (title === 'Monthly Revenue') return '#3b82f6';
    if (title === 'Gross Margin %') return '#8b5cf6';
    if (title === 'Net Cash Flow (Burn $)') return '#10b981';
    if (title === 'COGS') return '#f59e0b';
    if (title === 'Operating Expenses') return '#ef4444';
    return '#64748b';
  };

  return (
    <SectionCard style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: '#64748b', fontWeight: 600 }}>{title}</p>
          <p style={{ margin: '8px 0 0 0', fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{value}</p>
          <span
            style={{
              marginTop: 8,
              display: 'inline-flex',
              alignItems: 'center',
              background: isPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: isPositive ? '#16a34a' : '#dc2626',
              borderRadius: 9999,
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {isPositive ? '+' : '-'}
            {Math.abs(change)}{changeUnit} vs last period
          </span>
        </div>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: getGradient(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: getIconColor(),
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
          }}
        >
          <Icon size={28} />
        </div>
      </div>
    </SectionCard>
  );
};

// Revenue & Profit Trend Chart with Glassmorphism
const RevenueProfitChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <InfoIcon content="This chart shows the monthly revenue and net cash flow trends over the last 6 months. Revenue represents total order value, while Net Cash Flow shows the profit or burn rate after all expenses." title="Financial Trend Chart" />
      <FuturisticChart
        data={data}
        type="area"
        title="Financial Performance Trend"
        height={400}
        colors={['#3b82f6', '#10b981', '#f59e0b']}
        dataKeys={{ revenue: 'Revenue', profit: 'Profit' }}
      />
    </div>
  );
};

// Expense Breakdown Pie Chart with Glassmorphism
const ExpensesPieChart: React.FC<{ data: any[] }> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <InfoIcon content="This pie chart displays how operating expenses are distributed across different categories. Use this to identify where the majority of your operational costs are allocated." title="Expense Breakdown" />
      <FuturisticChart
        data={data}
        type="pie"
        title="Expense Distribution"
        height={400}
        colors={data.map(d => d.color)}
      />
    </div>
  );
};

// Key Financial Ratios Table with Glassmorphism
interface RatioData {
  ratio: string;
  value: string;
  interpretation: 'Strong' | 'Average' | 'Needs Attention';
}

const KeyRatiosTable: React.FC<{ data: RatioData[] }> = ({ data }) => {
  const getInterpretationStyles = (interpretation: RatioData['interpretation']) => {
    switch (interpretation) {
      case 'Strong':
        return { background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' };
      case 'Average':
        return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' };
      case 'Needs Attention':
        return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
      default:
        return { background: 'rgba(148, 163, 184, 0.2)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.4)' };
    }
  };

  return (
    <SectionCard style={{ position: 'relative' }}>
      <InfoIcon content="Key financial ratios help assess the company's financial health. Current Ratio measures liquidity, Debt-to-Equity shows leverage, Gross Margin indicates profitability, Quick Ratio tests short-term solvency, and Inventory Turnover measures efficiency." title="Key Financial Ratios" />
      <h2 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Scale style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
        Key Financial Ratios
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Ratio
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Value
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Health
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const styles = getInterpretationStyles(item.interpretation);
              return (
                <tr 
                  key={item.ratio} 
                  style={{ 
                    borderBottom: index < data.length - 1 ? '1px solid #e2e8f0' : 'none',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ 
                    padding: '16px', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: '#0f172a',
                  }}>
                    {item.ratio}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    fontSize: '14px', 
                    color: '#475569',
                  }}>
                    {item.value}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        ...styles,
                      }}
                    >
                      {item.interpretation}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};

// CFO Dashboard Component
function CFODashboard() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch orders for revenue calculation
      const { data: orders } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .gte("created_at", new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

      // Generate monthly data for last 6 months
      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(date.toLocaleString('default', { month: 'short' }));
      }

      const monthly = months.map((month, index) => {
        const targetMonth = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
        const monthOrders = (orders || []).filter(o => {
          const orderDate = new Date(o.created_at);
          return orderDate.getMonth() === targetMonth.getMonth() && 
                 orderDate.getFullYear() === targetMonth.getFullYear();
        });
        const revenue = (monthOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0) / 1000; // Convert to K
        const cogs = revenue * 0.36; // Estimate
        const opEx = revenue * 0.25; // Estimate
        const profit = revenue - cogs - opEx;
        return { month, Revenue: revenue, COGS: cogs, Operating_Expenses: opEx, Profit: profit };
      });
      setMonthlyData(monthly);

      // Calculate KPIs
      const currentMonth = monthly[monthly.length - 1];
      const previousMonth = monthly[monthly.length - 2] || monthly[0];

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
      };

      const currentGrossMargin = currentMonth.Revenue > 0 ? ((currentMonth.Revenue - currentMonth.COGS) / currentMonth.Revenue) * 100 : 0;
      const previousGrossMargin = previousMonth.Revenue > 0 ? ((previousMonth.Revenue - previousMonth.COGS) / previousMonth.Revenue) * 100 : 0;
      const changeInGrossMargin = currentGrossMargin - previousGrossMargin;

      setKpiData([
        {
          title: 'Monthly Revenue',
          value: `$${currentMonth.Revenue.toFixed(0)}K`,
          change: calculateChange(currentMonth.Revenue, previousMonth.Revenue),
          changeUnit: 'vs Last Month',
          icon: DollarSign,
          color: 'text-blue-600',
        },
        {
          title: 'Gross Margin %',
          value: `${currentGrossMargin.toFixed(1)}%`,
          change: changeInGrossMargin,
          changeUnit: 'pp vs Last Month',
          icon: Sigma,
          color: 'text-purple-600',
        },
        {
          title: 'Net Cash Flow (Burn $)',
          value: `$${currentMonth.Profit.toFixed(0)}K`,
          change: calculateChange(currentMonth.Profit, previousMonth.Profit),
          changeUnit: 'vs Last Month',
          icon: Aperture,
          color: 'text-green-600',
        },
        {
          title: 'COGS',
          value: `$${currentMonth.COGS.toFixed(0)}K`,
          change: calculateChange(currentMonth.COGS, previousMonth.COGS),
          changeUnit: 'vs Last Month',
          icon: Clock,
          color: 'text-yellow-600',
        },
        {
          title: 'Operating Expenses',
          value: `$${currentMonth.Operating_Expenses.toFixed(0)}K`,
          change: calculateChange(currentMonth.Operating_Expenses, previousMonth.Operating_Expenses),
          changeUnit: 'vs Last Month',
          icon: TrendingDown,
          color: 'text-red-600',
        },
      ]);

      // Expense breakdown (ensure it adds up to Operating Expenses)
      const totalExpenses = currentMonth.Operating_Expenses;
      setExpenseBreakdown([
        { name: 'Salaries', value: totalExpenses * 0.64, color: '#1890ff' },
        { name: 'R&D', value: totalExpenses * 0.20, color: '#9b59b6' },
        { name: 'Rent & Utilities', value: totalExpenses * 0.10, color: '#2ecc71' },
        { name: 'Marketing', value: totalExpenses * 0.03, color: '#f39c12' },
        { name: 'Oth', value: totalExpenses * 0.03, color: '#e74c3c' },
      ]);

      // Mock ratios
      setRatios([
        { ratio: 'Current Ratio', value: '2.5x', interpretation: 'Strong' },
        { ratio: 'Debt-to-Equity', value: '0.45', interpretation: 'Strong' },
        { ratio: 'Gross Margin', value: `${currentGrossMargin.toFixed(1)}%`, interpretation: currentGrossMargin > 50 ? 'Strong' : currentGrossMargin > 40 ? 'Average' : 'Needs Attention' },
        { ratio: 'Quick Ratio', value: '1.1x', interpretation: 'Average' },
        { ratio: 'Inventory Turnover', value: '6.8x', interpretation: 'Needs Attention' },
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthName = monthlyData[monthlyData.length - 1]?.month || new Date().toLocaleString('default', { month: 'short' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? 16 : 24, background: '#f8fafc' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <SectionCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 28 : 32, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Aperture style={{ width: 32, height: 32, color: '#3b82f6' }} />
                CFO Financial Dashboard
              </h1>
              <p style={{ color: '#475569', marginTop: 8, fontSize: isMobile ? 14 : 16 }}>
                Real-time financial overview for the month ending {currentMonthName}
              </p>
            </div>
            <div style={{ textAlign: isMobile ? 'left' : 'right', color: '#475569', fontSize: 13 }}>
              <div style={{ fontWeight: 600 }}>Reporting Period</div>
              <div style={{ fontSize: 16 }}>{currentMonthName}</div>
              <div style={{ marginTop: 4 }}>Updated {new Date().toLocaleString()}</div>
            </div>
          </div>
        </SectionCard>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {kpiData.map((kpi) => (
            <MetricCard key={kpi.title} {...kpi} />
          ))}
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          <SectionCard>
            <RevenueProfitChart data={monthlyData} />
          </SectionCard>
          <SectionCard>
            <ExpensesPieChart data={expenseBreakdown} />
          </SectionCard>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          <SectionCard>
            <FuturisticChart
              data={monthlyData}
              type="composed"
              title="Revenue vs Expenses Analysis"
              height={350}
              colors={['#3b82f6', '#ef4444', '#10b981']}
              dataKeys={{ revenue: 'Revenue', expenses: 'Operating_Expenses', profit: 'Profit' }}
            />
          </SectionCard>
          <SectionCard>
            <FuturisticChart
              data={monthlyData.map(d => ({ month: d.month, Revenue: d.Revenue, COGS: d.COGS }))}
              type="bar"
              title="Revenue & COGS Comparison"
              height={350}
              colors={['#3b82f6', '#f59e0b']}
              dataKeys={{ revenue: 'Revenue', expenses: 'COGS' }}
            />
          </SectionCard>
        </section>

        <SectionCard>
          <KeyRatiosTable data={ratios} />
        </SectionCard>
      </div>
    </div>
  );
}

export default function CFOPortal() {
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<any>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders for transactions tab
      const { data: orders } = await supabase.from("orders").select("total_amount, created_at").limit(200);
      setPayouts([]);
      setTransactions(orders || []);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchData();
    }, 60000);
    
    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel('cfo_orders_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();
    
    // Check screen size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      clearInterval(interval);
      ordersChannel.unsubscribe();
      window.removeEventListener('resize', checkMobile);
    };
  }, [fetchData]);

  const navItems = useMemo<ExecutiveNavItem[]>(() => [
    { id: 'overview', label: 'Overview Dashboard', icon: BarChart3 },
    { id: 'transactions', label: `Transactions (${transactions.length})`, icon: FileText },
    { id: 'payouts', label: `Payouts (${payouts.length})`, icon: DollarSign },
    { id: 'manager', label: 'Manager Console', icon: Users },
    { id: 'ap', label: 'Accounts Payable', icon: FileText },
    { id: 'ar', label: 'Accounts Receivable', icon: FileText },
    { id: 'approvals', label: 'Approvals', icon: ShieldAlert },
    { id: 'forecast', label: 'Forecast', icon: Rocket },
    { id: 'bva', label: 'Budget vs Actuals', icon: Lightbulb },
    { id: 'close', label: 'Close Checklist', icon: FileText },
    { id: 'treasury', label: 'Treasury', icon: DollarSign },
    { id: 'communications', label: 'Executive Communications', icon: Mail },
    { id: 'messages', label: 'Message Center', icon: Mail },
    { id: 'wordprocessor', label: 'Word Processor', icon: FileText },
  ], [transactions.length, payouts.length]);

  const openPortal = (path: string, subdomain?: string) => {
    const host = window.location.hostname;
    if (subdomain && /^cfo\./i.test(host)) {
      const target = host.replace(/^cfo\./i, `${subdomain}.`);
      window.location.href = `${window.location.protocol}//${target}`;
      return;
    }
    navigate(path);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      navigate('/auth?hq=true');
    }
  };

  const actionButtons = (
    <Space wrap size={isMobile ? 4 : 8}>
      <RangePicker onChange={setRange} size={isMobile ? 'small' : 'middle'} />
      <Button onClick={fetchData} size={isMobile ? 'small' : 'middle'}>
        Refresh
      </Button>
      <Button onClick={() => openPortal('/board', 'board')} size={isMobile ? 'small' : 'middle'}>
        Board Portal
      </Button>
      <Button onClick={() => openPortal('/admin', 'admin')} size={isMobile ? 'small' : 'middle'}>
        Admin Portal
      </Button>
      <Button onClick={() => openPortal('/ceo', 'ceo')} size={isMobile ? 'small' : 'middle'}>
        CEO Command Center
      </Button>
      <Button
        type="primary"
        icon={<EditOutlined />}
        onClick={() => setActiveSection('wordprocessor')}
        size={isMobile ? 'small' : 'middle'}
      >
        Word Processor
      </Button>
    </Space>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <CFODashboard />;
      case 'transactions':
        return (
          <div className="overflow-hidden">
            <Table
              loading={loading}
              dataSource={transactions}
              rowKey={(r: any) => r.id || r.created_at}
              size={isMobile ? 'small' : 'default'}
              scroll={{ x: isMobile ? 600 : 'auto' }}
              pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
              columns={[
                { title: 'Date', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString(), width: 200 },
                { title: 'Amount', dataIndex: 'total_amount', render: (v: number) => `$${(v || 0).toLocaleString()}` },
              ]}
            />
          </div>
        );
      case 'payouts':
        return (
          <div className="overflow-hidden">
            <Table
              loading={loading}
              dataSource={payouts}
              rowKey={(r: any) => r.id}
              size={isMobile ? 'small' : 'default'}
              scroll={{ x: isMobile ? 600 : 'auto' }}
              pagination={{ pageSize: isMobile ? 5 : 10, showSizeChanger: !isMobile }}
              columns={[
                { title: 'Payout ID', dataIndex: 'id' },
                { title: 'Amount', dataIndex: 'amount', render: (v: number) => `$${(v || 0).toLocaleString()}` },
                { title: 'Status', dataIndex: 'status' },
                { title: 'Created', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
              ]}
            />
          </div>
        );
      case 'manager':
        return <ManagerConsole />;
      case 'ap':
        return <AccountsPayable />;
      case 'ar':
        return <AccountsReceivable />;
      case 'approvals':
        return <ApprovalsPanel />;
      case 'forecast':
        return <CashFlowForecast />;
      case 'bva':
        return <BudgetVsActuals />;
      case 'close':
        return <CloseManagement />;
      case 'treasury':
        return <TreasuryView />;
      case 'communications':
        return <BusinessEmailSystem />;
      case 'wordprocessor':
        return <WordProcessor />;
      default:
        return <CFODashboard />;
    }
  };

  const content = renderContent();
  const shouldWrapContent = activeSection !== 'overview';

  return (
    <ExecutivePortalLayout
      title="CFO Portal"
      subtitle="Financial operations command center"
      navItems={navItems}
      activeItemId={activeSection}
      onSelect={setActiveSection}
      onBack={() => navigate('/hub')}
      onSignOut={handleSignOut}
      actionButtons={actionButtons}
      userInfo={{
        initials: 'CF',
        name: 'Chief Financial Officer',
        role: 'Finance Leadership',
      }}
    >
      <div className="space-y-6">
        <SectionCard style={{ background: '#ecfdf5', borderColor: '#bbf7d0', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: '#065f46', fontSize: 14 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <CheckCircleOutlined style={{ color: '#059669' }} /> Finance systems operational
            </span>
            <span style={{ fontSize: 12, color: '#047857' }}>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </SectionCard>

        <SectionCard style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isChatCollapsed ? 0 : 16 }}>
            <h3 style={{ color: '#0f172a', fontSize: 18, fontWeight: 600, margin: 0 }}>Executive Chat</h3>
            <Button
              size="small"
              type="default"
              onClick={() => setIsChatCollapsed((prev) => !prev)}
            >
              {isChatCollapsed ? 'Expand' : 'Collapse'}
            </Button>
          </div>
          {!isChatCollapsed && (
            <ExecutiveInboxIMessage role="cfo" deviceId={`cfo-portal-${window.location.hostname}`} />
          )}
        </SectionCard>

        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(1, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap:12 }}>
          <BigNavButton color="#2563eb" hover="#1d4ed8" title="Manager Console" subtitle="Team & KPIs" onClick={()=> setActiveSection('manager')} infoContent="Access team management tools, view team KPIs, assign roles, and manage team performance metrics." />
          <BigNavButton color="#16a34a" hover="#15803d" title="Accounts Payable" subtitle="Invoices & Runs" onClick={()=> setActiveSection('ap')} infoContent="Manage vendor invoices, create payment runs, approve expenses, and track accounts payable aging." />
          <BigNavButton color="#f97316" hover="#ea580c" title="Accounts Receivable" subtitle="Aging & Collections" onClick={()=> setActiveSection('ar')} infoContent="View customer invoices, track receivables aging, manage collections, and monitor payment status." />
          <BigNavButton color="#dc2626" hover="#b91c1c" title="Approvals" subtitle="Spend Reviews" onClick={()=> setActiveSection('approvals')} infoContent="Review and approve pending financial transactions, expense requests, and spending authorizations." />
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(1, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap:12 }}>
          <BigNavButton color="#0ea5e9" hover="#0284c7" title="Forecast" subtitle="Cash Flow" onClick={()=> setActiveSection('forecast')} infoContent="View cash flow projections, financial forecasts, and predictive analytics for future planning." />
          <BigNavButton color="#7c3aed" hover="#6d28d9" title="Budget vs Actuals" subtitle="Variance" onClick={()=> setActiveSection('bva')} infoContent="Compare budgeted amounts against actual expenses and revenue to identify variances and trends." />
          <BigNavButton color="#9333ea" hover="#7e22ce" title="Close" subtitle="Checklist & Recs" onClick={()=> setActiveSection('close')} infoContent="Monthly and quarterly closing checklist, journal entries, reconciliations, and closing procedures." />
          <BigNavButton color="#0891b2" hover="#0e7490" title="Treasury" subtitle="Bank Balances" onClick={()=> setActiveSection('treasury')} infoContent="Monitor bank account balances, cash positions, and treasury management operations." />
        </div>

        {shouldWrapContent ? (
          <SectionCard style={{ padding: isMobile ? 16 : 24, overflow: 'hidden' }}>
            {content}
          </SectionCard>
        ) : (
          content
        )}
      </div>
    </ExecutivePortalLayout>
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
    <div style={{ position: 'relative' }}>
      <InfoIcon content="The Manager Console provides an overview of team KPIs, workload distribution, and financial metrics. Use this to monitor AP/AR status, assign team roles, and track team performance." title="Manager Console" />
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
    <div style={{ position: 'relative' }}>
      <InfoIcon content="Review and approve pending financial transactions, expense requests, and spending authorizations. Filter by status to view pending, approved, or rejected items." title="Financial Approvals" />
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
          <div style={{ position: 'relative' }}>
            <InfoIcon content="This chart shows accounts payable aging by due date. It categorizes invoices into buckets (Current, 0-30 days, 31-60 days, etc.) to help identify which payments are overdue or coming due." title="AP Aging Chart" />
            <Typography.Text strong>AP Aging (by Due Date)</Typography.Text>
          </div>
          <div style={{ height: 220, background:'#fff', position: 'relative' }}>
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
          <div style={{ position: 'relative' }}>
            <InfoIcon content="This chart forecasts upcoming cash needs based on approved and pending invoices. Use this to plan cash flow and ensure sufficient funds are available for upcoming payments." title="Upcoming Cash Needs" />
            <Typography.Text strong>Upcoming Cash Needs (Approved/Pending)</Typography.Text>
          </div>
          <div style={{ height: 220, background:'#fff', position: 'relative' }}>
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
          <div style={{ position: 'relative' }}>
            <InfoIcon content="This chart displays accounts receivable aging buckets, categorizing outstanding invoices by how long they've been overdue. Use this to prioritize collection efforts." title="AR Aging Buckets" />
            <Typography.Text strong>AR Aging Buckets</Typography.Text>
          </div>
          <div style={{ height: 220, background:'#fff', position: 'relative' }}>
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
          <div style={{ position: 'relative' }}>
            <InfoIcon content="This chart shows the collections trend over the last 6 months, helping you track payment collection patterns and identify trends in receivables management." title="Collections Trend" />
            <Typography.Text strong>Collections Trend (last 6 months)</Typography.Text>
          </div>
          <div style={{ height: 220, background:'#fff', position: 'relative' }}>
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

function WordProcessor() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentDoc, setCurrentDoc] = useState<any | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newDocModalVisible, setNewDocModalVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cfo_documents')
        .select('id, title, content, updated_at, created_at')
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const docs = data || [];
      setDocuments(docs);

      if (docs.length === 0) {
        setCurrentDoc(null);
        setTitle('');
        setContent('');
        return;
      }

      if (!currentDoc || !docs.some((doc) => doc.id === currentDoc.id)) {
        const firstDoc = docs[0];
        setCurrentDoc(firstDoc);
        setTitle(firstDoc.title ?? '');
        setContent(firstDoc.content ?? '');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [currentDoc]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectDocument = (doc: any) => {
    setCurrentDoc(doc);
    setTitle(doc.title ?? '');
    setContent(doc.content ?? '');
  };

  const handleSaveDocument = async () => {
    if (!title.trim()) {
      message.warning('Document title is required');
      return;
    }

    setLoading(true);
    try {
      if (currentDoc) {
        const { error } = await supabase
          .from('cfo_documents')
          .update({ title: title.trim(), content })
          .eq('id', currentDoc.id);

        if (error) throw error;
        message.success('Document saved');
      } else {
        const { data, error } = await supabase
          .from('cfo_documents')
          .insert({ title: title.trim(), content })
          .select()
          .single();

        if (error) throw error;
        setCurrentDoc(data);
      }

      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      message.error('Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    Modal.confirm({
      title: 'Delete document',
      content: `Are you sure you want to delete "${doc.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        setLoading(true);
        try {
          const { error } = await supabase.from('cfo_documents').delete().eq('id', doc.id);
          if (error) throw error;
          message.success('Document deleted');

          if (currentDoc?.id === doc.id) {
            setCurrentDoc(null);
            setTitle('');
            setContent('');
          }

          fetchDocuments();
        } catch (err) {
          console.error('Error deleting document:', err);
          message.error('Failed to delete document');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleCreateDocument = async () => {
    const trimmed = newDocTitle.trim();
    if (!trimmed) {
      message.warning('Enter a document title');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cfo_documents')
        .insert({ title: trimmed, content: '' })
        .select()
        .single();

      if (error) throw error;
      setNewDocTitle('');
      setNewDocModalVisible(false);
      setCurrentDoc(data);
      setTitle(data?.title ?? '');
      setContent(data?.content ?? '');
      fetchDocuments();
      message.success('Document created');
    } catch (err) {
      console.error('Error creating document:', err);
      message.error('Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
          gap: 16,
          alignItems: 'stretch',
        }}
      >
        {(!isMobile || !currentDoc) && (
          <div
            style={{
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              padding: 16,
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Documents
              </Typography.Title>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setNewDocModalVisible(true)}
              >
                New
              </Button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loading && documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20 }}>Loading…</div>
              ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 20, color: '#a1a1aa' }}>
                  No documents yet
                </div>
              ) : (
                documents.map((doc) => (
                  <Button
                    key={doc.id}
                    type={currentDoc?.id === doc.id ? 'primary' : 'default'}
                    block
                    style={{
                      marginBottom: 8,
                      textAlign: 'left',
                      height: 'auto',
                      whiteSpace: 'normal',
                    }}
                    onClick={() => handleSelectDocument(doc)}
                  >
                    <div style={{ fontWeight: 600 }}>{doc.title || 'Untitled document'}</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{formatDate(doc.updated_at || doc.created_at)}</div>
                  </Button>
                ))
              )}
            </div>
          </div>
        )}

        <div
          style={{
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 12,
            padding: 16,
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {currentDoc ? (
            <>
              <Space style={{ width: '100%' }} wrap>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <Button type="primary" loading={loading} onClick={handleSaveDocument}>
                  Save
                </Button>
                <Button danger onClick={() => currentDoc && handleDeleteDocument(currentDoc)}>
                  Delete
                </Button>
              </Space>

              <Input.TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoSize={{ minRows: isMobile ? 12 : 18, maxRows: 30 }}
                placeholder="Start typing your document here…"
              />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Typography.Title level={4}>Create your first document</Typography.Title>
              <Typography.Paragraph type="secondary">
                Draft financial memos, board summaries, or approvals using the built-in editor.
              </Typography.Paragraph>
              <Button type="primary" onClick={() => setNewDocModalVisible(true)}>
                Create Document
              </Button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={newDocModalVisible}
        title="New Document"
        okText="Create"
        okButtonProps={{ loading }}
        onOk={handleCreateDocument}
        onCancel={() => setNewDocModalVisible(false)}
      >
        <Input
          value={newDocTitle}
          onChange={(e) => setNewDocTitle(e.target.value)}
          placeholder="Document title"
        />
      </Modal>
    </>
  );
}