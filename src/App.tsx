import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DriverAuth from "./pages/DriverAuth";
import CraverHub from "./pages/CraverHub";
import CraverDashboard from "./pages/CraverDashboard";
import { MobileDriverDashboard } from "./components/mobile/MobileDriverDashboard";
import AccessGuard from "./components/AccessGuard";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import RestaurantRegister from "./pages/RestaurantRegister";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import RestaurantAuth from "./pages/RestaurantAuth";
import RestaurantDetail from "./pages/RestaurantDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/driver/auth" element={<DriverAuth />} />
          <Route path="/craver" element={<CraverHub />} />
          <Route path="/craver-dashboard" element={<CraverDashboard />} />
          <Route path="/craver/dashboard" element={<CraverDashboard />} />
          <Route path="/craver/mobile" element={
            <AccessGuard fallback={
              <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Driver Access Required</h1>
                <p className="text-muted-foreground text-center mb-4">
                  You need an approved Craver application to access the driver portal.
                </p>
                <a href="/driver/auth" className="text-primary hover:underline">
                  Apply to become a driver →
                </a>
              </div>
            }>
              <MobileDriverDashboard />
            </AccessGuard>
          } />
          <Route path="/driver/mobile" element={
            <AccessGuard fallback={
              <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Driver Access Required</h1>
                <p className="text-muted-foreground text-center mb-4">
                  You need an approved Craver application to access the driver portal.
                </p>
                <a href="/driver/auth" className="text-primary hover:underline">
                  Apply to become a driver →
                </a>
              </div>
            }>
              <MobileDriverDashboard />
            </AccessGuard>
          } />
          <Route path="/restaurant/auth" element={<RestaurantAuth />} />
          <Route path="/restaurant/register" element={<RestaurantRegister />} />
          <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
