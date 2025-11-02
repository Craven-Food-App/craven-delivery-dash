import React, { useState } from 'react';
import { MarketingAccessGuard } from '@/components/MarketingAccessGuard';
import { PromoCodeManager } from '@/components/admin/PromoCodeManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, LayoutDashboard, Tag, Mail, Bell, Users, PieChart, TrendingUp, BarChart, Gift, UserPlus, Award, Calendar, Image, Share2, FileText, Megaphone, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MarketingPortal: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedSection, setExpandedSection] = useState<string | null>('campaigns');

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
        { id: 'campaign-builder', label: 'Create Campaign', icon: ShoppingBag },
      ]
    },
    {
      id: 'customers',
      title: 'Customer Insights',
      icon: Users,
      items: [
        { id: 'customer-segments', label: 'Segmentation', icon: PieChart },
        { id: 'customer-analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'cohort-analysis', label: 'Cohort Analysis', icon: BarChart },
      ]
    },
    {
      id: 'promotions',
      title: 'Promotions',
      icon: Gift,
      items: [
        { id: 'referral-program', label: 'Referral Program', icon: UserPlus },
        { id: 'loyalty-program', label: 'Loyalty Program', icon: Award },
        { id: 'event-campaigns', label: 'Event Campaigns', icon: Calendar },
      ]
    },
    {
      id: 'content',
      title: 'Content',
      icon: FileText,
      items: [
        { id: 'banner-manager', label: 'Banner Manager', icon: Image },
        { id: 'social-media', label: 'Social Media', icon: Share2 },
        { id: 'blog-manager', label: 'Blog/Content', icon: FileText },
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
        { id: 'acquisition-cost', label: 'CAC Analysis', icon: BarChart },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'marketing-dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Megaphone className="h-8 w-8 text-orange-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Reach</p>
                    <p className="text-2xl font-bold">1.2M</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">ROI</p>
                    <p className="text-2xl font-bold">320%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Spend (MTD)</p>
                    <p className="text-2xl font-bold">$45K</p>
                  </div>
                  <BarChart className="h-8 w-8 text-purple-500" />
                </div>
              </Card>
            </div>
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Marketing Overview</h3>
              <p className="text-gray-600">Marketing dashboard analytics and insights will appear here.</p>
            </Card>
          </div>
        );
      case 'promo-codes':
        return <PromoCodeManager />;
      case 'email-campaigns':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Email Campaigns</h2>
            <p className="text-gray-600">Email campaign management coming soon.</p>
          </Card>
        );
      case 'push-notifications':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Push Notifications</h2>
            <p className="text-gray-600">Push notification management coming soon.</p>
          </Card>
        );
      case 'customer-segments':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Segmentation</h2>
            <p className="text-gray-600">Customer segmentation tools coming soon.</p>
          </Card>
        );
      case 'customer-analytics':
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Analytics</h2>
            <p className="text-gray-600">Customer analytics dashboard coming soon.</p>
          </Card>
        );
      default:
        return (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">{activeTab}</h2>
            <p className="text-gray-600">This feature is coming soon.</p>
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

