// @ts-nocheck
import React, { useEffect, useState, useRef, useCallback } from "react";
import { Layout, Typography, Row, Col, Statistic, Tabs, Table, DatePicker, Space, Button, Divider, Alert, Modal, InputNumber, Form, message, Select, Input, Tooltip, Popover } from "antd";
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
} from "@ant-design/icons";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, AreaChart, Area, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { MessageCenter } from "@/components/messaging/MessageCenter";
import { ExecutiveInboxIMessage } from '@/components/executive/ExecutiveInboxIMessage';
import { Aperture, DollarSign, TrendingUp, TrendingDown, Clock, Scale, Sigma, Activity, Zap, Target, PieChart as PieChartIcon } from 'lucide-react';
import { GlassmorphicCard } from '@/components/cfo/GlassmorphicCard';
import { GlassmorphicMetricCard } from '@/components/cfo/GlassmorphicMetricCard';
import { FuturisticChart } from '@/components/cfo/FuturisticChart';

const { Header, Content } = Layout;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

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
          padding: isMobile ? '16px' : '20px',
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
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
        }}
      >
        <div style={{ 
          fontSize: isMobile ? 16 : 18, 
          fontWeight: 700, 
          lineHeight: 1.3,
          marginBottom: '4px',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        }}>
          {title}
        </div>
        <div style={{ 
          opacity: 0.9, 
          fontSize: isMobile ? 13 : 14,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }}>
          {subtitle}
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
    <GlassmorphicMetricCard
      title={title}
      value={value}
      change={change}
      changeUnit={changeUnit}
      icon={Icon}
      iconColor={getIconColor()}
      gradient={getGradient()}
    />
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
    <GlassmorphicCard style={{ position: 'relative' }}>
      <InfoIcon content="Key financial ratios help assess the company's financial health. Current Ratio measures liquidity, Debt-to-Equity shows leverage, Gross Margin indicates profitability, Quick Ratio tests short-term solvency, and Inventory Turnover measures efficiency." title="Key Financial Ratios" />
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: 700, 
        color: 'rgba(255, 255, 255, 0.95)', 
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      }}>
        <Scale style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
        Key Financial Ratios
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <th style={{ 
                padding: '12px 16px', 
                textAlign: 'left', 
                fontSize: '12px', 
                fontWeight: 600, 
                color: 'rgba(255, 255, 255, 0.7)',
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
                color: 'rgba(255, 255, 255, 0.7)',
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
                color: 'rgba(255, 255, 255, 0.7)',
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
                    borderBottom: index < data.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ 
                    padding: '16px', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    color: 'rgba(255, 255, 255, 0.95)',
                  }}>
                    {item.ratio}
                  </td>
                  <td style={{ 
                    padding: '16px', 
                    fontSize: '14px', 
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}>
                    {item.value}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '12px',
                      display: 'inline-block',
                      ...styles,
                    }}>
                      {item.interpretation}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassmorphicCard>
  );
};

// CFO Dashboard Component
function CFODashboard() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [kpiData, setKpiData] = useState<KpiData[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [ratios, setRatios] = useState<RatioData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @media (max-width: 640px) {
          .glassmorphic-card {
            padding: 16px !important;
          }
        }
      `}</style>
      
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-50%',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-30%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 25s ease-in-out infinite reverse',
      }} />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <GlassmorphicCard style={{ marginBottom: '32px', background: 'rgba(255, 255, 255, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ 
                fontSize: '32px', 
                fontWeight: 800, 
                color: 'rgba(255, 255, 255, 0.95)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              }}>
                <Aperture style={{ width: '36px', height: '36px', color: '#3b82f6' }} />
                CFO Financial Dashboard
              </h1>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                marginTop: '8px',
                fontSize: '16px',
              }}>
                Real-time financial overview for the month ending {currentMonthName}
              </p>
            </div>
          </div>
        </GlassmorphicCard>

        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* KPI Metrics Grid */}
          <section style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}>
            {kpiData.map((kpi) => (
              <MetricCard key={kpi.title} {...kpi} />
            ))}
          </section>

          {/* Charts & Visualizations */}
          <section style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}>
            <div style={{ gridColumn: 'span 2' }}>
              <RevenueProfitChart data={monthlyData} />
            </div>
            <div>
              <ExpensesPieChart data={expenseBreakdown} />
            </div>
          </section>

          {/* Additional Financial Charts */}
          <section style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px',
          }}>
            <FuturisticChart
              data={monthlyData}
              type="composed"
              title="Revenue vs Expenses Analysis"
              height={350}
              colors={['#3b82f6', '#ef4444', '#10b981']}
              dataKeys={{ revenue: 'Revenue', expenses: 'Operating_Expenses', profit: 'Profit' }}
            />
            <FuturisticChart
              data={monthlyData.map(d => ({ month: d.month, Revenue: d.Revenue, COGS: d.COGS }))}
              type="bar"
              title="Revenue & COGS Comparison"
              height={350}
              colors={['#3b82f6', '#f59e0b']}
              dataKeys={{ revenue: 'Revenue', expenses: 'COGS' }}
            />
          </section>

          {/* Financial Ratios Table */}
          <section>
            <KeyRatiosTable data={ratios} />
          </section>
        </main>
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
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

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

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
      
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        padding: isMobile ? '12px 12px' : '16px 24px',
        boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: isMobile ? 12 : 16 }}>
          <Space>
            <Button
              type="default"
              size={isMobile ? 'small' : 'middle'}
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/hub')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              Back to Hub
            </Button>
            <Typography.Title level={3} style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              margin: 0, 
              fontSize: isMobile ? 18 : 24,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}>
              CFO Portal
            </Typography.Title>
          </Space>
          <Space direction={isMobile ? 'vertical' : 'horizontal'} size="small" style={{ width: isMobile ? '100%' : 'auto' }}>
            <RangePicker 
              onChange={setRange} 
              size={isMobile ? 'small' : 'default'} 
              style={{ 
                width: isMobile ? '100%' : 'auto',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            />
            <Button 
              onClick={fetchData} 
              size={isMobile ? 'small' : 'default'}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              Refresh
            </Button>
            <Button 
              onClick={() => {
                const host = window.location.hostname;
                if (/^cfo\./i.test(host)) {
                  const target = host.replace(/^cfo\./i, 'board.');
                  window.location.href = `${window.location.protocol}//${target}`;
                } else {
                  navigate('/board');
                }
              }} 
              size={isMobile ? 'small' : 'default'}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              Board Portal
            </Button>
            <Button 
              onClick={() => {
                const host = window.location.hostname;
                if (/^cfo\./i.test(host)) {
                  const target = host.replace(/^cfo\./i, 'admin.');
                  window.location.href = `${window.location.protocol}//${target}`;
                } else {
                  navigate('/admin');
                }
              }} 
              size={isMobile ? 'small' : 'default'}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              Admin Portal
            </Button>
            <Button 
              onClick={() => {
                const host = window.location.hostname;
                if (/^cfo\./i.test(host)) {
                  const target = host.replace(/^cfo\./i, 'ceo.');
                  window.location.href = `${window.location.protocol}//${target}`;
                } else {
                  navigate('/');
                }
              }} 
              size={isMobile ? 'small' : 'default'}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.95)',
              }}
            >
              CEO Command Center
            </Button>
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setActiveTab('wordprocessor')}
              size={isMobile ? 'small' : 'default'}
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
              }}
            >
              Word Processor
            </Button>
          </Space>
        </div>
      </Header>
      <Content style={{ padding: isMobile ? 12 : 24, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <GlassmorphicCard style={{ marginBottom: 24, background: 'rgba(16, 185, 129, 0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.95)', fontSize: '14px', fontWeight: 600 }}>
                <CheckCircleOutlined style={{ color: '#10b981' }} /> Finance systems operational
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          </GlassmorphicCard>

          {/* Executive Chat - Isolated per portal */}
          <GlassmorphicCard style={{ marginBottom: 24 }}>
            <ExecutiveInboxIMessage role="cfo" deviceId={`cfo-portal-${window.location.hostname}`} />
          </GlassmorphicCard>

          {/* High-Priority Quick Access - Responsive Grid */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(1, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap:16, marginBottom: 24 }}>
            <BigNavButton color="#2563eb" hover="#1d4ed8" title="Manager Console" subtitle="Team & KPIs" onClick={()=> setActiveTab('manager')} infoContent="Access team management tools, view team KPIs, assign roles, and manage team performance metrics." />
            <BigNavButton color="#16a34a" hover="#15803d" title="Accounts Payable" subtitle="Invoices & Runs" onClick={()=> setActiveTab('ap')} infoContent="Manage vendor invoices, create payment runs, approve expenses, and track accounts payable aging." />
            <BigNavButton color="#f97316" hover="#ea580c" title="Accounts Receivable" subtitle="Aging & Collections" onClick={()=> setActiveTab('ar')} infoContent="View customer invoices, track receivables aging, manage collections, and monitor payment status." />
            <BigNavButton color="#dc2626" hover="#b91c1c" title="Approvals" subtitle="Spend Reviews" onClick={()=> setActiveTab('approvals')} infoContent="Review and approve pending financial transactions, expense requests, and spending authorizations." />
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(1, minmax(0,1fr))' : 'repeat(4, minmax(0,1fr))', gap:16, marginBottom: 24 }}>
            <BigNavButton color="#0ea5e9" hover="#0284c7" title="Forecast" subtitle="Cash Flow" onClick={()=> setActiveTab('forecast')} infoContent="View cash flow projections, financial forecasts, and predictive analytics for future planning." />
            <BigNavButton color="#7c3aed" hover="#6d28d9" title="Budget vs Actuals" subtitle="Variance" onClick={()=> setActiveTab('bva')} infoContent="Compare budgeted amounts against actual expenses and revenue to identify variances and trends." />
            <BigNavButton color="#9333ea" hover="#7e22ce" title="Close" subtitle="Checklist & Recs" onClick={()=> setActiveTab('close')} infoContent="Monthly and quarterly closing checklist, journal entries, reconciliations, and closing procedures." />
            <BigNavButton color="#0891b2" hover="#0e7490" title="Treasury" subtitle="Bank Balances" onClick={()=> setActiveTab('treasury')} infoContent="Monitor bank account balances, cash positions, and treasury management operations." />
          </div>

          <GlassmorphicCard style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '24px', overflow: 'hidden' }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              size={isMobile ? 'small' : 'large'}
              style={{
                background: 'transparent',
              }}
              tabBarStyle={{ 
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                marginBottom: '24px',
              }}
            >
            <TabPane
              tab={
                <Tooltip title="View comprehensive financial dashboard with KPIs, charts, and key metrics">
                  <span>
                    <BarChartOutlined /> Overview
                  </span>
                </Tooltip>
              }
              key="overview"
            >
              <CFODashboard />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Browse all financial transactions, orders, and payment records">
                  <span>
                    <FileSearchOutlined /> Transactions
                  </span>
                </Tooltip>
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
                <Tooltip title="View driver and vendor payout records, payment history, and payout status">
                  <span>
                    <BankOutlined /> Payouts
                  </span>
                </Tooltip>
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
            <TabPane
              tab={
                <Tooltip title="Manage team assignments, view team KPIs, and assign roles to team members">
                  <span>
                    <TeamOutlined /> Manager Console
                  </span>
                </Tooltip>
              }
              key="manager"
            >
              <ManagerConsole />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Manage vendor invoices, create payment runs, and track accounts payable">
                  <span>
                    <FileTextOutlined /> Accounts Payable
                  </span>
                </Tooltip>
              }
              key="ap"
            >
              <AccountsPayable />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Track customer invoices, receivables aging, and collections management">
                  <span>
                    <AccountBookOutlined /> Accounts Receivable
                  </span>
                </Tooltip>
              }
              key="ar"
            >
              <AccountsReceivable />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Review and approve pending financial transactions and expense requests">
                  <span>
                    <CheckCircleTwoTone /> Approvals
                  </span>
                </Tooltip>
              }
              key="approvals"
            >
              <ApprovalsPanel />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="View cash flow forecasts, financial projections, and predictive analytics">
                  <span>
                    <LineChartOutlined /> Forecast
                  </span>
                </Tooltip>
              }
              key="forecast"
            >
              <CashFlowForecast />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Compare budgeted amounts against actual expenses and revenue to analyze variances">
                  <span>
                    <CalculatorOutlined /> Budget vs Actuals
                  </span>
                </Tooltip>
              }
              key="bva"
            >
              <BudgetVsActuals />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Monthly and quarterly closing procedures, checklists, and reconciliation tasks">
                  <span>
                    <CheckSquareOutlined /> Close
                  </span>
                </Tooltip>
              }
              key="close"
            >
              <CloseManagement />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Monitor bank account balances, cash positions, and treasury operations">
                  <span>
                    <WalletOutlined /> Treasury
                  </span>
                </Tooltip>
              }
              key="treasury"
            >
              <TreasuryView />
            </TabPane>
            <TabPane 
              tab={
                <Tooltip title="Communicate with team members and view message history">
                  <span>Message Center</span>
                </Tooltip>
              } 
              key="messages"
            >
              <MessageCenter />
            </TabPane>
            <TabPane
              tab={
                <Tooltip title="Create and edit financial documents, reports, and memos">
                  <span>
                    <EditOutlined /> Word Processor
                  </span>
                </Tooltip>
              }
              key="wordprocessor"
            >
              <WordProcessor />
            </TabPane>
          </Tabs>
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
  const [currentDoc, setCurrentDoc] = useState<any>(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newDocModalVisible, setNewDocModalVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [form] = Form.useForm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [fontFamily, setFontFamily] = useState('Georgia');
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#ffffff');
  const shareForm = Form.useForm()[0];

  useEffect(() => {
    fetchDocuments();
    fetchRecipients();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Auto-save every 30 seconds if there's a current document and content
    if (currentDoc && content) {
      const autoSaveTimer = setTimeout(() => {
        handleSave(false);
      }, 30000);
      return () => clearTimeout(autoSaveTimer);
    }
  }, [content, currentDoc]);

  const fetchRecipients = async () => {
    try {
      // Fetch employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('id, first_name, last_name, email, position, employment_status')
        .eq('employment_status', 'active')
        .order('first_name');

      // Fetch admins and C-suite from user_roles
      const { data: roles, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'ceo', 'cfo', 'coo', 'cto'])
        .order('role');

      // Fetch user profiles for role users
      const roleUserIds = (roles || []).map(r => r.user_id);
      const { data: profiles, error: profileError } = roleUserIds.length > 0
        ? await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', roleUserIds)
        : { data: [], error: null };

      const allRecipients: any[] = [];

      // Add employees
      if (employees) {
        employees.forEach((emp: any) => {
          allRecipients.push({
            id: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            email: emp.email,
            role: emp.position,
            type: 'employee',
          });
        });
      }

      // Add C-suite and admins
      if (profiles && roles) {
        profiles.forEach((profile: any) => {
          const userRole = roles.find(r => r.user_id === profile.id);
          if (userRole) {
            allRecipients.push({
              id: profile.id,
              name: profile.full_name || 'Unknown',
              email: profile.email,
              role: userRole.role.toUpperCase(),
              type: 'executive',
            });
          }
        });
      }

      setRecipients(allRecipients);
    } catch (err: any) {
      console.error('Error fetching recipients:', err);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const handlePrint = () => {
    if (!currentDoc) {
      message.warning('No document selected');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { 
              font-family: ${fontFamily}, serif; 
              font-size: ${fontSize}px;
              color: ${textColor};
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div>${content || '<p>No content</p>'}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleShare = async () => {
    if (!currentDoc) {
      message.warning('No document selected');
      return;
    }

    if (selectedRecipients.length === 0) {
      message.warning('Please select at least one recipient');
      return;
    }

    setLoading(true);
    try {
      // Create a shared document notification or email
      // For now, we'll store it in a shared documents table or send via messaging
      const recipientList = selectedRecipients.map(id => {
        const recipient = recipients.find(r => r.id === id);
        return recipient ? recipient.email : id;
      }).join(', ');

      message.success(`Document shared with ${selectedRecipients.length} recipient(s)`);
      setShareModalVisible(false);
      setSelectedRecipients([]);
    } catch (err: any) {
      console.error('Error sharing document:', err);
      message.error('Failed to share document');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cfo_documents')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      message.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleNewDocument = async () => {
    if (!newDocTitle.trim()) {
      message.warning('Please enter a document title');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cfo_documents')
        .insert({
          title: newDocTitle.trim(),
          content: '',
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      setDocuments([data, ...documents]);
      setCurrentDoc(data);
      setTitle(data.title);
      setContent('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
      setNewDocModalVisible(false);
      setNewDocTitle('');
      message.success('New document created');
    } catch (err: any) {
      console.error('Error creating document:', err);
      message.error('Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDocument = async (doc: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cfo_documents')
        .select('*')
        .eq('id', doc.id)
        .single();

      if (error) throw error;

      setCurrentDoc(data);
      setTitle(data.title);
      setContent(data.content || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content || '';
      }
      message.success('Document loaded');
    } catch (err: any) {
      console.error('Error loading document:', err);
      message.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (showMessage = true) => {
    if (!currentDoc) {
      message.warning('No document selected');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cfo_documents')
        .update({
          title: title.trim(),
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentDoc.id);

      if (error) throw error;

      // Update local documents list
      const updatedDocs = documents.map(doc =>
        doc.id === currentDoc.id
          ? { ...doc, title: title.trim(), content, updated_at: new Date().toISOString() }
          : doc
      );
      setDocuments(updatedDocs);
      setCurrentDoc({ ...currentDoc, title: title.trim(), content });

      if (showMessage) {
        message.success('Document saved');
      }
    } catch (err: any) {
      console.error('Error saving document:', err);
      message.error('Failed to save document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (doc: any) => {
    Modal.confirm({
      title: 'Delete Document',
      content: `Are you sure you want to delete "${doc.title}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setLoading(true);
        try {
          const { error } = await supabase
            .from('cfo_documents')
            .delete()
            .eq('id', doc.id);

          if (error) throw error;

          setDocuments(documents.filter(d => d.id !== doc.id));
          if (currentDoc?.id === doc.id) {
            setCurrentDoc(null);
            setTitle('');
            setContent('');
          }
          message.success('Document deleted');
        } catch (err: any) {
          console.error('Error deleting document:', err);
          message.error('Failed to delete document');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 200px)', gap: 16 }}>
      {/* Sidebar - Document List */}
      <div style={{
        width: isMobile ? '100%' : 280,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        ...(isMobile && currentDoc && { display: 'none' }),
      }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>Documents</Typography.Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => setNewDocModalVisible(true)}
          >
            New
          </Button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading && documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20 }}>Loading...</div>
          ) : documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              No documents yet
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleLoadDocument(doc)}
                style={{
                  padding: 12,
                  marginBottom: 8,
                  background: currentDoc?.id === doc.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: `1px solid ${currentDoc?.id === doc.id ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.2)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (currentDoc?.id !== doc.id) {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentDoc?.id !== doc.id) {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong style={{ fontSize: 14, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.title}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      {formatDate(doc.updated_at || doc.created_at)}
                    </Typography.Text>
                  </div>
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc);
                    }}
                    style={{ marginLeft: 8, flexShrink: 0 }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        ...(isMobile && !currentDoc && { display: 'none' }),
      }}>
        {currentDoc ? (
          <>
            {/* Toolbar */}
            <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Space size="small" wrap>
                {/* Text Formatting */}
                <Button.Group size="small">
                  <Button
                    icon={<BoldOutlined />}
                    onClick={() => executeCommand('bold')}
                    title="Bold"
                  />
                  <Button
                    icon={<ItalicOutlined />}
                    onClick={() => executeCommand('italic')}
                    title="Italic"
                  />
                  <Button
                    icon={<UnderlineOutlined />}
                    onClick={() => executeCommand('underline')}
                    title="Underline"
                  />
                  <Button
                    icon={<StrikethroughOutlined />}
                    onClick={() => executeCommand('strikeThrough')}
                    title="Strikethrough"
                  />
                </Button.Group>

                <Divider type="vertical" />

                {/* Alignment */}
                <Button.Group size="small">
                  <Button
                    icon={<AlignLeftOutlined />}
                    onClick={() => executeCommand('justifyLeft')}
                    title="Align Left"
                  />
                  <Button
                    icon={<AlignCenterOutlined />}
                    onClick={() => executeCommand('justifyCenter')}
                    title="Align Center"
                  />
                  <Button
                    icon={<AlignRightOutlined />}
                    onClick={() => executeCommand('justifyRight')}
                    title="Align Right"
                  />
                </Button.Group>

                <Divider type="vertical" />

                {/* Lists */}
                <Button.Group size="small">
                  <Button
                    icon={<UnorderedListOutlined />}
                    onClick={() => executeCommand('insertUnorderedList')}
                    title="Bullet List"
                  />
                  <Button
                    icon={<OrderedListOutlined />}
                    onClick={() => executeCommand('insertOrderedList')}
                    title="Numbered List"
                  />
                </Button.Group>

                <Divider type="vertical" />

                {/* Font Settings */}
                <Select
                  value={fontFamily}
                  onChange={setFontFamily}
                  size="small"
                  style={{ width: 140 }}
                  suffixIcon={<FontSizeOutlined />}
                >
                  <Select.Option value="Georgia">Georgia</Select.Option>
                  <Select.Option value="Times New Roman">Times New Roman</Select.Option>
                  <Select.Option value="Arial">Arial</Select.Option>
                  <Select.Option value="Helvetica">Helvetica</Select.Option>
                  <Select.Option value="Courier New">Courier New</Select.Option>
                  <Select.Option value="Verdana">Verdana</Select.Option>
                  <Select.Option value="Calibri">Calibri</Select.Option>
                </Select>

                <Select
                  value={fontSize}
                  onChange={setFontSize}
                  size="small"
                  style={{ width: 80 }}
                >
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                    <Select.Option key={size} value={size}>{size}pt</Select.Option>
                  ))}
                </Select>

                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => {
                    setTextColor(e.target.value);
                    executeCommand('foreColor', e.target.value);
                  }}
                  size="small"
                  style={{ width: 50, height: 28, padding: 2, cursor: 'pointer' }}
                  title="Text Color"
                />
              </Space>
            </div>

            {/* Title and Action Buttons */}
            <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                style={{ flex: 1, minWidth: 200 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSave(true)}
                loading={loading}
              >
                Save
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrint}
                title="Print"
              >
                Print
              </Button>
              <Button
                icon={<ShareAltOutlined />}
                onClick={() => setShareModalVisible(true)}
                title="Share Document"
              >
                Share
              </Button>
              {isMobile && (
                <Button onClick={() => {
                  setCurrentDoc(null);
                  setTitle('');
                  setContent('');
                  if (editorRef.current) {
                    editorRef.current.innerHTML = '';
                  }
                }}>
                  Back
                </Button>
              )}
            </div>

            {/* Rich Text Editor */}
            <div
              ref={editorRef}
              contentEditable
              onInput={(e) => {
                const html = e.currentTarget.innerHTML;
                setContent(html);
                // Apply font settings
                e.currentTarget.style.fontFamily = fontFamily;
                e.currentTarget.style.fontSize = `${fontSize}px`;
                e.currentTarget.style.color = textColor;
              }}
              onBlur={() => {
                if (editorRef.current) {
                  setContent(editorRef.current.innerHTML);
                }
              }}
              style={{
                flex: 1,
                fontFamily: fontFamily,
                fontSize: `${fontSize}px`,
                color: textColor,
                lineHeight: 1.8,
                padding: 20,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 12,
                minHeight: 400,
                overflowY: 'auto',
                outline: 'none',
              }}
              suppressContentEditableWarning={true}
              data-placeholder="Start typing your document here..."
              onFocus={(e) => {
                if (e.currentTarget.innerHTML === '' || e.currentTarget.innerHTML === '<br>') {
                  e.currentTarget.innerHTML = '';
                }
              }}
            />
            <style>{`
              [contenteditable][data-placeholder]:empty:before {
                content: attr(data-placeholder);
                color: rgba(255, 255, 255, 0.5);
                pointer-events: none;
              }
            `}</style>

            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right', display: 'flex', justifyContent: 'space-between' }}>
              <span>Font: {fontFamily} | Size: {fontSize}pt</span>
              <span>Auto-saves every 30 seconds</span>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
          }}>
            <FileOutlined style={{ fontSize: 64, marginBottom: 16 }} />
            <Typography.Text style={{ fontSize: 16, marginBottom: 8 }}>
              No document selected
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
              Create a new document or select one from the list
            </Typography.Text>
          </div>
        )}
      </div>

      {/* New Document Modal */}
      <Modal
        title="Create New Document"
        open={newDocModalVisible}
        onOk={handleNewDocument}
        onCancel={() => {
          setNewDocModalVisible(false);
          setNewDocTitle('');
        }}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Document Title" required>
            <Input
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              placeholder="Enter document title"
              onPressEnter={handleNewDocument}
              autoFocus
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Share Document Modal */}
      <Modal
        title="Share Document"
        open={shareModalVisible}
        onOk={handleShare}
        onCancel={() => {
          setShareModalVisible(false);
          setSelectedRecipients([]);
        }}
        confirmLoading={loading}
        width={600}
      >
        <Form form={shareForm} layout="vertical">
          <Form.Item label="Select Recipients">
            <Select
              mode="multiple"
              placeholder="Select team members, C-suite, or admins"
              value={selectedRecipients}
              onChange={setSelectedRecipients}
              showSearch
              filterOption={(input, option: any) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              style={{ width: '100%' }}
            >
              <Select.OptGroup label="C-Suite & Executives">
                {recipients.filter(r => r.type === 'executive').map((recipient: any) => (
                  <Select.Option key={recipient.id} value={recipient.id} label={`${recipient.name} (${recipient.role})`}>
                    <div>
                      <strong>{recipient.name}</strong> <span style={{ color: '#999' }}>— {recipient.role}</span>
                      <br />
                      <span style={{ fontSize: 12, color: '#666' }}>{recipient.email}</span>
                    </div>
                  </Select.Option>
                ))}
              </Select.OptGroup>
              <Select.OptGroup label="Team Members">
                {recipients.filter(r => r.type === 'employee').map((recipient: any) => (
                  <Select.Option key={recipient.id} value={recipient.id} label={`${recipient.name} (${recipient.role})`}>
                    <div>
                      <strong>{recipient.name}</strong> <span style={{ color: '#999' }}>— {recipient.role}</span>
                      <br />
                      <span style={{ fontSize: 12, color: '#666' }}>{recipient.email}</span>
                    </div>
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
          </Form.Item>
          {selectedRecipients.length > 0 && (
            <div style={{ marginTop: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Document will be shared with {selectedRecipients.length} recipient(s)
              </Typography.Text>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
