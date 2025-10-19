import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, Store, CheckCircle, Clock, AlertCircle, Eye, Search, Filter, 
  Download, Mail, Phone, MapPin, Calendar, FileText, CreditCard, Menu, 
  Image, Settings, MessageSquare, ChevronRight, Building2, TrendingUp,
  Users, DollarSign, XCircle, Send, Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RestaurantOnboarding {
  id: string;
  restaurant_id: string;
  menu_preparation_status: string;
  business_info_verified: boolean;
  go_live_ready: boolean;
  created_at: string;
  restaurant: {
    id: string;
    name: string;
    owner_id: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    onboarding_status: string;
    created_at: string;
    banking_complete: boolean;
    readiness_score: number;
    logo_url?: string;
    header_image_url?: string;
    description?: string;
    cuisine_type?: string;
  };
}

interface OnboardingStep {
  id: string;
  label: string;
  icon: any;
  completed: boolean;
  required: boolean;
}

const RestaurantOnboardingDashboard = () => {
  const [restaurants, setRestaurants] = useState<RestaurantOnboarding[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantOnboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [adminNotes, setAdminNotes] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchRestaurants();
    subscribeToChanges();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_onboarding_progress')
        .select(`
          *,
          restaurant:restaurants!inner(
            id,
            name,
            owner_id,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            onboarding_status,
            created_at,
            banking_complete,
            readiness_score,
            logo_url,
            header_image_url,
            description,
            cuisine_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('restaurant-onboarding-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_onboarding_progress'
        },
        () => {
          fetchRestaurants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateMenuStatus = async (restaurantId: string, status: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-menu-preparation-status', {
        body: { restaurant_id: restaurantId, status }
      });

      if (error) throw error;
      
      toast.success('Menu status updated successfully');
      fetchRestaurants();
    } catch (error) {
      console.error('Error updating menu status:', error);
      toast.error('Failed to update menu status');
    }
  };

  const approveRestaurant = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('restaurant_onboarding_progress')
        .update({
          business_info_verified: true,
          go_live_ready: true
        })
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      await supabase
        .from('restaurants')
        .update({
          onboarding_status: 'approved',
          readiness_score: 100
        })
        .eq('id', restaurantId);

      toast.success('Restaurant approved and ready to go live!');
      fetchRestaurants();
      setSelectedRestaurant(null);
    } catch (error) {
      console.error('Error approving restaurant:', error);
      toast.error('Failed to approve restaurant');
    }
  };

  const sendEmail = async (restaurantId: string, type: string) => {
    setSendingEmail(true);
    try {
      const { error } = await supabase.functions.invoke('send-restaurant-email', {
        body: { restaurant_id: restaurantId, email_type: type }
      });

      if (error) throw error;
      
      toast.success('Email sent successfully');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const getOnboardingSteps = (restaurant: RestaurantOnboarding): OnboardingStep[] => {
    return [
      {
        id: 'business',
        label: 'Business Information',
        icon: Building2,
        completed: restaurant.business_info_verified,
        required: true
      },
      {
        id: 'banking',
        label: 'Banking Setup',
        icon: CreditCard,
        completed: restaurant.restaurant.banking_complete,
        required: true
      },
      {
        id: 'menu',
        label: 'Menu Preparation',
        icon: Menu,
        completed: restaurant.menu_preparation_status === 'ready',
        required: true
      },
      {
        id: 'photos',
        label: 'Photos & Branding',
        icon: Image,
        completed: !!restaurant.restaurant.logo_url && !!restaurant.restaurant.header_image_url,
        required: true
      },
      {
        id: 'settings',
        label: 'Settings & Hours',
        icon: Settings,
        completed: restaurant.restaurant.readiness_score >= 80,
        required: false
      }
    ];
  };

  const getStatusBadge = (restaurant: RestaurantOnboarding) => {
    const steps = getOnboardingSteps(restaurant);
    const completedSteps = steps.filter(s => s.completed).length;
    const requiredSteps = steps.filter(s => s.required).length;
    const requiredCompleted = steps.filter(s => s.required && s.completed).length;

    if (requiredCompleted === requiredSteps && restaurant.go_live_ready) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready to Launch
        </Badge>
      );
    }
    if (requiredCompleted >= requiredSteps / 2) {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
          <Clock className="h-3 w-3 mr-1" />
          In Progress ({completedSteps}/{steps.length})
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending ({completedSteps}/{steps.length})
      </Badge>
    );
  };

  const filteredAndSortedRestaurants = restaurants
    .filter(r => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        r.restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.restaurant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.restaurant.phone?.includes(searchTerm);

      // Status filter
      const steps = getOnboardingSteps(r);
      const requiredCompleted = steps.filter(s => s.required && s.completed).length;
      const requiredTotal = steps.filter(s => s.required).length;

      let matchesStatus = true;
      if (filterStatus === 'pending') matchesStatus = requiredCompleted === 0;
      if (filterStatus === 'in_progress') matchesStatus = requiredCompleted > 0 && requiredCompleted < requiredTotal;
      if (filterStatus === 'ready') matchesStatus = requiredCompleted === requiredTotal && r.go_live_ready;

      // Stage filter
      let matchesStage = true;
      if (filterStage === 'business') matchesStage = !r.business_info_verified;
      if (filterStage === 'banking') matchesStage = r.business_info_verified && !r.restaurant.banking_complete;
      if (filterStage === 'menu') matchesStage = r.restaurant.banking_complete && r.menu_preparation_status !== 'ready';

      return matchesSearch && matchesStatus && matchesStage;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') return a.restaurant.name.localeCompare(b.restaurant.name);
      if (sortBy === 'readiness') return (b.restaurant.readiness_score || 0) - (a.restaurant.readiness_score || 0);
      return 0;
    });

  // Calculate stats
  const totalRestaurants = restaurants.length;
  const pendingRestaurants = restaurants.filter(r => !r.business_info_verified).length;
  const inProgressRestaurants = restaurants.filter(r => {
    const steps = getOnboardingSteps(r);
    const requiredCompleted = steps.filter(s => s.required && s.completed).length;
    const requiredTotal = steps.filter(s => s.required).length;
    return requiredCompleted > 0 && requiredCompleted < requiredTotal;
  }).length;
  const readyRestaurants = restaurants.filter(r => {
    const steps = getOnboardingSteps(r);
    const requiredCompleted = steps.filter(s => s.required && s.completed).length;
    const requiredTotal = steps.filter(s => s.required).length;
    return requiredCompleted === requiredTotal && r.go_live_ready;
  }).length;
  const avgReadinessScore = restaurants.reduce((sum, r) => sum + (r.restaurant.readiness_score || 0), 0) / (restaurants.length || 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Restaurant Onboarding</h2>
          <p className="text-muted-foreground">Manage merchant onboarding and launch preparation</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Enhanced Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4 text-purple-500" />
              Total Restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRestaurants}</div>
            <p className="text-xs text-muted-foreground">In onboarding pipeline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRestaurants}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressRestaurants}</div>
            <p className="text-xs text-muted-foreground">Actively onboarding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Ready
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{readyRestaurants}</div>
            <p className="text-xs text-muted-foreground">Ready to launch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Avg Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{avgReadinessScore.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">Overall progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="ready">Ready to Launch</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="readiness">Readiness Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant Cards */}
      <div className="space-y-4">
        {filteredAndSortedRestaurants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No restaurants found</p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedRestaurants.map((restaurant) => {
            const steps = getOnboardingSteps(restaurant);
            const completedSteps = steps.filter(s => s.completed).length;
            const requiredSteps = steps.filter(s => s.required);
            const requiredCompleted = requiredSteps.filter(s => s.completed).length;

            return (
              <Card key={restaurant.id} className="border hover:border-orange-200 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    {/* Restaurant Logo */}
                    <div className="flex-shrink-0">
                      {restaurant.restaurant.logo_url ? (
                        <img
                          src={restaurant.restaurant.logo_url}
                          alt={restaurant.restaurant.name}
                          className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-orange-100 flex items-center justify-center border-2 border-orange-200">
                          <Store className="h-10 w-10 text-orange-600" />
                        </div>
                      )}
                    </div>

                    {/* Restaurant Info */}
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-semibold">{restaurant.restaurant.name}</h3>
                            {getStatusBadge(restaurant)}
                            {restaurant.restaurant.cuisine_type && (
                              <Badge variant="outline" className="text-xs">
                                {restaurant.restaurant.cuisine_type}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {restaurant.restaurant.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {restaurant.restaurant.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {restaurant.restaurant.city}, {restaurant.restaurant.state}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-bold text-orange-600">
                            {restaurant.restaurant.readiness_score || 0}%
                          </div>
                          <p className="text-xs text-muted-foreground">Ready</p>
                        </div>
                      </div>

                      {/* Progress Steps */}
                      <div className="flex items-center gap-2">
                        {steps.map((step, index) => {
                          const Icon = step.icon;
                          return (
                            <div key={step.id} className="flex items-center flex-1">
                              <div
                                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                                  step.completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {step.completed ? (
                                  <CheckCircle className="h-5 w-5" />
                                ) : (
                                  <Icon className="h-5 w-5" />
                                )}
                              </div>
                              {index < steps.length - 1 && (
                                <div
                                  className={`flex-1 h-1 mx-1 ${
                                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Step Labels */}
                      <div className="flex gap-2">
                        {steps.map((step) => (
                          <div key={step.id} className="flex-1">
                            <p className={`text-xs ${step.completed ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                              {step.label}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Overall Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Overall Progress</span>
                          <span className="font-medium">{completedSteps} of {steps.length} steps complete</span>
                        </div>
                        <Progress 
                          value={(completedSteps / steps.length) * 100} 
                          className="h-2"
                        />
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Joined {format(new Date(restaurant.restaurant.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {restaurant.restaurant.description && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Description added</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Dialog>
                          <Button
                            onClick={() => setSelectedRestaurant(restaurant)}
                            className="bg-orange-500 hover:bg-orange-600"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Dialog>

                        {restaurant.menu_preparation_status === 'not_started' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMenuStatus(restaurant.restaurant_id, 'in_progress')}
                          >
                            Start Menu Prep
                          </Button>
                        )}

                        {restaurant.menu_preparation_status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateMenuStatus(restaurant.restaurant_id, 'ready')}
                          >
                            Mark Menu Ready
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendEmail(restaurant.restaurant_id, 'reminder')}
                          disabled={sendingEmail}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Reminder
                        </Button>

                        {(() => {
                          const steps = getOnboardingSteps(restaurant);
                          const requiredSteps = steps.filter(s => s.required);
                          const requiredCompleted = requiredSteps.filter(s => s.completed).length;
                          
                          return requiredCompleted === requiredSteps.length && !restaurant.go_live_ready && (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600"
                              onClick={() => approveRestaurant(restaurant.restaurant_id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Launch
                            </Button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedRestaurant.restaurant.logo_url ? (
                  <img
                    src={selectedRestaurant.restaurant.logo_url}
                    alt={selectedRestaurant.restaurant.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Store className="h-6 w-6 text-orange-600" />
                  </div>
                )}
                {selectedRestaurant.restaurant.name}
              </DialogTitle>
              <DialogDescription>
                Complete onboarding details and management
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="checklist">Checklist</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Restaurant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-muted-foreground">Restaurant Name</Label>
                        <p className="font-medium mt-1">{selectedRestaurant.restaurant.name}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Cuisine Type</Label>
                        <p className="font-medium mt-1">{selectedRestaurant.restaurant.cuisine_type || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Email</Label>
                        <p className="font-medium mt-1">{selectedRestaurant.restaurant.email}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Phone</Label>
                        <p className="font-medium mt-1">{selectedRestaurant.restaurant.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-muted-foreground">Address</Label>
                        <p className="font-medium mt-1">
                          {selectedRestaurant.restaurant.address}, {selectedRestaurant.restaurant.city}, {selectedRestaurant.restaurant.state} {selectedRestaurant.restaurant.zip_code}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Joined</Label>
                        <p className="font-medium mt-1">
                          {format(new Date(selectedRestaurant.restaurant.created_at), 'PPP')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Readiness Score</Label>
                        <p className="font-medium mt-1 text-orange-600">
                          {selectedRestaurant.restaurant.readiness_score || 0}%
                        </p>
                      </div>
                    </div>

                    {selectedRestaurant.restaurant.description && (
                      <div>
                        <Label className="text-muted-foreground">Description</Label>
                        <p className="text-sm mt-1">{selectedRestaurant.restaurant.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Onboarding Checklist</CardTitle>
                    <CardDescription>Track completion of all required steps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getOnboardingSteps(selectedRestaurant).map((step) => {
                        const Icon = step.icon;
                        return (
                          <div
                            key={step.id}
                            className={`border rounded-lg p-4 ${
                              step.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    step.completed
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-300 text-gray-600'
                                  }`}
                                >
                                  {step.completed ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : (
                                    <Icon className="h-5 w-5" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{step.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {step.required ? 'Required' : 'Optional'}
                                  </p>
                                </div>
                              </div>
                              {step.completed ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Complete
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  Incomplete
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents & Media</CardTitle>
                    <CardDescription>Restaurant documents and branding assets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <Label className="text-sm font-medium">Logo</Label>
                        {selectedRestaurant.restaurant.logo_url ? (
                          <img
                            src={selectedRestaurant.restaurant.logo_url}
                            alt="Logo"
                            className="w-full h-32 object-contain mt-2 rounded"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center mt-2 rounded">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="border rounded-lg p-4">
                        <Label className="text-sm font-medium">Header Image</Label>
                        {selectedRestaurant.restaurant.header_image_url ? (
                          <img
                            src={selectedRestaurant.restaurant.header_image_url}
                            alt="Header"
                            className="w-full h-32 object-cover mt-2 rounded"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 flex items-center justify-center mt-2 rounded">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Additional documents (licenses, permits, insurance) are managed in the 
                        <strong> Document Verification</strong> section.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Communication Tab */}
              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Communication Log</CardTitle>
                    <CardDescription>Email history and internal notes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Internal Notes</Label>
                      <Textarea
                        placeholder="Add notes about this restaurant's onboarding..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={4}
                        className="mt-2"
                      />
                      <Button className="mt-2 bg-orange-500 hover:bg-orange-600">
                        Save Notes
                      </Button>
                    </div>

                    <div className="border-t pt-4">
                      <Label className="mb-3 block">Quick Email Actions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => sendEmail(selectedRestaurant.restaurant_id, 'welcome')}
                          disabled={sendingEmail}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Welcome Email
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => sendEmail(selectedRestaurant.restaurant_id, 'reminder')}
                          disabled={sendingEmail}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Reminder
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => sendEmail(selectedRestaurant.restaurant_id, 'menu_help')}
                          disabled={sendingEmail}
                        >
                          <Menu className="h-4 w-4 mr-2" />
                          Menu Setup Help
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => sendEmail(selectedRestaurant.restaurant_id, 'launch')}
                          disabled={sendingEmail}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Launch Ready Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Administrative Actions</CardTitle>
                    <CardDescription>Manage restaurant status and approvals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {!selectedRestaurant.business_info_verified && (
                        <Button className="w-full bg-green-500 hover:bg-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify Business Information
                        </Button>
                      )}

                      {selectedRestaurant.menu_preparation_status !== 'ready' && (
                        <Button 
                          className="w-full bg-blue-500 hover:bg-blue-600"
                          onClick={() => updateMenuStatus(selectedRestaurant.restaurant_id, 'ready')}
                        >
                          <Menu className="h-4 w-4 mr-2" />
                          Mark Menu as Ready
                        </Button>
                      )}

                      {(() => {
                        const steps = getOnboardingSteps(selectedRestaurant);
                        const requiredSteps = steps.filter(s => s.required);
                        const requiredCompleted = requiredSteps.filter(s => s.completed).length;
                        
                        return requiredCompleted === requiredSteps.length && (
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            onClick={() => approveRestaurant(selectedRestaurant.restaurant_id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve & Launch Restaurant
                          </Button>
                        );
                      })()}

                      <Button variant="outline" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Restaurant Details
                      </Button>

                      <Button variant="destructive" className="w-full">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Application
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RestaurantOnboardingDashboard;