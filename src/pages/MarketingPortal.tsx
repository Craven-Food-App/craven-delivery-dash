import React, { useState, useEffect } from 'react';
import { MarketingAccessGuard } from '@/components/MarketingAccessGuard';
import { PromoCodeManager } from '@/components/admin/PromoCodeManager';
import { CustomerManagement } from '@/components/admin/CustomerManagement';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { ReferralProgram } from '@/components/ReferralProgram';
import { LoyaltyDashboard } from '@/components/loyalty/LoyaltyDashboard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, LayoutDashboard, Tag, Mail, Bell, Users, TrendingUp, BarChart, Gift, UserPlus, Award, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const MarketingPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedSection, setExpandedSection] = useState<string | null>('campaigns');
  const [userId, setUserId] = useState<string | null>(null);
  const [marketingMetrics, setMarketingMetrics] = useState({
    activeCampaigns: 0,
    totalReach: 0,
    roi: 0,
    monthlySpend: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
    fetchMarketingMetrics();
  }, []);

  const fetchMarketingMetrics = async () => {
    try {
      // Get active promo codes
      const { data: promoCodes } = await supabase
        .from('promo_codes')
        .select('id, usage_count')
        .eq('is_active', true);

      // Get total customers
      const { count: customerCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Get referral stats
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });

      // Get promo code usage
      const totalUsage = promoCodes?.reduce((sum, pc) => sum + (pc.usage_count || 0), 0) || 0;

      // Calculate ROI estimate (would need actual spend tracking)
      const revenueFromPromos = totalUsage * 1500; // Estimate $15 avg order
      const promoSpend = totalUsage * 500; // Estimate $5 avg discount
      const calculatedROI = promoSpend > 0 ? Math.round((revenueFromPromos / promoSpend) * 100) : 0;

      setMarketingMetrics({
        activeCampaigns: promoCodes?.length || 0,
        totalReach: customerCount || 0,
        roi: calculatedROI,
        monthlySpend: promoSpend
      });
    } catch (error) {
      console.error('Error fetching marketing metrics:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const navSections = [
    {
      id: 'campaigns',
      title: 'Campaigns',
      icon: Megaphone,
      items: [
        { id: 'campaign-dashboard', label: 'All Campaigns', icon: LayoutDashboard },
        { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
        { id: 'email-campaigns', label: 'Email Campaigns', icon: Mail },
        { id: 'push-notifications', label: 'Push Notifications', icon: Bell },
      ]
    },
    {
      id: 'customers',
      title: 'Customer Insights',
      icon: Users,
      items: [
        { id: 'customer-management', label: 'Customer Management', icon: Users },
        { id: 'customer-analytics', label: 'Analytics', icon: TrendingUp },
      ]
    },
    {
      id: 'promotions',
      title: 'Promotions',
      icon: Gift,
      items: [
        { id: 'referral-program', label: 'Referral Program', icon: UserPlus },
        { id: 'loyalty-program', label: 'Loyalty Program', icon: Award },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: BarChart,
      items: [
        { id: 'marketing-dashboard', label: 'Marketing Dashboard', icon: LayoutDashboard },
        { id: 'roi-tracking', label: 'ROI & Spend', icon: TrendingUp },
        { id: 'conversion-funnel', label: 'Conversion Funnel', icon: TrendingUp },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'campaign-dashboard':
      case 'marketing-dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold">{marketingMetrics.activeCampaigns}</p>
                  </div>
                  <Megaphone className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reach</p>
                    <p className="text-2xl font-bold">{marketingMetrics.totalReach.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ROI</p>
                    <p className="text-2xl font-bold">{marketingMetrics.roi}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Spend (MTD)</p>
                    <p className="text-2xl font-bold">${(marketingMetrics.monthlySpend / 100).toLocaleString()}</p>
                  </div>
                  <BarChart className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Marketing Overview</h3>
              <p className="text-gray-600">Use the navigation menu to access campaign management, customer insights, and analytics.</p>
            </Card>
          </div>
        );
      case 'promo-codes':
        return <PromoCodeManager />;
      case 'customer-management':
        return <CustomerManagement />;
      case 'customer-analytics':
        return <AnalyticsDashboard />;
      case 'referral-program':
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Referral Program Management</h2>
              <ReferralProgram userType="customer" />
            </Card>
          </div>
        );
      case 'loyalty-program':
        return (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Loyalty Program</h2>
              {userId && <LoyaltyDashboard userId={userId} />}
              {!userId && <p className="text-gray-600">Loading...</p>}
            </Card>
          </div>
        );
      case 'email-campaigns':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Email Campaigns</h2>
            <p className="text-gray-600 mb-4">Email campaign functionality is available through Supabase Edge Functions.</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Available functions: send-customer-welcome-email, send-approval-email</p>
              <p>• Email templates can be managed via Supabase dashboard</p>
              <p>• Integration with Resend email service</p>
            </div>
          </Card>
        );
      case 'push-notifications':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
            <p className="text-gray-600 mb-4">Push notification system is operational via Supabase Edge Function.</p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Function: send-push-notification</p>
              <p>• Supports iOS PWA push notifications (iOS 16.4+)</p>
              <p>• Supports web push notifications</p>
              <p>• Firebase Cloud Messaging integration</p>
            </div>
          </Card>
        );
      case 'roi-tracking':
      case 'conversion-funnel':
        return <AnalyticsDashboard />;
      default:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Marketing Portal</h2>
            <p className="text-gray-600">Navigate using the menu to access marketing features.</p>
          </Card>
        );
    }
  };

  return (
    <MarketingAccessGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-bold">Marketing Portal</h1>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {navSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="space-y-1">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{section.title}</span>
                        </div>
                      </button>
                      {expandedSection === section.id && (
                        <div className="ml-6 space-y-1">
                          {section.items.map((item) => {
                            const ItemIcon = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                                  activeTab === item.id
                                    ? 'bg-orange-100 text-orange-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                <ItemIcon className="h-4 w-4" />
                                <span>{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </MarketingAccessGuard>
  );
};

export default MarketingPortal;

