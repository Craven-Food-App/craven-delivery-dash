import React from 'react';
import AdminAccessGuard from '@/components/AdminAccessGuard';
import ApplicationReview from '@/components/admin/ApplicationReview';
import OnboardingDashboard from '@/components/admin/OnboardingDashboard';
import LiveDashboard from '@/components/admin/LiveDashboard';
import ChatPortal from '@/components/admin/ChatPortal';
import { NotificationSettingsManager } from '@/components/admin/NotificationSettingsManager';
import { PayoutSettingsManager } from '@/components/admin/PayoutSettingsManager';
import CommissionSettingsManager from '@/components/admin/CommissionSettingsManager';
import { PromoCodeManager } from '@/components/admin/PromoCodeManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, BarChart3, Users, MessageCircle, Bell, DollarSign, Tags, GraduationCap } from 'lucide-react';
import cravenLogo from "@/assets/craven-logo.png";

const Admin: React.FC = () => {
  return (
    <AdminAccessGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={cravenLogo} alt="Crave'n" className="h-6" />
                <div>
                  <h1 className="text-xl font-bold">Admin Portal</h1>
                  <p className="text-sm opacity-90">Corporate Administration Dashboard</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-8 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Live Dashboard
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payouts
              </TabsTrigger>
              <TabsTrigger value="commission" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Commission
              </TabsTrigger>
              <TabsTrigger value="promo-codes" className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Promo Codes
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Chat Support
              </TabsTrigger>
              <TabsTrigger value="applications" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Onboarding
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="space-y-4">
              <LiveDashboard />
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <NotificationSettingsManager />
            </TabsContent>
            
            <TabsContent value="payouts" className="space-y-4">
              <PayoutSettingsManager />
            </TabsContent>
            
            <TabsContent value="commission" className="space-y-4">
              <CommissionSettingsManager />
            </TabsContent>
            
            <TabsContent value="promo-codes" className="space-y-4">
              <PromoCodeManager />
            </TabsContent>
            
            <TabsContent value="chat" className="space-y-4">
              <ChatPortal />
            </TabsContent>
            
            <TabsContent value="applications" className="space-y-4">
              <ApplicationReview />
            </TabsContent>
            
            <TabsContent value="onboarding" className="space-y-4">
              <OnboardingDashboard />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AdminAccessGuard>
  );
};

export default Admin;