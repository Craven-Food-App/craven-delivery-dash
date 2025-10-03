// src/App.tsx
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import Index from "./pages/Index";
import DriverAuth from "./pages/DriverAuth";
import CraverHub from "./pages/CraverHub";
import CustomerDashboard from "./pages/CustomerDashboard";
import { MobileDriverDashboard } from "./components/mobile/MobileDriverDashboard";
import AccessGuard from "./components/AccessGuard";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import RestaurantRegister from "./pages/RestaurantRegister";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantAuth from "./pages/RestaurantAuth";
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
import ChatButton from "@/components/chat/ChatButton";

// NEW: For Restaurants Page
import ForRestaurants from "./pages/ForRestaurants";

const queryClient = new QueryClient();

const App: React.FC = () => {
  const isNative = Capacitor.isNativePlatform();

  // Native Mobile view
  if (isNative) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AccessGuard
            fallback={
              <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Craver Access Required</h1>
                <p className="text-muted-foreground text-center mb-4">
                  You need an approved Craver application to access the mobile portal.
                </p>
              </div>
            }
          >
            <MobileDriverDashboard />
          </AccessGuard>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Web view
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/restaurants" element={<Restaurants />} />
            <Route path="/for-restaurants" element={<ForRestaurants />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/driver/auth" element={<DriverAuth />} />
            <Route path="/craver" element={<CraverHub />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} />

            {/* Mobile Dashboard (Guarded) */}
            <Route
              path="/mobile"
              element={
                <AccessGuard
                  fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                      <h1 className="text-2xl font-bold mb-4">Craver Access Required</h1>
                      <p className="text-muted-foreground text-center mb-4">
                        You need an approved Craver application to access the mobile portal.
                      </p>
                      <Link to="/craver" className="text-primary hover:underline">
                        Apply to become a Craver →
                      </Link>
                    </div>
                  }
                >
                  <MobileDriverDashboard />
                </AccessGuard>
              }
            />

            {/* Restaurant Routes */}
            <Route path="/restaurant/auth" element={<RestaurantAuth />} />
            <Route path="/restaurant/register" element={<RestaurantRegister />} />
            <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
            <Route path="/restaurant/:id" element={<RestaurantDetail />} />
            <Route path="/restaurant/:id/menu" element={<RestaurantMenuPage />} />

            {/* Admin */}
            <Route path="/admin" element={<Admin />} />

            {/* Payments */}
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-canceled" element={<PaymentCanceled />} />

            {/* Footer Pages */}
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/partner" element={<PartnerWithUs />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/testing" element={<Testing />} />

            {/* Catch-All */}
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

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
