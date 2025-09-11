import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Car, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle, 
  XCircle,
  Eye
} from 'lucide-react';
import { formatDate } from 'date-fns';

interface Application {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  vehicle_type: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  license_plate: string;
  drivers_license: string;
  insurance_policy: string;
  insurance_provider: string;
  background_check: boolean;
  vehicle_inspection: boolean;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profile_photo?: string;
}

interface ApplicationCardProps {
  application: Application;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, notes: string) => void;
  onViewDocument: (documentPath: string, documentName: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ 
  application, 
  onApprove, 
  onReject, 
  onViewDocument 
}) => {
  const [reviewNotes, setReviewNotes] = React.useState('');

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: 'Pending Review' },
      under_review: { variant: 'default' as const, label: 'Under Review' },
      approved: { variant: 'default' as const, label: 'Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatApplicationDate = (dateString: string) => {
    return formatDate(new Date(dateString), 'MMM dd, yyyy');
  };

  const handleViewDocument = (documentPath: string | undefined, documentName: string) => {
    if (documentPath) {
      onViewDocument(documentPath, documentName);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {application.first_name} {application.last_name}
          </CardTitle>
          {getStatusBadge(application.status)}
        </div>
        <div className="text-sm text-muted-foreground">
          Submitted: {formatApplicationDate(application.created_at)}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <span className="text-sm">{application.email}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-green-600" />
            <span className="text-sm">{application.phone}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <span className="text-sm">DOB: {formatApplicationDate(application.date_of_birth)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span className="text-sm">{application.city}, {application.state}</span>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicle Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <span><strong>Type:</strong> {application.vehicle_type}</span>
            <span><strong>Make/Model:</strong> {application.vehicle_make} {application.vehicle_model}</span>
            <span><strong>Year:</strong> {application.vehicle_year}</span>
            <span><strong>License Plate:</strong> {application.license_plate}</span>
          </div>
        </div>

        {/* Documents */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewDocument(application.profile_photo, 'Profile Photo')}
              disabled={!application.profile_photo}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Profile
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewDocument(application.drivers_license, 'Drivers License')}
              disabled={!application.drivers_license}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              License
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleViewDocument(application.insurance_policy, 'Insurance Policy')}
              disabled={!application.insurance_policy}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Insurance
            </Button>
          </div>
        </div>

        {/* Review Section */}
        {application.status === 'pending' && (
          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor={`notes-${application.id}`}>Review Notes</Label>
              <Textarea
                id={`notes-${application.id}`}
                placeholder="Add notes about your review decision..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => onApprove(application.id, reviewNotes)}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              
              <Button 
                variant="destructive"
                onClick={() => onReject(application.id, reviewNotes)}
                className="flex items-center gap-1"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;