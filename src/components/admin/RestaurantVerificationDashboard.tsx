import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileCheck, FileX, Eye, CheckCircle, Clock, XCircle, Building2, FileText, Shield, Heart,
  MapPin, Phone, Mail, AlertTriangle, Calendar, Download, Search, Filter, ZoomIn, 
  RotateCw, Flag, Upload, Send, ArrowRight, TrendingUp, Maximize2, ExternalLink,
  Store, CreditCard, Activity, RefreshCw
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

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
  logo_url?: string;
  tax_id?: string;
  // Document metadata
  business_license_expiry?: string;
  insurance_expiry?: string;
  health_permit_expiry?: string;
}

interface DocumentStatus {
  key: string;
  label: string;
  url: string | null;
  icon: any;
  required: boolean;
  approved: boolean;
  rejected: boolean;
  notes: string;
  expiryDate?: string;
}

interface RejectionReason {
  id: string;
  label: string;
  category: 'quality' | 'validity' | 'mismatch' | 'fraud';
}

const REJECTION_REASONS: RejectionReason[] = [
  { id: 'expired', label: 'Document expired', category: 'validity' },
  { id: 'poor_quality', label: 'Poor quality/unreadable', category: 'quality' },
  { id: 'name_mismatch', label: 'Name does not match', category: 'mismatch' },
  { id: 'address_mismatch', label: 'Address does not match', category: 'mismatch' },
  { id: 'invalid_format', label: 'Invalid format', category: 'quality' },
  { id: 'missing_info', label: 'Missing required information', category: 'validity' },
  { id: 'suspected_fraud', label: 'Suspected fraudulent document', category: 'fraud' },
  { id: 'wrong_document', label: 'Wrong document type', category: 'validity' },
];

export const RestaurantVerificationDashboard = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [overriddenDocuments, setOverriddenDocuments] = useState<string[]>([]);
  const [documentStatuses, setDocumentStatuses] = useState<Record<string, DocumentStatus>>({});
  const [selectedRejectionReasons, setSelectedRejectionReasons] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewingDocument, setViewingDocument] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRestaurants();
    subscribeToChanges();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      initializeDocumentStatuses(selectedRestaurant);
    }
  }, [selectedRestaurant]);

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

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('restaurant-verification-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurants'
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

  const initializeDocumentStatuses = (restaurant: Restaurant) => {
    const statuses: Record<string, DocumentStatus> = {
      business_license: {
        key: 'business_license',
        label: 'Business License',
        url: restaurant.business_license_url,
        icon: FileCheck,
        required: true,
        approved: false,
        rejected: false,
        notes: '',
        expiryDate: restaurant.business_license_expiry
      },
      insurance: {
        key: 'insurance',
        label: 'Insurance Certificate',
        url: restaurant.insurance_certificate_url,
        icon: Shield,
        required: true,
        approved: false,
        rejected: false,
        notes: '',
        expiryDate: restaurant.insurance_expiry
      },
      health_permit: {
        key: 'health_permit',
        label: 'Health Permit',
        url: restaurant.health_permit_url,
        icon: Heart,
        required: false,
        approved: false,
        rejected: false,
        notes: '',
        expiryDate: restaurant.health_permit_expiry
      },
      owner_id: {
        key: 'owner_id',
        label: 'Owner ID',
        url: restaurant.owner_id_url,
        icon: FileText,
        required: true,
        approved: false,
        rejected: false,
        notes: ''
      }
    };

    setDocumentStatuses(statuses);
  };

  const handleApproveDocument = (docKey: string) => {
    setDocumentStatuses(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], approved: true, rejected: false }
    }));
  };

  const handleRejectDocument = (docKey: string, reason: string) => {
    setDocumentStatuses(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], approved: false, rejected: true, notes: reason }
    }));
  };

  const handleApproveAll = async (restaurantId: string) => {
    setIsApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if all required documents are approved
      const requiredDocs = Object.values(documentStatuses).filter(d => d.required);
      const allRequiredApproved = requiredDocs.every(d => d.approved || d.url);

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          business_verified_at: new Date().toISOString(),
          verification_notes: {
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            notes: verificationNotes,
            document_statuses: documentStatuses,
            overridden_documents: overriddenDocuments
          },
          onboarding_status: 'verified'
        })
        .eq('id', restaurantId);

      if (updateError) throw updateError;

      const { error: progressError } = await supabase
        .from('restaurant_onboarding_progress')
        .update({
          business_info_verified: true,
          business_verified_at: new Date().toISOString(),
          admin_notes: verificationNotes || 'All documents verified'
        })
        .eq('restaurant_id', restaurantId);

      if (progressError) throw progressError;

      // Create audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id,
        action: 'restaurant_verified',
        entity_type: 'restaurant',
        entity_id: restaurantId,
        details: { notes: verificationNotes, all_required_approved: allRequiredApproved }
      });

      toast.success('Restaurant verified successfully!');
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
    if (!verificationNotes.trim() && selectedRejectionReasons.length === 0) {
      toast.error('Please select rejection reasons or provide notes');
      return;
    }

    setIsApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const rejectedDocs = Object.values(documentStatuses).filter(d => d.rejected);
      const rejectionSummary = selectedRejectionReasons.map(id => 
        REJECTION_REASONS.find(r => r.id === id)?.label
      ).join(', ');

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          verification_notes: {
            rejected_by: user?.id,
            rejected_at: new Date().toISOString(),
            notes: verificationNotes,
            rejection_reasons: selectedRejectionReasons,
            rejected_documents: rejectedDocs.map(d => ({
              key: d.key,
              reason: d.notes
            }))
          },
          onboarding_status: 'rejected'
        })
        .eq('id', restaurantId);

      if (updateError) throw updateError;

      // Create audit log
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id,
        action: 'restaurant_rejected',
        entity_type: 'restaurant',
        entity_id: restaurantId,
        details: { 
          reasons: selectedRejectionReasons,
          notes: verificationNotes,
          rejected_docs: rejectedDocs.length
        }
      });

      toast.success('Restaurant verification rejected');
      setVerificationNotes('');
      setSelectedRejectionReasons([]);
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
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    if (restaurant.onboarding_status === 'rejected') {
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
        <Clock className="w-3 h-3 mr-1" />
        Pending Review
      </Badge>
    );
  };

  const getRiskBadge = (restaurant: Restaurant) => {
    // Calculate risk score based on missing docs and age
    const missingDocs = [
      restaurant.business_license_url,
      restaurant.insurance_certificate_url,
      restaurant.owner_id_url
    ].filter(d => !d).length;

    const daysSinceSubmission = differenceInDays(new Date(), new Date(restaurant.created_at));

    if (missingDocs >= 2 || daysSinceSubmission > 14) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />High Risk</Badge>;
    }
    if (missingDocs === 1 || daysSinceSubmission > 7) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Flag className="h-3 w-3 mr-1" />Medium Risk</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Low Risk</Badge>;
  };

  const getDocumentCompleteness = (restaurant: Restaurant) => {
    const docs = [
      restaurant.business_license_url,
      restaurant.insurance_certificate_url,
      restaurant.owner_id_url,
      restaurant.health_permit_url
    ];
    const uploaded = docs.filter(d => d).length;
    return { uploaded, total: docs.length, percentage: (uploaded / docs.length) * 100 };
  };

  const getExpiryWarning = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
    }
    if (daysUntilExpiry <= 30) {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Expires in {daysUntilExpiry}d</Badge>;
    }
    if (daysUntilExpiry <= 90) {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Expires in {daysUntilExpiry}d</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Valid</Badge>;
  };

  const hasAllDocuments = (restaurant: Restaurant) => {
    return restaurant.business_license_url && 
           restaurant.insurance_certificate_url && 
           restaurant.owner_id_url;
  };

  const filterRestaurants = (status: string) => {
    let filtered = restaurants;

    // Status filter
    switch (status) {
      case 'verified':
        filtered = filtered.filter(r => r.business_verified_at);
        break;
      case 'pending':
        filtered = filtered.filter(r => !r.business_verified_at && r.onboarding_status !== 'rejected');
        break;
      case 'rejected':
        filtered = filtered.filter(r => r.onboarding_status === 'rejected');
        break;
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone?.includes(searchTerm)
      );
    }

    return filtered;
  };

  const sortedRestaurants = filterRestaurants(filterStatus).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'risk') {
      const aRisk = getDocumentCompleteness(a).uploaded;
      const bRisk = getDocumentCompleteness(b).uploaded;
      return aRisk - bRisk; // Lower completeness = higher risk first
    }
    return 0;
  });

  const toggleDocumentSelection = (id: string) => {
    const newSet = new Set(selectedDocuments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDocuments(newSet);
  };

  const handleBulkApprove = async () => {
    if (selectedDocuments.size === 0) {
      toast.error('No restaurants selected');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates = Array.from(selectedDocuments).map(id =>
        supabase
          .from('restaurants')
          .update({
            business_verified_at: new Date().toISOString(),
            onboarding_status: 'verified'
          })
          .eq('id', id)
      );

      await Promise.all(updates);

      toast.success(`${selectedDocuments.size} restaurants verified`);
      setSelectedDocuments(new Set());
      fetchRestaurants();
    } catch (error) {
      toast.error('Bulk approval failed');
      console.error(error);
    }
  };

  // Calculate stats
  const totalRestaurants = restaurants.length;
  const pendingRestaurants = restaurants.filter(r => !r.business_verified_at && r.onboarding_status !== 'rejected').length;
  const verifiedRestaurants = restaurants.filter(r => r.business_verified_at).length;
  const rejectedRestaurants = restaurants.filter(r => r.onboarding_status === 'rejected').length;
  const highRiskRestaurants = restaurants.filter(r => {
    const missingDocs = [r.business_license_url, r.insurance_certificate_url, r.owner_id_url].filter(d => !d).length;
    const daysSince = differenceInDays(new Date(), new Date(r.created_at));
    return missingDocs >= 2 || daysSince > 14;
  }).length;

  const avgVerificationTime = restaurants
    .filter(r => r.business_verified_at)
    .reduce((sum, r) => {
      const days = differenceInDays(new Date(r.business_verified_at!), new Date(r.created_at));
      return sum + days;
    }, 0) / (verifiedRestaurants || 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Shield className="h-8 w-8 animate-pulse text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Document Verification</h2>
          <p className="text-muted-foreground">Review and verify merchant business documents for compliance</p>
        </div>
        <div className="flex gap-2">
          {selectedDocuments.size > 0 && (
            <Button
              onClick={handleBulkApprove}
              className="bg-green-500 hover:bg-green-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve {selectedDocuments.size} Selected
            </Button>
          )}
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Enhanced Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Store className="h-4 w-4 text-purple-500" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRestaurants}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRestaurants}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Verified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{verifiedRestaurants}</div>
            <p className="text-xs text-muted-foreground">Documents approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              High Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highRiskRestaurants}</div>
            <p className="text-xs text-muted-foreground">Flagged for review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Avg Review Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgVerificationTime.toFixed(1)}d</div>
            <p className="text-xs text-muted-foreground">Days to verify</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search restaurants..."
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
                <SelectItem value="pending">Pending Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                <SelectItem value="risk">Highest Risk First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Restaurant List */}
      <div className="space-y-4">
        {sortedRestaurants.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No restaurants found</p>
            </CardContent>
          </Card>
        ) : (
          sortedRestaurants.map((restaurant) => {
            const docStats = getDocumentCompleteness(restaurant);
            const daysSinceSubmission = differenceInDays(new Date(), new Date(restaurant.created_at));

            return (
              <Card key={restaurant.id} className="border hover:border-orange-200 transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-6">
                    {/* Selection Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <Checkbox
                        checked={selectedDocuments.has(restaurant.id)}
                        onCheckedChange={() => toggleDocumentSelection(restaurant.id)}
                      />
                    </div>

                    {/* Restaurant Logo */}
                    <div className="flex-shrink-0">
                      {restaurant.logo_url ? (
                        <img
                          src={restaurant.logo_url}
                          alt={restaurant.name}
                          className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-orange-100 flex items-center justify-center border-2 border-orange-200">
                          <Store className="h-8 w-8 text-orange-600" />
                        </div>
                      )}
                    </div>

                    {/* Restaurant Info */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-xl font-semibold">{restaurant.name}</h3>
                            {getStatusBadge(restaurant)}
                            {getRiskBadge(restaurant)}
                            {restaurant.cuisine_type && (
                              <Badge variant="outline" className="text-xs">
                                {restaurant.cuisine_type}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {restaurant.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {restaurant.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {restaurant.city}, {restaurant.state}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Document Status Grid */}
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: 'Business License', url: restaurant.business_license_url, icon: FileCheck, expiry: restaurant.business_license_expiry },
                          { label: 'Insurance', url: restaurant.insurance_certificate_url, icon: Shield, expiry: restaurant.insurance_expiry },
                          { label: 'Health Permit', url: restaurant.health_permit_url, icon: Heart, expiry: restaurant.health_permit_expiry },
                          { label: 'Owner ID', url: restaurant.owner_id_url, icon: FileText }
                        ].map((doc, index) => {
                          const Icon = doc.icon;
                          return (
                            <div
                              key={index}
                              className={`border rounded-lg p-3 ${
                                doc.url ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <Icon className={`h-4 w-4 ${doc.url ? 'text-green-600' : 'text-red-600'}`} />
                                {doc.url ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-red-600" />
                                )}
                              </div>
                              <p className="text-xs font-medium">{doc.label}</p>
                              {doc.expiry && doc.url && (
                                <div className="mt-1">
                                  {getExpiryWarning(doc.expiry)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Document Completeness</span>
                          <span className="font-medium">{docStats.uploaded}/{docStats.total} uploaded</span>
                        </div>
                        <Progress value={docStats.percentage} className="h-2" />
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Submitted {daysSinceSubmission} days ago
                        </div>
                        {restaurant.business_verified_at && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Verified {format(new Date(restaurant.business_verified_at), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              onClick={() => {
                                setSelectedRestaurant(restaurant);
                                setVerificationNotes('');
                                setOverriddenDocuments([]);
                                setSelectedRejectionReasons([]);
                              }}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Review Documents
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                {restaurant.logo_url && (
                                  <img src={restaurant.logo_url} alt={restaurant.name} className="w-10 h-10 rounded-lg object-cover" />
                                )}
                                Document Verification - {restaurant.name}
                              </DialogTitle>
                              <DialogDescription>
                                Review and verify all business documents for compliance
                              </DialogDescription>
                            </DialogHeader>

                            <Tabs defaultValue="documents" className="w-full">
                              <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="documents">Documents</TabsTrigger>
                                <TabsTrigger value="business">Business Info</TabsTrigger>
                                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                                <TabsTrigger value="actions">Actions</TabsTrigger>
                              </TabsList>

                              {/* Documents Tab */}
                              <TabsContent value="documents" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  {Object.values(documentStatuses).map((doc) => {
                                    const Icon = doc.icon;
                                    return (
                                      <Card key={doc.key} className={`border-2 ${
                                        doc.approved ? 'border-green-300 bg-green-50' :
                                        doc.rejected ? 'border-red-300 bg-red-50' :
                                        doc.url ? 'border-gray-200' : 'border-red-200 bg-red-50'
                                      }`}>
                                        <CardHeader>
                                          <CardTitle className="text-base flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Icon className="h-5 w-5" />
                                              {doc.label}
                                              {doc.required && (
                                                <Badge variant="outline" className="text-xs">Required</Badge>
                                              )}
                                            </div>
                                            {doc.expiryDate && getExpiryWarning(doc.expiryDate)}
                                          </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                          {doc.url ? (
                                            <>
                                              {/* Document Preview */}
                                              <div 
                                                className="relative h-40 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                                                onClick={() => setViewingDocument(doc.url)}
                                              >
                                                <img
                                                  src={doc.url}
                                                  alt={doc.label}
                                                  className="w-full h-full object-contain"
                                                  onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    e.currentTarget.parentElement!.innerHTML = `<div class="flex items-center justify-center h-full"><FileText class="h-12 w-12 text-gray-400" /></div>`;
                                                  }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-colors">
                                                  <Maximize2 className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
                                                </div>
                                              </div>

                                              {/* Document Actions */}
                                              <div className="flex gap-2">
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => window.open(doc.url!, '_blank')}
                                                  className="flex-1"
                                                >
                                                  <ExternalLink className="h-3 w-3 mr-1" />
                                                  Open
                                                </Button>
                                                {!restaurant.business_verified_at && (
                                                  <>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => handleApproveDocument(doc.key)}
                                                      className={`flex-1 ${
                                                        doc.approved ? 'bg-green-500' : 'bg-gray-200'
                                                      }`}
                                                      disabled={doc.approved}
                                                    >
                                                      <CheckCircle className="h-3 w-3 mr-1" />
                                                      {doc.approved ? 'Approved' : 'Approve'}
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="destructive"
                                                      onClick={() => {
                                                        const reason = prompt('Rejection reason:');
                                                        if (reason) handleRejectDocument(doc.key, reason);
                                                      }}
                                                      className="flex-1"
                                                    >
                                                      <XCircle className="h-3 w-3 mr-1" />
                                                      Reject
                                                    </Button>
                                                  </>
                                                )}
                                              </div>
                                            </>
                                          ) : (
                                            <div className="text-center py-8">
                                              <FileX className="h-12 w-12 text-red-400 mx-auto mb-2" />
                                              <p className="text-sm text-red-600 font-medium">Document Not Uploaded</p>
                                              {!restaurant.business_verified_at && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  className="mt-3"
                                                  onClick={() => {
                                                    toast.info('Request document feature coming soon');
                                                  }}
                                                >
                                                  <Send className="h-3 w-3 mr-1" />
                                                  Request Upload
                                                </Button>
                                              )}
                                            </div>
                                          )}

                                          {doc.rejected && doc.notes && (
                                            <div className="bg-red-50 border border-red-200 p-2 rounded text-xs text-red-700">
                                              <strong>Rejection Reason:</strong> {doc.notes}
                                            </div>
                                          )}
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              </TabsContent>

                              {/* Business Info Tab */}
                              <TabsContent value="business" className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Business Details</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <Label className="text-muted-foreground">Legal Business Name</Label>
                                        <p className="font-medium mt-1">{restaurant.name}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Cuisine Type</Label>
                                        <p className="font-medium mt-1">{restaurant.cuisine_type || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Tax ID (if provided)</Label>
                                        <p className="font-medium mt-1">{restaurant.tax_id || 'Not provided'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Submitted Date</Label>
                                        <p className="font-medium mt-1">{format(new Date(restaurant.created_at), 'PPP')}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <Label className="text-muted-foreground">Business Address</Label>
                                        <p className="font-medium mt-1">
                                          {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip_code}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Contact Email</Label>
                                        <p className="font-medium mt-1">{restaurant.email}</p>
                                      </div>
                                      <div>
                                        <Label className="text-muted-foreground">Contact Phone</Label>
                                        <p className="font-medium mt-1">{restaurant.phone}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              {/* Compliance Tab */}
                              <TabsContent value="compliance" className="space-y-4">
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Compliance Checklist</CardTitle>
                                    <CardDescription>Verify all legal and regulatory requirements</CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    {[
                                      { label: 'Business name matches across all documents', check: true },
                                      { label: 'Address matches business license', check: true },
                                      { label: 'All required documents uploaded', check: hasAllDocuments(restaurant) },
                                      { label: 'Documents are current and not expired', check: !restaurant.business_license_expiry || differenceInDays(new Date(restaurant.business_license_expiry), new Date()) > 0 },
                                      { label: 'Insurance coverage is adequate', check: !!restaurant.insurance_certificate_url },
                                      { label: 'Owner ID is government-issued', check: !!restaurant.owner_id_url },
                                    ].map((item, index) => (
                                      <div
                                        key={index}
                                        className={`flex items-center justify-between p-3 rounded-lg border ${
                                          item.check ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                                        }`}
                                      >
                                        <span className="text-sm">{item.label}</span>
                                        {item.check ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>

                                {/* Document Expiry Tracking */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle>Document Expiration Tracking</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    {[
                                      { label: 'Business License', date: restaurant.business_license_expiry },
                                      { label: 'Insurance', date: restaurant.insurance_expiry },
                                      { label: 'Health Permit', date: restaurant.health_permit_expiry }
                                    ].map((item, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <span className="text-sm">{item.label}</span>
                                        {item.date ? (
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                              Expires: {format(new Date(item.date), 'MMM dd, yyyy')}
                                            </span>
                                            {getExpiryWarning(item.date)}
                                          </div>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">No expiry date</span>
                                        )}
                                      </div>
                                    ))}
                                  </CardContent>
                                </Card>
                              </TabsContent>

                              {/* Actions Tab */}
                              <TabsContent value="actions" className="space-y-4">
                                {!restaurant.business_verified_at && restaurant.onboarding_status !== 'rejected' ? (
                                  <>
                                    {/* Rejection Reasons */}
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base">Rejection Reasons (if applicable)</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="grid grid-cols-2 gap-2">
                                          {REJECTION_REASONS.map((reason) => (
                                            <div key={reason.id} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={reason.id}
                                                checked={selectedRejectionReasons.includes(reason.id)}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedRejectionReasons([...selectedRejectionReasons, reason.id]);
                                                  } else {
                                                    setSelectedRejectionReasons(selectedRejectionReasons.filter(id => id !== reason.id));
                                                  }
                                                }}
                                              />
                                              <label htmlFor={reason.id} className="text-sm cursor-pointer">
                                                {reason.label}
                                              </label>
                                            </div>
                                          ))}
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Verification Notes */}
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base">Verification Notes</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <Textarea
                                          value={verificationNotes}
                                          onChange={(e) => setVerificationNotes(e.target.value)}
                                          placeholder="Add detailed notes about verification (required for rejection)..."
                                          rows={4}
                                        />
                                      </CardContent>
                                    </Card>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                      <Button
                                        onClick={() => handleApproveAll(restaurant.id)}
                                        disabled={isApproving || !hasAllDocuments(restaurant)}
                                        className="bg-green-500 hover:bg-green-600 text-white"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve & Verify
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleReject(restaurant.id)}
                                        disabled={isApproving}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject Application
                                      </Button>
                                    </div>

                                    {!hasAllDocuments(restaurant) && (
                                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                                        <div className="flex items-start gap-3">
                                          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                          <div>
                                            <p className="font-medium text-yellow-900">Missing Required Documents</p>
                                            <p className="text-sm text-yellow-700 mt-1">
                                              Enable override to approve, or request missing documents from merchant.
                                            </p>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="mt-3"
                                              onClick={() => {
                                                toast.info('Request documents feature coming soon');
                                              }}
                                            >
                                              <Send className="h-3 w-3 mr-2" />
                                              Request Missing Documents
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <Card>
                                    <CardContent className="py-12 text-center">
                                      {restaurant.business_verified_at ? (
                                        <>
                                          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                          <h3 className="text-xl font-semibold text-green-900 mb-2">Restaurant Verified</h3>
                                          <p className="text-sm text-green-700">
                                            Verified on {format(new Date(restaurant.business_verified_at), 'PPP')}
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                                          <h3 className="text-xl font-semibold text-red-900 mb-2">Application Rejected</h3>
                                          <p className="text-sm text-red-700">Review notes for details</p>
                                        </>
                                      )}
                                    </CardContent>
                                  </Card>
                                )}
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>

                        {!restaurant.business_verified_at && hasAllDocuments(restaurant) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              // Auto-approve flow
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Quick Approve
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast.info('Email feature coming soon');
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Contact
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Document Lightbox Viewer */}
      {viewingDocument && (
        <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
          <DialogContent className="max-w-5xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Document Viewer</DialogTitle>
            </DialogHeader>
            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={viewingDocument}
                alt="Document"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(viewingDocument, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = viewingDocument;
                  link.download = 'document.pdf';
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default RestaurantVerificationDashboard;