import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileCheck,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Building2,
  User,
  Shield,
  Heart,
  Calendar,
  AlertCircle,
  Clock,
  Star,
  Grid3X3,
  FileText,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import type { RestaurantOnboardingData } from '../types';
import { hasAllDocuments, getMissingDocuments } from '../utils/helpers';
import { DocumentImageViewer } from './components/DocumentImageViewer';
import { VerificationChecklist } from './components/VerificationChecklist';
import { RejectionTemplates } from './components/RejectionTemplates';
import { DocumentQualityScore } from './components/DocumentQualityScore';
import { VerificationHistory } from './components/VerificationHistory';

interface EnhancedDocumentVerificationPanelProps {
  restaurant: RestaurantOnboardingData | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (restaurantId: string, notes: string, checklistData: any) => Promise<void>;
  onReject: (restaurantId: string, notes: string, reason: string) => Promise<void>;
}

export function EnhancedDocumentVerificationPanel({
  restaurant,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: EnhancedDocumentVerificationPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checklistComplete, setChecklistComplete] = useState(false);
  const [checklistData, setChecklistData] = useState<any>({});
  const [selectedRejectionReason, setSelectedRejectionReason] = useState('');

  if (!restaurant) return null;

  const documents = [
    {
      key: 'business_license',
      label: 'Business License',
      url: restaurant.restaurant.business_license_url,
      icon: Building2,
      required: true,
      description: 'Valid business license from local authority',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'owner_id',
      label: 'Owner ID',
      url: restaurant.restaurant.owner_id_url,
      icon: User,
      required: true,
      description: 'Government-issued identification',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'insurance',
      label: 'Insurance Certificate',
      url: restaurant.restaurant.insurance_certificate_url,
      icon: Shield,
      required: false,
      description: 'Liability insurance certificate',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      key: 'health_permit',
      label: 'Health Permit',
      url: restaurant.restaurant.health_permit_url,
      icon: Heart,
      required: false,
      description: 'Health department permit',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const uploadedDocs = documents.filter(d => d.url);
  const missingDocs = getMissingDocuments(restaurant);
  const completionPercentage = (uploadedDocs.length / documents.length) * 100;
  const requiredDocsPresent = documents.filter(d => d.required && d.url).length === documents.filter(d => d.required).length;

  const handleApprove = async () => {
    if (!checklistComplete) {
      toast.error('Please complete the verification checklist');
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await onApprove(restaurant.restaurant_id, notes, checklistData);
      toast.success('Restaurant verified successfully!');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error approving restaurant:', error);
      toast.error('Failed to approve restaurant');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim() && !selectedRejectionReason) {
      toast.error('Please provide rejection notes or select a reason');
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const rejectionNotes = selectedRejectionReason || notes;
      await onReject(restaurant.restaurant_id, rejectionNotes, selectedRejectionReason);
      toast.success('Restaurant verification rejected');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      toast.error('Failed to reject restaurant');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setNotes('');
    setChecklistComplete(false);
    setChecklistData({});
    setSelectedRejectionReason('');
    setActiveTab('overview');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-2xl flex items-center gap-2">
              <FileCheck className="h-6 w-6 text-primary" />
              Enhanced Document Verification
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={requiredDocsPresent ? 'default' : 'destructive'}>
                {uploadedDocs.length}/{documents.length} Documents
              </Badge>
              {restaurant.business_info_verified && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Previously Verified
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Restaurant Info Header */}
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Restaurant</p>
                <p className="font-semibold text-sm">{restaurant.restaurant.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Location</p>
                <p className="font-semibold text-sm">
                  {restaurant.restaurant.city}, {restaurant.restaurant.state}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cuisine</p>
                <p className="font-semibold text-sm">{restaurant.restaurant.cuisine_type || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Applied</p>
                <p className="font-semibold text-sm">
                  {new Date(restaurant.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Grid3X3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="checklist">
              <CheckCircle className="h-4 w-4 mr-2" />
              Checklist
            </TabsTrigger>
            <TabsTrigger value="quality">
              <Star className="h-4 w-4 mr-2" />
              Quality
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="decision">
              <FileCheck className="h-4 w-4 mr-2" />
              Decision
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-4">
              {/* Document Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {documents.map((doc) => {
                  const Icon = doc.icon;
                  const hasDoc = !!doc.url;

                  return (
                    <Card
                      key={doc.key}
                      className={`border-2 ${hasDoc ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-2">
                          <Icon className={`h-8 w-8 ${doc.color}`} />
                          {hasDoc ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <h4 className="font-semibold text-sm mb-1">{doc.label}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{doc.description}</p>
                        {doc.required && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                        {hasDoc && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => setActiveTab('documents')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Missing Documents Alert */}
              {missingDocs.length > 0 && (
                <Card className="border-yellow-300 bg-yellow-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-yellow-900 mb-2">Missing Documents</h4>
                        <ul className="space-y-1">
                          {missingDocs.map((doc) => (
                            <li key={doc} className="text-sm text-yellow-800">
                              • {doc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('documents')}
                  className="h-20"
                >
                  <div className="text-center">
                    <Eye className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm">View All Docs</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('checklist')}
                  className="h-20"
                >
                  <div className="text-center">
                    <CheckCircle className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm">Start Verification</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('decision')}
                  className="h-20"
                >
                  <div className="text-center">
                    <FileCheck className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm">Make Decision</span>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab - Side by Side Viewer */}
          <TabsContent value="documents" className="flex-1 overflow-hidden mt-4">
            <DocumentImageViewer documents={documents} restaurant={restaurant} />
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="flex-1 overflow-y-auto mt-4">
            <VerificationChecklist
              restaurant={restaurant}
              documents={documents}
              onChecklistComplete={(isComplete, data) => {
                setChecklistComplete(isComplete);
                setChecklistData(data);
              }}
            />
          </TabsContent>

          {/* Quality Tab */}
          <TabsContent value="quality" className="flex-1 overflow-y-auto mt-4">
            <DocumentQualityScore
              documents={documents}
              restaurant={restaurant}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
            <VerificationHistory restaurantId={restaurant.restaurant_id} />
          </TabsContent>

          {/* Decision Tab */}
          <TabsContent value="decision" className="flex-1 overflow-y-auto mt-4">
            <div className="space-y-6">
              {/* Approval Section */}
              <Card className="border-green-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    Approve Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!checklistComplete && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Please complete the verification checklist before approving
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
                    <Textarea
                      id="approval-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about this verification..."
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleApprove}
                    disabled={!checklistComplete || isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Approve & Verify Restaurant
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Rejection Section */}
              <Card className="border-red-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    Reject Verification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RejectionTemplates
                    onSelectReason={(reason) => {
                      setSelectedRejectionReason(reason);
                      setNotes(reason);
                    }}
                    selectedReason={selectedRejectionReason}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="rejection-notes">Rejection Notes *</Label>
                    <Textarea
                      id="rejection-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Provide detailed reasons for rejection..."
                      rows={4}
                      required
                    />
                  </div>

                  <Button
                    onClick={handleReject}
                    disabled={isProcessing || !notes.trim()}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Clock className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 mr-2" />
                        Reject Application
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Quick Stats */}
        <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              {uploadedDocs.length}/{documents.length} Uploaded
            </span>
            {checklistComplete && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Checklist Complete
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

