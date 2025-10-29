import React, { lazy, Suspense, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, Navigate, HashRouter } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import Index from "./pages/Index";
import DriverAuth from "./pages/DriverAuth";
import FeederHub from "./pages/FeederHub";
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
import Checkout from "./pages/Checkout";
import TrackOrder from "./pages/TrackOrder";
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
import { ErrorBoundary } from "./components/ErrorBoundary";
import { environment, validateEnvironmentConfig } from "./config/environment";
import { DownloadApp } from "./pages/DownloadApp";
import { InstallAppBanner } from "./components/InstallAppBanner";
import { EnhancedDriverOnboarding } from "./pages/EnhancedDriverOnboarding";
import { AdminDriverWaitlist } from "./pages/AdminDriverWaitlist";
import { ProfileCompletionForm } from "./components/onboarding/ProfileCompletionForm";
import { VehiclePhotosUpload } from "./components/onboarding/VehiclePhotosUpload";
import { PayoutSetup } from "./components/onboarding/PayoutSetup";
import { SafetyQuiz } from "./components/onboarding/SafetyQuiz";
import BoardPortal from "./pages/BoardPortal";
import CEOPortal from "./pages/CEOPortal";
import { DriverSignup } from "./pages/driverOnboarding/Signup";
import { LegalConsent } from "./pages/driverOnboarding/LegalConsent";
import { IdentityForm } from "./pages/driverOnboarding/IdentityForm";
import { BackgroundCheckPending } from "./pages/driverOnboarding/BackgroundCheckPending";
import { SignAgreement } from "./pages/driverOnboarding/SignAgreement";
import { WaitlistReveal } from "./pages/driverOnboarding/WaitlistReveal";
import { ActivationReady } from "./pages/driverOnboarding/ActivationReady";

// Lazy load guide pages
const AdminGuide = lazy(() => import("./pages/AdminGuide"));
const RestaurantGuide = lazy(() => import("./pages/RestaurantGuide"));
const DriverGuide = lazy(() => import("./pages/DriverGuide"));

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState(null);

  // Check if on feeder subdomain
  const isFeederSubdomain = typeof window !== 'undefined' && 
    (window.location.hostname === 'feeder.cravenusa.com' || 
     window.location.hostname === 'feed.cravenusa.com');

  // Check if on merchant subdomain
  const isMerchantSubdomain = typeof window !== 'undefined' && 
    window.location.hostname === 'merchant.cravenusa.com';

  // Check if on board subdomain
  const isBoardSubdomain = typeof window !== 'undefined' && 
    window.location.hostname === 'board.cravenusa.com';

  // Check if on CEO subdomain
  const isCEOSubdomain = typeof window !== 'undefined' && 
    window.location.hostname === 'ceo.cravenusa.com';

  useEffect(() => {
    // Validate environment configuration
    if (!validateEnvironmentConfig()) {
      console.error('Environment configuration validation failed');
    }

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

  // Helper to check if current route is driver-related
  const isDriverRoute = (path: string) => {
    return path.startsWith('/mobile') || 
           path.startsWith('/driver') || 
           path.startsWith('/enhanced-onboarding');
  };

  // Check if running on native mobile (iOS/Android)
  const isNative = Capacitor.isNativePlatform();

  // If running on native platform, show only mobile dashboard
  if (isNative) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/mobile" element={
                  <AccessGuard fallback={
                      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                        <div className="text-center max-w-md">
                          <div className="mb-6 text-6xl">
                            🚗
                          </div>
                          <h1 className="text-2xl font-bold mb-4">Feeder Access Required</h1>
                          <p className="text-muted-foreground text-center mb-6">
                            You need an approved Feeder application to access the mobile portal.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Please log in or apply to become a Feeder driver.
                          </p>
                        </div>
                      </div>
                  }>
                    <MobileDriverDashboard />
                  </AccessGuard>
                } />
                <Route path="*" element={<Navigate to="/mobile" replace />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  // If on feeder subdomain, show only feeder-related routes
  if (isFeederSubdomain) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Redirect root to new onboarding signup */}
                  <Route path="/" element={<Navigate to="/driver-onboarding/signup" replace />} />
                  
                  {/* New Driver Onboarding Flow */}
                  <Route path="/driver-onboarding/signup" element={<DriverSignup />} />
                  <Route path="/driver-onboarding/consent" element={<LegalConsent />} />
                  <Route path="/driver-onboarding/identity" element={<IdentityForm />} />
                  <Route path="/driver-onboarding/background-check" element={<BackgroundCheckPending />} />
                  <Route path="/driver-onboarding/sign-agreement" element={<SignAgreement />} />
                  <Route path="/driver-onboarding/waitlist" element={<WaitlistReveal />} />
                  <Route path="/driver-onboarding/activation" element={<ActivationReady />} />
                  
                  <Route path="/driver/auth" element={<DriverAuth />} />
                  <Route path="/enhanced-onboarding" element={<EnhancedDriverOnboarding />} />
                  <Route path="/enhanced-onboarding/profile" element={<ProfileCompletionForm />} />
                  <Route path="/enhanced-onboarding/vehicle-photos" element={<VehiclePhotosUpload />} />
                  <Route path="/enhanced-onboarding/payout" element={<PayoutSetup />} />
                  <Route path="/enhanced-onboarding/safety-quiz" element={<SafetyQuiz />} />
                  <Route path="/mobile" element={<MobileDriverDashboard />} />
                  <Route path="/mobile/background-check-status" element={<MobileBackgroundCheckStatus />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  // If on merchant subdomain, show only merchant-related routes
  if (isMerchantSubdomain) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<PartnerWithUs />} />
                  <Route path="/register" element={<RestaurantRegister />} />
                  <Route path="/auth" element={<RestaurantAuth />} />
                  <Route path="/dashboard" element={<RestaurantDashboard />} />
                  <Route path="/portal" element={<MerchantPortal />} />
                  <Route path="/solutions" element={<SolutionsCenter />} />
                  <Route path="/most-loved" element={<MostLovedProgram />} />
                  <Route path="/request-delivery" element={<RequestDelivery />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  // If on board subdomain, show only executive board portal
  if (isBoardSubdomain) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<BoardPortal />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  // If on CEO subdomain, show only CEO Command Center
  if (isCEOSubdomain) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider defaultTheme="system">
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<CEOPortal />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  // Web version with full routing
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            {/* iOS PWA Install Banner */}
            <InstallAppBanner />
            
            <Routes>
              <Route path="/" element={<Index />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/crave-more" element={<CraveMore />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/driver/auth" element={<DriverAuth />} />
          {/* Redirect old feeder link to new onboarding flow */}
          <Route path="/feeder" element={<Navigate to="/driver-onboarding/signup" replace />} />
          
          {/* New Driver Onboarding Flow with In-App Signature + Waitlist */}
          <Route path="/driver-onboarding/signup" element={<DriverSignup />} />
          <Route path="/driver-onboarding/consent" element={<LegalConsent />} />
          <Route path="/driver-onboarding/identity" element={<IdentityForm />} />
          <Route path="/driver-onboarding/background-check" element={<BackgroundCheckPending />} />
          <Route path="/driver-onboarding/sign-agreement" element={<SignAgreement />} />
          <Route path="/driver-onboarding/waitlist" element={<WaitlistReveal />} />
          <Route path="/driver-onboarding/activation" element={<ActivationReady />} />
          
          {/* Legacy Enhanced Onboarding */}
          <Route path="/enhanced-onboarding" element={<EnhancedDriverOnboarding />} />
          <Route path="/enhanced-onboarding/profile" element={<ProfileCompletionForm />} />
          <Route path="/enhanced-onboarding/vehicle-photos" element={<VehiclePhotosUpload />} />
          <Route path="/enhanced-onboarding/payout" element={<PayoutSetup />} />
          <Route path="/enhanced-onboarding/safety-quiz" element={<SafetyQuiz />} />
          <Route path="/admin/waitlist" element={<AdminDriverWaitlist />} />
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
          <Route path="/board" element={<BoardPortal />} />
          <Route path="/ceo" element={<CEOPortal />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/track-order/:orderId" element={<TrackOrder />} />
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
          
          {/* PWA Install page */}
          <Route path="/download" element={<DownloadApp />} />

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
        {!isDriverRoute(window.location.pathname) && <MobileBottomNav user={user} />}
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
