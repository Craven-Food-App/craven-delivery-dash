import React, { useState, useEffect } from 'react';
import { ArrowLeft, Car, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VehicleManagementSectionProps {
  onBack: () => void;
}

export const VehicleManagementSection: React.FC<VehicleManagementSectionProps> = ({ onBack }) => {
  const [vehicleInfo, setVehicleInfo] = useState({
    vehicle_type: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    vehicle_color: '',
    license_plate: ''
  });
  const [documents, setDocuments] = useState({
    drivers_license: false,
    vehicle_registration: false,
    insurance: false
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicleInfo();
  }, []);

  const fetchVehicleInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select(`
          vehicle_type,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          vehicle_color,
          license_plate,
          drivers_license_front,
          drivers_license_back,
          vehicle_registration,
          insurance_document
        `)
        .eq('user_id', user.id)
        .single();

      if (application) {
        setVehicleInfo({
          vehicle_type: application.vehicle_type || '',
          vehicle_make: application.vehicle_make || '',
          vehicle_model: application.vehicle_model || '',
          vehicle_year: application.vehicle_year?.toString() || '',
          vehicle_color: application.vehicle_color || '',
          license_plate: application.license_plate || ''
        });

        setDocuments({
          drivers_license: !!(application.drivers_license_front && application.drivers_license_back),
          vehicle_registration: !!application.vehicle_registration,
          insurance: !!application.insurance_document
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle info:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('craver_applications')
        .update({
          vehicle_make: vehicleInfo.vehicle_make,
          vehicle_model: vehicleInfo.vehicle_model,
          vehicle_year: parseInt(vehicleInfo.vehicle_year),
          vehicle_color: vehicleInfo.vehicle_color,
          license_plate: vehicleInfo.license_plate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Vehicle updated",
        description: "Your vehicle information has been saved."
      });
    } catch (error) {
      toast({
        title: "Error updating vehicle",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (type: string) => {
    switch(type) {
      case 'car': return '🚗';
      case 'bike': return '🚲';
      case 'scooter': return '🛴';
      case 'motorcycle': return '🏍️';
      case 'walking': return '🚶';
      default: return '🚗';
    }
  };

  const getDocumentStatus = (isUploaded: boolean) => {
    return isUploaded ? (
      <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Uploaded
      </Badge>
    ) : (
      <Badge variant="outline" className="border-orange-200 text-orange-600">
        <AlertCircle className="h-3 w-3 mr-1" />
        Required
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-background border-b border-border/50 px-4 py-3 sticky top-0 z-10 safe-area-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Vehicle Management</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Current Vehicle */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">{getVehicleIcon(vehicleInfo.vehicle_type)}</span>
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Select
                  value={vehicleInfo.vehicle_type}
                  onValueChange={(value) => setVehicleInfo({ ...vehicleInfo, vehicle_type: value })}
                  disabled
                >
                  <SelectTrigger className="mt-1 bg-muted/50">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="bike">Bicycle</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="walking">Walking</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact support to change vehicle type
                </p>
              </div>

              {vehicleInfo.vehicle_type !== 'walking' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="vehicle_make">Make</Label>
                      <Input
                        id="vehicle_make"
                        value={vehicleInfo.vehicle_make}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, vehicle_make: e.target.value })}
                        className="mt-1"
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_model">Model</Label>
                      <Input
                        id="vehicle_model"
                        value={vehicleInfo.vehicle_model}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, vehicle_model: e.target.value })}
                        className="mt-1"
                        placeholder="Camry"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="vehicle_year">Year</Label>
                      <Input
                        id="vehicle_year"
                        type="number"
                        value={vehicleInfo.vehicle_year}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, vehicle_year: e.target.value })}
                        className="mt-1"
                        placeholder="2020"
                        min="1990"
                        max="2025"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicle_color">Color</Label>
                      <Input
                        id="vehicle_color"
                        value={vehicleInfo.vehicle_color}
                        onChange={(e) => setVehicleInfo({ ...vehicleInfo, vehicle_color: e.target.value })}
                        className="mt-1"
                        placeholder="Silver"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="license_plate">License Plate</Label>
                    <Input
                      id="license_plate"
                      value={vehicleInfo.license_plate}
                      onChange={(e) => setVehicleInfo({ ...vehicleInfo, license_plate: e.target.value.toUpperCase() })}
                      className="mt-1"
                      placeholder="ABC123"
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Required Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Required Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">Driver's License</div>
                  <div className="text-sm text-muted-foreground">Front and back photos</div>
                </div>
                <div className="flex items-center gap-2">
                  {getDocumentStatus(documents.drivers_license)}
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
              </div>

              {vehicleInfo.vehicle_type !== 'walking' && vehicleInfo.vehicle_type !== 'bike' && (
                <>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Vehicle Registration</div>
                      <div className="text-sm text-muted-foreground">Current registration document</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDocumentStatus(documents.vehicle_registration)}
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Insurance</div>
                      <div className="text-sm text-muted-foreground">Valid insurance policy</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDocumentStatus(documents.insurance)}
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <strong>Note:</strong> All documents must be current and clearly readable. 
                Document updates may require approval before you can continue driving.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};