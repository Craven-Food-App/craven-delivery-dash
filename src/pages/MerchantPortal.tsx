import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Menu,
  Stack,
  Group,
  Text,
  Title,
  Box,
  Loader,
  Badge,
  Avatar,
  Divider,
  ScrollArea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconHome,
  IconTrendingUp,
  IconFileText,
  IconUsers,
  IconPackage,
  IconMenu2,
  IconCalendar,
  IconCurrencyDollar,
  IconSettings,
  IconChevronDown,
  IconCheck,
  IconDeviceTablet,
  IconBuildingStore,
  IconChevronUp,
  IconPlus,
  IconHelpCircle,
  IconMessageCircle,
  IconMail,
  IconClock,
  IconCheckCircle,
} from "@tabler/icons-react";
import { useRestaurantSelector } from "@/hooks/useRestaurantSelector";
import { useRestaurantOnboarding } from "@/hooks/useRestaurantOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import InsightsDashboard from "@/components/restaurant/dashboard/InsightsDashboard";
import CustomersDashboard from "@/components/restaurant/dashboard/CustomersDashboard";
import MenuDashboard from "@/components/restaurant/dashboard/MenuDashboard"; // Renamed to avoid conflict with Mantine Menu
import FinancialsDashboard from "@/components/restaurant/dashboard/FinancialsDashboard";
import SettingsDashboard from "@/components/restaurant/dashboard/SettingsDashboard";
import CommercePlatformDashboard from "@/components/restaurant/dashboard/CommercePlatformDashboard";
import ReportsDashboard from "@/components/restaurant/dashboard/insights/ReportsDashboard";
import { RestaurantCustomerOrderManagement } from "@/components/restaurant/RestaurantCustomerOrderManagement";
import StoreAvailabilityDashboard from "@/components/restaurant/dashboard/StoreAvailabilityDashboard";
import RequestDeliveryDashboard from "@/components/restaurant/dashboard/RequestDeliveryDashboard";
import { HomeDashboard } from "@/components/merchant/HomeDashboard";
import MerchantWelcomeConfetti from "@/components/merchant/MerchantWelcomeConfetti";

const RestaurantSetup = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'insights' | 'reports' | 'customers' | 'orders' | 'menu' | 'availability' | 'financials' | 'settings' | 'commerce' | 'request-delivery'>('home');
  const [prepareStoreExpanded, setPrepareStoreExpanded] = useState(true);
  const [userName, setUserName] = useState("User");
  const [settingsTab, setSettingsTab] = useState<string>("account");
  const [showWelcomeConfetti, setShowWelcomeConfetti] = useState(false);
  
  const { restaurants, selectedRestaurant: restaurant, loading: restaurantLoading, selectRestaurant } = useRestaurantSelector();
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

  // Check for merchant welcome screen
  useEffect(() => {
    const checkWelcomeStatus = async () => {
      if (restaurant && (restaurant.merchant_welcome_shown === false || restaurant.merchant_welcome_shown === null)) {
        console.log('Showing welcome confetti for restaurant:', restaurant.name, 'merchant_welcome_shown:', restaurant.merchant_welcome_shown);
        setShowWelcomeConfetti(true);
      }
    };
    
    checkWelcomeStatus();
  }, [restaurant]);

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

      notifications.show({
        title: "Success",
        message: "New location created successfully",
        color: 'green',
      });

      navigate('/restaurant/onboarding');
    } catch (error) {
      console.error('Error creating location:', error);
      notifications.show({
        title: "Error",
        message: "Failed to create new location",
        color: 'red',
      });
    }
  };

  const isBusinessVerified = Boolean(progress?.business_info_verified) || Boolean(restaurant?.business_verified_at);

  const completedSteps = [
    isBusinessVerified,
    progress?.menu_preparation_status === 'ready',
    progress?.tablet_shipped
  ].filter(Boolean).length;

  const allStepsComplete = completedSteps === 3;

  const deadline = restaurant?.setup_deadline 
    ? format(new Date(restaurant.setup_deadline), 'EEE, MMM d')
    : readiness?.estimated_go_live 
      ? format(new Date(readiness.estimated_go_live), 'EEE, MMM d')
      : "Not set";

  if (restaurantLoading || onboardingLoading) {
    return (
      <Box style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="xl" color="orange" />
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Card p="xl" withBorder>
          <Stack gap="md">
            <Title order={3}>No Restaurant Found</Title>
            <Text c="dimmed">Please complete restaurant onboarding first.</Text>
            <Button onClick={() => navigate('/restaurant/register')}>
              Start Onboarding
            </Button>
          </Stack>
        </Card>
      </Box>
    );
  }
  return (
    <Box style={{ display: 'flex', height: '100vh' }}>
      {/* Left Sidebar */}
      <Box style={{ width: '256px', borderRight: '1px solid var(--mantine-color-gray-3)', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap="xs">
            <img 
              src="/merchant-logo.png" 
              alt="Crave'N" 
              style={{ height: '24px', width: 'auto' }}
            />
            <Text fw={600} size="lg">Merchant</Text>
          </Group>
        </Box>

        {/* Restaurant Selector */}
        <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
          <Menu width={224} position="bottom-start">
            <Menu.Target>
              <Button
                variant="subtle"
                fullWidth
                justify="space-between"
                leftSection={
                  <Group gap="xs">
                    <Avatar size="sm" radius="xl" color="gray">
                      <IconBuildingStore size={16} />
                    </Avatar>
                    <Stack gap={0}>
                      <Text size="sm" fw={600}>{restaurant.name}</Text>
                      <Text size="xs" c="dimmed">Store {restaurants.length > 1 && `(${restaurants.length})`}</Text>
                    </Stack>
                  </Group>
                }
                rightSection={<IconChevronDown size={16} />}
              />
            </Menu.Target>
            <Menu.Dropdown>
              {restaurants.map((r) => (
                <Menu.Item
                  key={r.id}
                  onClick={() => selectRestaurant(r.id)}
                  leftSection={<IconBuildingStore size={16} />}
                  rightSection={restaurant?.id === r.id ? <IconCheckCircle size={16} color="var(--mantine-color-orange-6)" /> : null}
                  bg={restaurant?.id === r.id ? 'orange.0' : undefined}
                >
                  {r.name}
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </Box>

        {/* Navigation */}
        <ScrollArea style={{ flex: 1 }} p="xs">
          <Stack gap="xs">
            <Button
              variant={activeTab === 'home' ? 'light' : 'subtle'}
              color={activeTab === 'home' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconHome size={20} />}
              onClick={() => setActiveTab('home')}
            >
              Home
            </Button>
            
            <Button
              variant={activeTab === 'insights' ? 'light' : 'subtle'}
              color={activeTab === 'insights' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconTrendingUp size={20} />}
              onClick={() => setActiveTab('insights')}
            >
              Insights
            </Button>
            
            <Button
              variant={activeTab === 'reports' ? 'light' : 'subtle'}
              color={activeTab === 'reports' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconFileText size={20} />}
              onClick={() => setActiveTab('reports')}
            >
              Reports
            </Button>
            
            <Button
              variant={activeTab === 'customers' ? 'light' : 'subtle'}
              color={activeTab === 'customers' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconUsers size={20} />}
              onClick={() => setActiveTab('customers')}
            >
              Customers
            </Button>
            
            <Button
              variant={activeTab === 'orders' ? 'light' : 'subtle'}
              color={activeTab === 'orders' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconPackage size={20} />}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </Button>
            
            <Button
              variant={activeTab === 'menu' ? 'light' : 'subtle'}
              color={activeTab === 'menu' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconMenu2 size={20} />}
              onClick={() => setActiveTab('menu')}
            >
              Menu
            </Button>
            
            <Button
              variant={activeTab === 'availability' ? 'light' : 'subtle'}
              color={activeTab === 'availability' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconCalendar size={20} />}
              onClick={() => setActiveTab('availability')}
            >
              Store availability
            </Button>
            
            <Button
              variant={activeTab === 'financials' ? 'light' : 'subtle'}
              color={activeTab === 'financials' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconCurrencyDollar size={20} />}
              onClick={() => setActiveTab('financials')}
            >
              Financials
            </Button>
            
            <Button
              variant={activeTab === 'settings' ? 'light' : 'subtle'}
              color={activeTab === 'settings' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconSettings size={20} />}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </Button>
          </Stack>

          <Divider my="md" />

          <Stack gap="xs">
            <Text size="xs" c="dimmed" fw={500} px="xs">Channels</Text>
            
            <Button
              variant={activeTab === 'commerce' ? 'light' : 'subtle'}
              color={activeTab === 'commerce' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconBuildingStore size={20} />}
              rightSection={<Badge size="xs" color="green">New</Badge>}
              onClick={() => setActiveTab('commerce')}
            >
              Commerce Platform
            </Button>
            
            <Button
              variant={activeTab === 'request-delivery' ? 'light' : 'subtle'}
              color={activeTab === 'request-delivery' ? 'orange' : 'gray'}
              fullWidth
              justify="flex-start"
              leftSection={<IconDeviceTablet size={20} />}
              onClick={() => setActiveTab('request-delivery')}
            >
              Request a delivery
            </Button>
          </Stack>

          <Box mt="md">
            <Button
              variant="subtle"
              fullWidth
              justify="flex-start"
              leftSection={<IconPlus size={20} />}
              onClick={() => navigate('/restaurant/solutions')}
            >
              Add solutions
            </Button>
          </Box>
        </ScrollArea>

        {/* User Profile */}
        <Box p="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Button
            variant="subtle"
            fullWidth
            justify="flex-start"
            leftSection={
              <Avatar size="sm" radius="xl" color="gray">
                T
              </Avatar>
            }
            rightSection={<IconChevronDown size={16} />}
          >
            {userName} Stroman
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <ScrollArea style={{ flex: 1 }}>
        <Box p="xl">
          {activeTab === 'home' ? (
            allStepsComplete ? (
              <Box style={{ maxWidth: '1280px', margin: '0 auto' }}>
                <Stack gap="xl" mb="xl">
                  <Text size="sm" c="dimmed">Welcome back, {userName}</Text>
                  <Title order={1}>Dashboard</Title>
                </Stack>
                <HomeDashboard 
                  restaurantId={restaurant?.id || ''} 
                  restaurant={restaurant}
                  readiness={readiness}
                />
              </Box>
            ) : (
              <Box style={{ maxWidth: '1024px', margin: '0 auto' }}>
                <Stack gap="xl" mb="xl">
                  <Text size="sm" c="dimmed">Welcome, {userName}</Text>
                  <Title order={1}>Set up your store</Title>
                  <Text size="sm" c="dimmed">
                    Complete these steps to go live with your store by <Text component="span" fw={500}>{deadline}</Text>.
                  </Text>
                </Stack>

          {/* ... keep existing code (Prepare your store section, Go live section, Continue Crave'N setup) */}
          <Card className="p-6 mb-6">
            <button onClick={() => setPrepareStoreExpanded(!prepareStoreExpanded)} className="w-full flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-left mb-1">Prepare your store</h2>
                <p className="text-sm text-muted-foreground text-left">
                  Review other steps before your store goes live.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{completedSteps} of 3 steps</span>
                {prepareStoreExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>

            {prepareStoreExpanded && <div className="space-y-4 mt-6">
                {/* Business info verified */}
                <Card className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isBusinessVerified ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        {isBusinessVerified ? (
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
                        {isBusinessVerified 
                          ? 'Your business info was verified' 
                          : 'Business verification pending'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isBusinessVerified
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
                      
                      {progress?.menu_preparation_status === 'ready' && !restaurant?.header_image_url ? (
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <h4 className="font-semibold text-sm mb-2">Add a store header</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Stores with a header image get up to 50% more monthly sales.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSettingsTab('store');
                              setActiveTab('settings');
                            }}
                          >
                            Add a header image
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
                        progress?.tablet_delivered_at 
                          ? 'bg-green-500' 
                          : progress?.tablet_shipped 
                            ? 'bg-blue-500' 
                            : progress?.tablet_preparing_shipment
                              ? 'bg-yellow-500'
                              : 'bg-muted'
                      }`}>
                        <Tablet className={`w-6 h-6 ${
                          progress?.tablet_delivered_at || progress?.tablet_shipped || progress?.tablet_preparing_shipment ? 'text-white' : 'text-muted-foreground'
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
                              : progress?.tablet_preparing_shipment
                                ? 'Tablet is preparing for shipment'
                                : 'Tablet not yet shipped'}
                        </h3>
                        {(progress?.tablet_shipped || progress?.tablet_preparing_shipment) && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            progress?.tablet_delivered_at
                              ? 'text-green-600 bg-green-50'
                              : progress?.tablet_shipped
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-yellow-600 bg-yellow-50'
                          }`}>
                            {progress?.tablet_delivered_at ? '✓ Delivered' : progress?.tablet_shipped ? '✓ In transit' : '⏱ Preparing'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {progress?.tablet_delivered_at
                          ? "Your tablet has been delivered and is ready to use."
                          : progress?.tablet_shipped
                            ? "We'll keep you updated on its status."
                            : progress?.tablet_preparing_shipment
                              ? "Your tablet is being prepared for shipment. You'll receive tracking info soon."
                              : "Your tablet will ship once business verification and menu preparation are complete."}
                      </p>
                      
                      {progress?.tablet_shipping_label_url && (
                        <div className="mt-3">
                          <Button
                            onClick={() => window.open(progress.tablet_shipping_label_url!, '_blank')}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Package className="w-4 h-4 mr-2" />
                            View Shipping Label
                          </Button>
                        </div>
                      )}

                      {progress?.tablet_tracking_number && progress?.tablet_shipped && (
                        <div className="bg-muted p-3 rounded-lg mt-3 space-y-2">
                          <p className="text-sm font-semibold">Tracking Information</p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Carrier:</span> {progress.tablet_shipping_carrier || 'USPS'}
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Tracking #:</span> {progress.tablet_tracking_number}
                          </p>
                          {progress.tablet_shipped_at && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Shipped:</span> {format(new Date(progress.tablet_shipped_at), 'PPP')}
                            </p>
                          )}
                          <Button
                            onClick={() => {
                              const carrier = progress.tablet_shipping_carrier || 'USPS';
                              const trackingUrl = carrier === 'USPS' 
                                ? `https://tools.usps.com/go/TrackConfirmAction?tLabels=${progress.tablet_tracking_number}`
                                : carrier === 'UPS'
                                ? `https://www.ups.com/track?tracknum=${progress.tablet_tracking_number}`
                                : carrier === 'FedEx'
                                ? `https://www.fedex.com/fedextrack/?trknbr=${progress.tablet_tracking_number}`
                                : `https://www.dhl.com/en/express/tracking.html?AWB=${progress.tablet_tracking_number}`;
                              window.open(trackingUrl, '_blank');
                            }}
                            variant="default"
                            size="sm"
                            className="w-full mt-2"
                          >
                            Track Package
                          </Button>
                        </div>
                      )}
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
        </div>
          )
        ) : activeTab === 'insights' ? <InsightsDashboard /> : activeTab === 'reports' ? <ReportsDashboard /> : activeTab === 'customers' ? <CustomersDashboard /> : activeTab === 'orders' ? <RestaurantCustomerOrderManagement restaurantId={restaurant.id} /> : activeTab === 'menu' ? <MenuDashboard restaurantId={restaurant.id} /> : activeTab === 'availability' ? <StoreAvailabilityDashboard /> : activeTab === 'financials' ? <FinancialsDashboard /> : activeTab === 'settings' ? <SettingsDashboard defaultTab={settingsTab} /> : activeTab === 'commerce' ? <CommercePlatformDashboard /> : activeTab === 'request-delivery' ? <RequestDeliveryDashboard /> : null}
        </Box>
      </ScrollArea>

      {/* Right Sidebar - Store Preview */}
      
      {/* Merchant Welcome Confetti */}
      {showWelcomeConfetti && (
        <MerchantWelcomeConfetti
          restaurantName={restaurant?.name || 'Your Restaurant'}
          onComplete={() => setShowWelcomeConfetti(false)}
        />
      )}
    </Box>
  );
};

export default RestaurantSetup;