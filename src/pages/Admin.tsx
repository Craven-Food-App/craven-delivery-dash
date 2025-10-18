import React, { useState } from 'react';
import AdminAccessGuard from '@/components/AdminAccessGuard';
import ApplicationReview from '@/components/admin/ApplicationReview';
import OnboardingDashboard from '@/components/admin/OnboardingDashboard';
import LiveDashboard from '@/components/admin/LiveDashboard';
import ChatPortal from '@/components/admin/ChatPortal';
import BackgroundCheckDashboard from '@/components/admin/BackgroundCheckDashboard';
import RestaurantOnboardingDashboard from '@/components/admin/RestaurantOnboardingDashboard';
import { RestaurantVerificationDashboard } from '@/components/admin/RestaurantVerificationDashboard';
import { NotificationSettingsManager } from '@/components/admin/NotificationSettingsManager';
import { PayoutSettingsManager } from '@/components/admin/PayoutSettingsManager';
import CommissionSettingsManager from '@/components/admin/CommissionSettingsManager';
import { PromoCodeManager } from '@/components/admin/PromoCodeManager';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, BarChart3, Users, Store, Car, ShoppingBag, MessageCircle, Bell, DollarSign, Tags, GraduationCap, FileCheck, Shield, ChevronRight } from 'lucide-react';
import cravenLogo from "@/assets/craven-logo.png";
import { cn } from '@/lib/utils';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedSection, setExpandedSection] = useState<string | null>('merchants');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const navSections = [
    {
      id: 'merchants',
      title: 'Merchants',
      icon: Store,
      items: [
        { id: 'merchant-onboarding', label: 'Onboarding', icon: GraduationCap },
        { id: 'merchant-verification', label: 'Document Verification', icon: FileCheck },
        { id: 'merchant-settings', label: 'Settings', icon: Shield },
      ]
    },
    {
      id: 'drivers',
      title: 'Drivers (Feeders)',
      icon: Car,
      items: [
        { id: 'driver-applications', label: 'Applications', icon: Users },
        { id: 'driver-background', label: 'Background Checks', icon: FileCheck },
        { id: 'driver-onboarding', label: 'Onboarding', icon: GraduationCap },
        { id: 'driver-payouts', label: 'Payouts', icon: DollarSign },
      ]
    },
    {
      id: 'customers',
      title: 'Customers (Cravers)',
      icon: ShoppingBag,
      items: [
        { id: 'customer-promo', label: 'Promo Codes', icon: Tags },
        { id: 'customer-support', label: 'Support Chat', icon: MessageCircle },
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <LiveDashboard />;
      case 'merchant-onboarding':
        return <RestaurantOnboardingDashboard />;
      case 'merchant-verification':
        return <RestaurantVerificationDashboard />;
      case 'merchant-settings':
        return <CommissionSettingsManager />;
      case 'driver-applications':
        return <ApplicationReview />;
      case 'driver-background':
        return <BackgroundCheckDashboard />;
      case 'driver-onboarding':
        return <OnboardingDashboard />;
      case 'driver-payouts':
        return <PayoutSettingsManager />;
      case 'customer-promo':
        return <PromoCodeManager />;
      case 'customer-support':
        return <ChatPortal />;
      case 'notifications':
        return <NotificationSettingsManager />;
      default:
        return <LiveDashboard />;
    }
  };

  return (
    <AdminAccessGuard>
      <div className="flex h-screen w-full bg-background">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-4">
              <img src={cravenLogo} alt="Crave'n" className="h-6" />
              <span className="font-bold">Admin Portal</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = '/'}
              className="w-full justify-start"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to App
            </Button>
          </div>

          <ScrollArea className="flex-1 px-3">
            <div className="space-y-4 py-4">
              {/* Dashboard */}
              <Button
                variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              {/* Settings */}
              <Button
                variant={activeTab === 'notifications' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('notifications')}
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>

              <div className="pt-4 pb-2">
                <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Channels
                </h3>
              </div>

              {/* Navigation Sections */}
              {navSections.map((section) => (
                <div key={section.id} className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center">
                      <section.icon className="h-4 w-4 mr-2" />
                      <span>{section.title}</span>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedSection === section.id && "rotate-90"
                      )}
                    />
                  </Button>

                  {expandedSection === section.id && (
                    <div className="ml-4 space-y-1">
                      {section.items.map((item) => (
                        <Button
                          key={item.id}
                          variant={activeTab === item.id ? 'secondary' : 'ghost'}
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setActiveTab(item.id)}
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </AdminAccessGuard>
  );
};

export default Admin;