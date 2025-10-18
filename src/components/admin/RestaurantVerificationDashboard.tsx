import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileCheck, 
  FileX, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  Building2,
  FileText,
  Shield,
  Heart,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';

interface Restaurant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  business_license_url: string;
  insurance_certificate_url: string;
  health_permit_url: string;
  owner_id_url: string;
  business_verified_at: string | null;
  verification_notes: any;
  created_at: string;
  onboarding_status: string;
  cuisine_type: string;
}

export const RestaurantVerificationDashboard = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [overriddenDocuments, setOverriddenDocuments] = useState<string[]>([]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRestaurants(data || []);
    } catch (error: any) {
      toast.error('Failed to load restaurants');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (restaurantId: string) => {
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          business_verified_at: new Date().toISOString(),
          verification_notes: {
            ...(selectedRestaurant?.verification_notes || {}),
            approved_by: (await supabase.auth.getUser()).data.user?.id,
            approved_at: new Date().toISOString(),
            notes: verificationNotes,
            overridden_documents: overriddenDocuments.length > 0 ? overriddenDocuments : undefined
          },
          onboarding_status: 'verified'
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast.success('Restaurant verified successfully');
      setVerificationNotes('');
      setOverriddenDocuments([]);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (error: any) {
      toast.error('Failed to verify restaurant');
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (restaurantId: string) => {
    if (!verificationNotes.trim()) {
      toast.error('Please provide rejection notes');
      return;
    }

    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          verification_notes: {
            ...(selectedRestaurant?.verification_notes || {}),
            rejected_by: (await supabase.auth.getUser()).data.user?.id,
            rejected_at: new Date().toISOString(),
            notes: verificationNotes
          },
          onboarding_status: 'rejected'
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast.success('Restaurant verification rejected');
      setVerificationNotes('');
      setOverriddenDocuments([]);
      setSelectedRestaurant(null);
      fetchRestaurants();
    } catch (error: any) {
      toast.error('Failed to reject restaurant');
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadge = (restaurant: Restaurant) => {
    if (restaurant.business_verified_at) {
      return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    if (restaurant.onboarding_status === 'rejected') {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  const hasAllDocuments = (restaurant: Restaurant) => {
    return restaurant.business_license_url && 
           restaurant.insurance_certificate_url && 
           restaurant.health_permit_url;
  };

  const filterRestaurants = (status: string) => {
    switch (status) {
      case 'verified':
        return restaurants.filter(r => r.business_verified_at);
      case 'pending':
        return restaurants.filter(r => !r.business_verified_at && r.onboarding_status !== 'rejected');
      case 'rejected':
        return restaurants.filter(r => r.onboarding_status === 'rejected');
      default:
        return restaurants;
    }
  };

  const toggleOverride = (docKey: string) => {
    setOverriddenDocuments(prev => 
      prev.includes(docKey) 
        ? prev.filter(k => k !== docKey)
        : [...prev, docKey]
    );
  };

  const DocumentCard = ({ label, url, icon: Icon, docKey }: { label: string; url: string | null; icon: any; docKey: string }) => {
    const isOverridden = overriddenDocuments.includes(docKey);
    
    return (
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${url ? 'bg-green-50 text-green-600' : isOverridden ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                {url ? (
                  <p className="text-xs text-muted-foreground">Document uploaded</p>
                ) : isOverridden ? (
                  <p className="text-xs text-orange-600">Override enabled</p>
                ) : (
                  <p className="text-xs text-destructive">Not provided</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {url && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(url, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              )}
              {!url && !selectedRestaurant?.business_verified_at && (
                <Button
                  size="sm"
                  variant={isOverridden ? "default" : "outline"}
                  onClick={() => toggleOverride(docKey)}
                >
                  {isOverridden ? 'Override Active' : 'Override Required'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Restaurant Verification</h2>
        <p className="text-muted-foreground">
          Review and approve merchant documents and business verification
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filterRestaurants('pending').length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({filterRestaurants('verified').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filterRestaurants('rejected').length})
          </TabsTrigger>
        </TabsList>

        {['all', 'pending', 'verified', 'rejected'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filterRestaurants(status).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No restaurants found</p>
                </CardContent>
              </Card>
            ) : (
              filterRestaurants(status).map((restaurant) => (
                <Card key={restaurant.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                          {getStatusBadge(restaurant)}
                        </div>
                        <CardDescription className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4" />
                            {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                          </div>
                          {restaurant.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4" />
                              {restaurant.email}
                            </div>
                          )}
                          {restaurant.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4" />
                              {restaurant.phone}
                            </div>
                          )}
                          {restaurant.cuisine_type && (
                            <div className="flex items-center gap-2 text-sm">
                              <Heart className="w-4 h-4" />
                              {restaurant.cuisine_type}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              setVerificationNotes('');
                              setOverriddenDocuments([]);
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Review Documents
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">
                              {restaurant.name} - Documents
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Restaurant Info */}
                            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                              <p className="text-sm"><strong>Submitted:</strong> {format(new Date(restaurant.created_at), 'PPP')}</p>
                              {restaurant.business_verified_at && (
                                <p className="text-sm"><strong>Verified:</strong> {format(new Date(restaurant.business_verified_at), 'PPP')}</p>
                              )}
                            </div>

                            {/* Documents */}
                            <div className="space-y-3">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                Required Documents
                              </h3>
                              <DocumentCard
                                label="Business License"
                                url={restaurant.business_license_url}
                                icon={FileCheck}
                                docKey="business_license"
                              />
                              <DocumentCard
                                label="Insurance Certificate"
                                url={restaurant.insurance_certificate_url}
                                icon={Shield}
                                docKey="insurance_certificate"
                              />
                              <DocumentCard
                                label="Health Permit"
                                url={restaurant.health_permit_url}
                                icon={Heart}
                                docKey="health_permit"
                              />
                              <DocumentCard
                                label="Owner ID"
                                url={restaurant.owner_id_url}
                                icon={FileText}
                                docKey="owner_id"
                              />
                            </div>

                            {/* Verification Notes */}
                            {!restaurant.business_verified_at && restaurant.onboarding_status !== 'rejected' && (
                              <div className="space-y-3">
                                <Label htmlFor="notes">Verification Notes</Label>
                                <Textarea
                                  id="notes"
                                  value={verificationNotes}
                                  onChange={(e) => setVerificationNotes(e.target.value)}
                                  placeholder="Add notes about the verification (required for rejection)"
                                  rows={4}
                                />
                              </div>
                            )}

                            {/* Previous Notes */}
                            {restaurant.verification_notes?.notes && (
                              <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm font-semibold mb-2">Previous Notes:</p>
                                <p className="text-sm whitespace-pre-wrap">{restaurant.verification_notes.notes}</p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            {!restaurant.business_verified_at && restaurant.onboarding_status !== 'rejected' && (
                              <div className="flex gap-3">
                                <Button
                                  className="flex-1"
                                  onClick={() => handleApprove(restaurant.id)}
                                  disabled={isApproving}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {hasAllDocuments(restaurant) ? 'Approve & Verify' : `Approve with ${overriddenDocuments.length} Override(s)`}
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleReject(restaurant.id)}
                                  disabled={isApproving}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}

                            {restaurant.business_verified_at && (
                              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                                <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                                <p className="font-semibold text-green-900">Business Verified</p>
                                <p className="text-sm text-green-700">
                                  Verified on {format(new Date(restaurant.business_verified_at), 'PPP')}
                                </p>
                              </div>
                            )}

                            {restaurant.onboarding_status === 'rejected' && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                                <XCircle className="w-8 h-8 mx-auto text-red-600 mb-2" />
                                <p className="font-semibold text-red-900">Verification Rejected</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {hasAllDocuments(restaurant) ? (
                        <>
                          <FileCheck className="w-4 h-4 text-green-600" />
                          <span>All required documents submitted</span>
                        </>
                      ) : (
                        <>
                          <FileX className="w-4 h-4 text-orange-600" />
                          <span>Missing required documents</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
