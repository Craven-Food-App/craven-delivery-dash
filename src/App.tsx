import React, { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import Index from "./pages/Index";
import DriverAuth from "./pages/DriverAuth";
import FeederHub from "./pages/FeederHub";
import OnboardingWizard from "./components/onboarding/OnboardingWizard";
import OnboardingGuard from "./components/onboarding/OnboardingGuard";
import CustomerDashboard from "./pages/CustomerDashboard";
import { MobileDriverDashboard } from "./components/mobile/MobileDriverDashboard";
import MobileBackgroundCheckStatus from "./components/mobile/MobileBackgroundCheckStatus";
import AccessGuard from "./components/AccessGuard";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import RestaurantRegister from "./pages/RestaurantRegister";
import MerchantPortal from "./pages/MerchantPortal";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantAuth from "./pages/RestaurantAuth";
import RequestDelivery from "./pages/RequestDelivery";
import SolutionsCenter from "./pages/SolutionsCenter";
import MostLovedProgram from "./pages/MostLovedProgram";
import RestaurantDetail from "./pages/RestaurantDetail";
import RestaurantMenuPage from "./components/restaurant/RestaurantMenuPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import NotFound from "./pages/NotFound";
import Restaurants from "./pages/Restaurants";
import HelpCenter from "./pages/HelpCenter";
import Safety from "./pages/Safety";
import ContactUs from "./pages/ContactUs";
import PartnerWithUs from "./pages/PartnerWithUs";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import Testing from "./pages/Testing";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiePolicy from "./pages/CookiePolicy";
import CraveMore from "./pages/CraveMore";
import ChatButton from "./components/chat/ChatButton";
import { ThemeProvider } from "./components/ThemeProvider";
import SuspenseLoader from "./components/SuspenseLoader";

// Lazy load guide pages
const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const RestaurantGuide = lazy(() => import("./pages/RestaurantGuide"));
const DriverGuide = lazy(() => import("./pages/DriverGuide"));

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if running on native mobile (iOS/Android)
  const isNative = Capacitor.isNativePlatform();

  // If running on native platform, show only mobile dashboard
  if (isNative) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessGuard fallback={
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
              <h1 className="text-2xl font-bold mb-4">Feeder Access Required</h1>
              <p className="text-muted-foreground text-center mb-4">
                You need an approved Feeder application to access the mobile portal.
              </p>
            </div>
          }>
            <MobileDriverDashboard />
          </AccessGuard>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Web version with full routing
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/crave-more" element={<CraveMore />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/driver/auth" element={<DriverAuth />} />
          <Route path="/feeder" element={<FeederHub />} />
          <Route path="/onboarding" element={
            <OnboardingGuard>
              <OnboardingWizard />
            </OnboardingGuard>
          } />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/mobile" element={<MobileDriverDashboard />} />
          <Route path="/mobile/background-check-status" element={<MobileBackgroundCheckStatus />} />
          <Route path="/restaurant/auth" element={<RestaurantAuth />} />
          <Route path="/restaurant/register" element={<RestaurantRegister />} />
          <Route path="/merchant-portal" element={<MerchantPortal />} />
          <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/restaurant/:id/menu" element={<RestaurantMenuPage />} />
          <Route path="/restaurant/request-delivery" element={<RequestDelivery />} />
          <Route path="/restaurant/solutions" element={<SolutionsCenter />} />
          <Route path="/restaurant/most-loved" element={<MostLovedProgram />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-canceled" element={<PaymentCanceled />} />

          {/* Footer pages */}
          <Route path="/help" element={<HelpCenter />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/admin-guide" element={
              <Suspense fallback={<SuspenseLoader message="Loading Admin Guide" />}>
                <AdminGuide />
              </Suspense>
            } />
            <Route path="/restaurant-guide" element={
              <Suspense fallback={<SuspenseLoader message="Loading Restaurant Guide" />}>
                <RestaurantGuide />
              </Suspense>
            } />
            <Route path="/driver-guide" element={
              <Suspense fallback={<SuspenseLoader message="Loading Driver Guide" />}>
                <DriverGuide />
              </Suspense>
            } />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/partner" element={<PartnerWithUs />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/testing" element={<Testing />} />
          
          {/* Legal pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Desktop Floating Chat Button */}
        <div className="fixed bottom-6 right-6 z-50 hidden md:block">
          <ChatButton
            type="customer_support"
            userType="customer"
            variant="default"
            size="lg"
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
          >
            <span className="sr-only">Chat Support</span>
          </ChatButton>
        </div>

        {/* Global Mobile Bottom Navigation - Hide on driver routes */}
        {!window.location.pathname.startsWith('/mobile') && <MobileBottomNav user={user} />}
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
