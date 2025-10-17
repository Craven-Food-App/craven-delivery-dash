import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRestaurantData } from "@/hooks/useRestaurantData";
import { useRestaurantOnboarding } from "@/hooks/useRestaurantOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import InsightsDashboard from "@/components/restaurant/dashboard/InsightsDashboard";
import CustomersDashboard from "@/components/restaurant/dashboard/CustomersDashboard";
import MenuDashboard from "@/components/restaurant/dashboard/MenuDashboard";
import FinancialsDashboard from "@/components/restaurant/dashboard/FinancialsDashboard";
import SettingsDashboard from "@/components/restaurant/dashboard/SettingsDashboard";
import CommercePlatformDashboard from "@/components/restaurant/dashboard/CommercePlatformDashboard";
import ReportsDashboard from "@/components/restaurant/dashboard/insights/ReportsDashboard";
import OrdersDashboard from "@/components/restaurant/dashboard/OrdersDashboard";
import StoreAvailabilityDashboard from "@/components/restaurant/dashboard/StoreAvailabilityDashboard";
import RequestDeliveryDashboard from "@/components/restaurant/dashboard/RequestDeliveryDashboard";
import { Home, TrendingUp, FileText, Users, Package, Menu as MenuIcon, Calendar, DollarSign, Settings, ChevronDown, CheckCircle2, Tablet, Store, ChevronUp, Plus, HelpCircle, MessageCircle, Mail, Clock, CheckCircle } from "lucide-react";
const RestaurantSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'reports' | 'customers' | 'orders' | 'menu' | 'availability' | 'financials' | 'settings' | 'commerce' | 'request-delivery'>('home');
  const [prepareStoreExpanded, setPrepareStoreExpanded] = useState(true);
  const [userName, setUserName] = useState("User");
  
  const { restaurant, loading: restaurantLoading } = useRestaurantData();
  const { progress, readiness, loading: onboardingLoading, refreshData } = useRestaurantOnboarding(restaurant?.id);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(' ')[0]);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleCreateAdditionalLocation = async () => {
    if (!restaurant) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-additional-location', {
        body: {
          parent_restaurant_id: restaurant.id,
          location_data: {
            name: `${restaurant.name} - New Location`,
            address: "",
            city: "",
            state: "",
            zip_code: ""
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "New location created successfully"
      });

      navigate('/restaurant/onboarding');
    } catch (error) {
      console.error('Error creating location:', error);
      toast({
        title: "Error",
        description: "Failed to create new location",
        variant: "destructive"
      });
    }
  };

  const completedSteps = [
    progress?.business_info_verified,
    progress?.menu_preparation_status === 'ready',
    progress?.tablet_shipped
  ].filter(Boolean).length;

  const deadline = restaurant?.setup_deadline 
    ? format(new Date(restaurant.setup_deadline), 'EEE, MMM d')
    : readiness?.estimated_go_live 
      ? format(new Date(readiness.estimated_go_live), 'EEE, MMM d')
      : "Not set";

  if (restaurantLoading || onboardingLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-2">No Restaurant Found</h2>
          <p className="text-muted-foreground mb-4">Please complete restaurant onboarding first.</p>
          <Button onClick={() => navigate('/restaurant/register')}>
            Start Onboarding
          </Button>
        </Card>
      </div>
    );
  }
  return <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
              <div className="flex items-center gap-2">
                <img 
                  src="/merchant-logo.png" 
                  alt="Crave'N" 
                  className="h-6 w-auto"
                />
                <span className="font-semibold text-lg">Merchant</span>
              </div>
        </div>

        {/* Restaurant Selector */}
        <div className="p-4 border-b">
          <button className="w-full flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">{restaurant.name}</div>
                <div className="text-xs text-muted-foreground">Store</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            <button onClick={() => setActiveTab('home')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'home' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </button>
            
            <button onClick={() => setActiveTab('insights')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'insights' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Insights</span>
            </button>
            
            <button onClick={() => setActiveTab('reports')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'reports' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Reports</span>
            </button>
            
            <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'customers' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Customers</span>
            </button>
            
            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'orders' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Orders</span>
            </button>
            
            <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'menu' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <MenuIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Menu</span>
            </button>
            
            <button onClick={() => setActiveTab('availability')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'availability' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Store availability</span>
            </button>
            
            <button onClick={() => setActiveTab('financials')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'financials' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Financials</span>
            </button>
            
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'settings' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
              Channels
            </div>
            
            <button onClick={() => setActiveTab('commerce')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${activeTab === 'commerce' ? 'bg-orange-50 text-orange-600' : 'hover:bg-muted text-foreground'}`}>
              <Store className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Commerce Platform</div>
                <span className="text-xs text-green-600 font-medium">New</span>
              </div>
            </button>
            
            <button onClick={() => setActiveTab('request-delivery')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
              <Tablet className="w-5 h-5" />
              <span className="text-sm font-medium">Request a delivery</span>
            </button>
          </div>

          <div className="mt-4">
            <button onClick={() => navigate('/restaurant/solutions')} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">Add solutions</span>
            </button>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t">
          <button className="w-full flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-medium">T</span>
            </div>
            <span className="text-sm font-medium">{userName} Stroman</span>
            <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' ? <div className="max-w-5xl mx-auto p-8">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Welcome, {userName}</p>
            <h1 className="text-3xl font-bold mb-2">Set up your store</h1>
            <p className="text-sm text-muted-foreground">
              Complete these steps to go live with your store by <span className="font-medium text-foreground">{deadline}</span>.
            </p>
          </div>

          {/* Prepare your store section */}
          <Card className="p-6 mb-6">
            <button onClick={() => setPrepareStoreExpanded(!prepareStoreExpanded)} className="w-full flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-left mb-1">Prepare your store</h2>
                <p className="text-sm text-muted-foreground text-left">
                  Review other steps before your store goes live.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">0 of 3 steps</span>
                {prepareStoreExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {prepareStoreExpanded && <div className="space-y-4 mt-6">
                {/* Business info verified */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        progress?.business_info_verified ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        {progress?.business_info_verified ? (
                          <div className="relative">
                            <Clock className="w-6 h-6 text-white" />
                            <CheckCircle className="w-4 h-4 text-white absolute -bottom-1 -right-1 bg-green-500 rounded-full" />
                          </div>
                        ) : (
                          <Clock className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">
                        {progress?.business_info_verified 
                          ? 'Your business info was verified' 
                          : 'Business verification pending'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {progress?.business_info_verified
                          ? "We've reviewed and verified your business info. No further action is needed."
                          : "Our team is reviewing your business documents. This usually takes 1-2 business days."}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Menu preparation */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        progress?.menu_preparation_status === 'ready' 
                          ? 'bg-green-500' 
                          : progress?.menu_preparation_status === 'in_progress'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                      }`}>
                        {progress?.menu_preparation_status === 'ready' ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Clock className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {progress?.menu_preparation_status === 'ready' 
                            ? 'Your menu is ready' 
                            : progress?.menu_preparation_status === 'in_progress'
                              ? "We're preparing your menu"
                              : 'Menu preparation not started'}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          progress?.menu_preparation_status === 'ready'
                            ? 'text-green-600 bg-green-50'
                            : progress?.menu_preparation_status === 'in_progress'
                              ? 'text-yellow-600 bg-yellow-50'
                              : 'text-red-600 bg-red-50'
                        }`}>
                          {progress?.menu_preparation_status === 'ready' 
                            ? 'Complete' 
                            : progress?.menu_preparation_status === 'in_progress'
                              ? 'In progress'
                              : 'Not started'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {progress?.menu_preparation_status === 'ready'
                          ? "Your menu has been prepared and is ready to go live."
                          : "This usually takes 2 business days. You'll get an email when your menu is ready."}
                      </p>
                      
                      {!readiness?.details?.has_logo || !readiness?.details?.has_header ? (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-sm mb-2">Add a store logo and header</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Stores with a logo and header image get up to 50% more monthly sales.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setActiveTab('settings')}
                          >
                            Add a header and logo
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </Card>

                {/* Tablet status */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        progress?.tablet_delivered_at ? 'bg-green-500' : progress?.tablet_shipped ? 'bg-foreground' : 'bg-muted'
                      }`}>
                        <Tablet className={`w-6 h-6 ${
                          progress?.tablet_delivered_at || progress?.tablet_shipped ? 'text-white' : 'text-muted-foreground'
                        }`} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {progress?.tablet_delivered_at
                            ? 'Your tablet has been delivered'
                            : progress?.tablet_shipped
                              ? 'Your tablet is in transit'
                              : 'Tablet not yet shipped'}
                        </h3>
                        {progress?.tablet_shipped && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            progress?.tablet_delivered_at
                              ? 'text-green-600 bg-green-50'
                              : 'text-teal-600 bg-teal-50'
                          }`}>
                            {progress?.tablet_delivered_at ? '✓ Delivered' : '✓ In transit'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {progress?.tablet_delivered_at
                          ? "Your tablet has been delivered and is ready to use."
                          : progress?.tablet_shipped
                            ? "We'll keep you updated on its status."
                            : "Your tablet will ship once business verification is complete."}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>}
          </Card>

          {/* Go live section */}
          <Card className="p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16">
                  <Store className="w-16 h-16 text-orange-500" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">Go live with your store</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    readiness?.ready
                      ? 'text-green-600 bg-green-50'
                      : 'text-orange-600 bg-orange-50'
                  }`}>
                    {readiness?.ready ? '✓ Ready' : '🔥 Not ready'}
                  </span>
                  {readiness && (
                    <span className="text-xs font-medium text-muted-foreground">
                      Readiness: {readiness.score}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {readiness?.ready
                    ? `You're ready to go live! Your estimated launch date is ${deadline}.`
                    : `We recommend going live by ${deadline}. Complete the items below to go live.`}
                </p>
                {readiness && readiness.blockers.length > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-semibold text-orange-900 mb-1">Required to go live:</p>
                    <ul className="text-sm text-orange-800 space-y-1">
                      {readiness.blockers.map((blocker, idx) => (
                        <li key={idx}>• {blocker}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {readiness && readiness.missing_items.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Recommended items:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      {readiness.missing_items.slice(0, 3).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Continue Crave'N setup */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Continue your Crave'N setup</h2>
            <p className="text-sm text-muted-foreground mb-4">
              While our team is preparing your Marketplace store, continue your Crave'N setup to maximize sales.
            </p>

            <Card className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16">
                    <div className="relative">
                      <div className="w-full h-full rounded-full bg-orange-100 flex items-center justify-center">
                        <Store className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Add another store or a new business</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We noticed you signed up for more than one store location. Continue setting up your business on Crave'N by adding another store or business now.
                  </p>
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleCreateAdditionalLocation}
                  >
                    Add store or business
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div> : activeTab === 'insights' ? <InsightsDashboard /> : activeTab === 'reports' ? <ReportsDashboard /> : activeTab === 'customers' ? <CustomersDashboard /> : activeTab === 'orders' ? <OrdersDashboard /> : activeTab === 'menu' ? <MenuDashboard /> : activeTab === 'availability' ? <StoreAvailabilityDashboard /> : activeTab === 'financials' ? <FinancialsDashboard /> : activeTab === 'settings' ? <SettingsDashboard /> : activeTab === 'commerce' ? <CommercePlatformDashboard /> : activeTab === 'request-delivery' ? <RequestDeliveryDashboard /> : null}
      </main>

      {/* Right Sidebar - Store Preview */}
      
    </div>;
};
export default RestaurantSetup;