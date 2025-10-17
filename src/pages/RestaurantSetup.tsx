import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import InsightsDashboard from "@/components/restaurant/dashboard/InsightsDashboard";
import CustomersDashboard from "@/components/restaurant/dashboard/CustomersDashboard";
import MenuDashboard from "@/components/restaurant/dashboard/MenuDashboard";
import FinancialsDashboard from "@/components/restaurant/dashboard/FinancialsDashboard";
import SettingsDashboard from "@/components/restaurant/dashboard/SettingsDashboard";
import CommercePlatformDashboard from "@/components/restaurant/dashboard/CommercePlatformDashboard";
import ReportsDashboard from "@/components/restaurant/dashboard/insights/ReportsDashboard";
import { 
  Home, 
  TrendingUp, 
  FileText, 
  Users, 
  Package, 
  Menu as MenuIcon, 
  Calendar, 
  DollarSign, 
  Settings, 
  ChevronDown,
  CheckCircle2,
  Tablet,
  Store,
  ChevronUp,
  Plus,
  HelpCircle,
  MessageCircle,
  Mail
} from "lucide-react";

const RestaurantSetup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'reports' | 'customers' | 'menu' | 'financials' | 'settings' | 'commerce'>('home');
  const [prepareStoreExpanded, setPrepareStoreExpanded] = useState(true);
  const restaurantName = "Craven Inc";
  const userName = "Torrance";
  const deadline = "Mon, Oct 27";

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
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
                <div className="font-semibold text-sm">{restaurantName}</div>
                <div className="text-xs text-muted-foreground">Store</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'home' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'insights' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Insights</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'reports' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Reports</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'customers' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Customers</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
              <Package className="w-5 h-5" />
              <span className="text-sm font-medium">Orders</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('menu')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'menu' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <MenuIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Menu</span>
            </button>
            
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Store availability</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('financials')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'financials' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-sm font-medium">Financials</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'settings' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="px-3 py-2 text-xs text-muted-foreground font-medium">
              Channels
            </div>
            
            <button 
              onClick={() => setActiveTab('commerce')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${
                activeTab === 'commerce' 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              <Store className="w-5 h-5" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Commerce Platform</div>
                <span className="text-xs text-green-600 font-medium">New</span>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/restaurant/request-delivery')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground"
            >
              <Tablet className="w-5 h-5" />
              <span className="text-sm font-medium">Request a delivery</span>
            </button>
          </div>

          <div className="mt-4">
            <button 
              onClick={() => navigate('/restaurant/solutions')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-foreground"
            >
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
        {activeTab === 'home' ? (
        <div className="max-w-5xl mx-auto p-8">
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-2">Welcome, {userName}</p>
            <h1 className="text-3xl font-bold mb-2">Set up your store</h1>
            <p className="text-sm text-muted-foreground">
              Complete these steps to go live with your store by <span className="font-medium text-foreground">{deadline}</span>.
            </p>
          </div>

          {/* Prepare your store section */}
          <Card className="p-6 mb-6">
            <button
              onClick={() => setPrepareStoreExpanded(!prepareStoreExpanded)}
              className="w-full flex items-center justify-between mb-4"
            >
              <div>
                <h2 className="text-xl font-semibold text-left mb-1">Prepare your store</h2>
                <p className="text-sm text-muted-foreground text-left">
                  Review other steps before your store goes live.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">0 of 3 steps</span>
                {prepareStoreExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {prepareStoreExpanded && (
              <div className="space-y-4 mt-6">
                {/* Business info verified */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Your business info was verified</h3>
                      <p className="text-sm text-muted-foreground">
                        We've reviewed and verified your business info. No further action is needed.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Menu in progress */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                        <MenuIcon className="w-6 h-6 text-background" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">We're preparing your menu</h3>
                        <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
                          ✓ In progress
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        This usually takes 2 business days. You'll get an email when your menu is ready.
                      </p>
                      
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Add a store logo and header</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Stores with a logo and header image get up to 50% more monthly sales.
                        </p>
                        <Button variant="outline" size="sm">
                          Add a header and logo
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Tablet in transit */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                        <Tablet className="w-6 h-6 text-background" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">Your tablet is in transit</h3>
                        <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded">
                          ✓ In progress
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We'll keep you updated on its status.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
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
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    🔥 Not ready
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  We recommend going live by <span className="font-medium text-foreground">{deadline}</span>. If you need more time, you can reschedule this date.
                </p>
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
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    Add store or business
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
        ) : activeTab === 'insights' ? (
          <InsightsDashboard />
        ) : activeTab === 'reports' ? (
          <ReportsDashboard />
        ) : activeTab === 'customers' ? (
          <CustomersDashboard />
        ) : activeTab === 'menu' ? (
          <MenuDashboard />
        ) : activeTab === 'financials' ? (
          <FinancialsDashboard />
        ) : activeTab === 'settings' ? (
          <SettingsDashboard />
        ) : activeTab === 'commerce' ? (
          <CommercePlatformDashboard />
        ) : null}
      </main>

      {/* Right Sidebar - Store Preview */}
      <aside className="w-80 border-l bg-card p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Your store preview</h3>
          <p className="text-xs text-muted-foreground">
            For illustrative purposes only.{" "}
            <button className="text-primary hover:underline">View on Crave'N</button>
          </p>
        </div>

        {/* Phone Preview */}
        <div className="bg-gray-100 rounded-lg p-4 h-[600px] overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg h-full">
            {/* Phone Header */}
            <div className="relative h-32 bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Header</p>
              <button className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Logo */}
            <div className="px-4 -mt-8 mb-4">
              <div className="w-20 h-20 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center relative">
                <p className="text-xs text-muted-foreground">Logo</p>
                <button className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow border">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Store Name */}
            <div className="px-4">
              <h4 className="font-semibold text-lg">{restaurantName}</h4>
            </div>

            {/* Menu Items Placeholder */}
            <div className="px-4 mt-6 space-y-4">
              <div className="h-24 bg-gray-100 rounded"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>

        {/* Help Button */}
        <div className="fixed bottom-6 right-6">
          <button className="w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center">
            <div className="relative">
              <MessageCircle className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          </button>
          <div className="mt-2 text-center">
            <p className="text-xs font-medium">Need help?</p>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default RestaurantSetup;
