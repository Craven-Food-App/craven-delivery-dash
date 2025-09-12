// @ts-nocheck
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, CheckCircle, AlertCircle, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocumentVerificationService } from "@/utils/DocumentVerificationService";
import { Alert, AlertDescription } from "@/components/ui/alert";

const states = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

interface ApplicationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  
  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Vehicle Information
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  licensePlate: string;
  
  // Driver's License
  licenseNumber: string;
  licenseState: string;
  licenseExpiry?: Date;
  
  // Tax Information
  ssnLastFour: string;
  
  // Banking Information
  bankAccountType: string;
  routingNumber: string;
  accountNumberLastFour: string;
}

interface CraverApplicationFormProps {
  onClose: () => void;
}

export const CraverApplicationForm: React.FC<CraverApplicationFormProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApplicationData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    vehicleType: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    licensePlate: "",
    licenseNumber: "",
    licenseState: "",
    ssnLastFour: "",
    bankAccountType: "",
    routingNumber: "",
    accountNumberLastFour: ""
  });
  const [files, setFiles] = useState<Record<string, File>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, any>>({});
  const [verificationLoading, setVerificationLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateData = (field: keyof ApplicationData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (field: string, file: File) => {
    setFiles(prev => ({ ...prev, [field]: file }));
    
    // Start verification for specific document types
    if (field === 'driversLicenseFront' || field === 'insuranceDocument') {
      setVerificationLoading(prev => ({ ...prev, [field]: true }));
      
      try {
        let result;
        if (field === 'driversLicenseFront') {
          result = await DocumentVerificationService.verifyDriversLicense(file, {
            firstName: data.firstName,
            lastName: data.lastName,
            dateOfBirth: data.dateOfBirth || new Date()
          });
        } else if (field === 'insuranceDocument') {
          result = await DocumentVerificationService.verifyInsurance(file);
        }
        
        if (result) {
          setVerificationResults(prev => ({ ...prev, [field]: result }));
          
          if (!result.isValid) {
            toast({
              title: "Document Verification Issues",
              description: result.issues.join(', '),
              variant: "destructive"
            });
          } else {
            toast({
              title: "Document Verified",
              description: `Document verified with ${result.confidence}% confidence`,
            });
          }
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast({
          title: "Verification Error",
          description: "Could not verify document. Please ensure it's clear and readable.",
          variant: "destructive"
        });
      } finally {
        setVerificationLoading(prev => ({ ...prev, [field]: false }));
      }
    }
  };

  const uploadDocument = async (field: string, file: File, applicationId: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `applications/${applicationId}/${field}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('craver-documents')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    return fileName;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create anonymous application without requiring auth
      const applicationId = crypto.randomUUID();

      // Upload documents
      const documentPaths: Record<string, string> = {};
      for (const [field, file] of Object.entries(files)) {
        const path = await uploadDocument(field, file, applicationId);
        if (path) {
          documentPaths[field] = path;
        }
      }

      // Submit application
      const { error } = await (supabase as any)
        .from('craver_applications')
        .insert({
          user_id: null, // Allow applications without user accounts
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.dateOfBirth?.toISOString().split('T')[0],
          street_address: data.streetAddress,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          vehicle_type: data.vehicleType as any,
          vehicle_make: data.vehicleMake,
          vehicle_model: data.vehicleModel,
          vehicle_year: parseInt(data.vehicleYear),
          vehicle_color: data.vehicleColor,
          license_plate: data.licensePlate,
          license_number: data.licenseNumber,
          license_state: data.licenseState,
          license_expiry: data.licenseExpiry?.toISOString().split('T')[0],
          ssn_last_four: data.ssnLastFour,
          bank_account_type: data.bankAccountType,
          routing_number: data.routingNumber,
          account_number_last_four: data.accountNumberLastFour,
          drivers_license_front: documentPaths.driversLicenseFront,
          drivers_license_back: documentPaths.driversLicenseBack,
          insurance_document: documentPaths.insuranceDocument,
          vehicle_registration: documentPaths.vehicleRegistration,
          profile_photo: documentPaths.profilePhoto
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 3-5 business days."
      });
      
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(data.firstName && data.lastName && data.email && data.phone && data.dateOfBirth);
      case 2:
        return !!(data.streetAddress && data.city && data.state && data.zipCode);
      case 3:
        return !!(data.vehicleType && data.licenseNumber && data.licenseState && data.licenseExpiry);
      case 4:
        return !!(data.ssnLastFour && data.bankAccountType);
      case 5:
        return Object.keys(files).length >= 2; // At least license front and profile photo
      default:
        return false;
    }
  };

  const FileUploadField: React.FC<{ field: string; label: string; required?: boolean }> = ({ field, label, required = false }) => {
    const isVerifying = verificationLoading[field];
    const verificationResult = verificationResults[field];
    
    return (
      <div className="space-y-2">
        <Label htmlFor={field}>{label} {required && <span className="text-destructive">*</span>}</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <input
            id={field}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(field, e.target.files[0])}
            className="hidden"
          />
          <label htmlFor={field} className="cursor-pointer">
            {files[field] ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{files[field].name}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Upload className="h-4 w-4" />
                <span className="text-sm">Click to upload</span>
              </div>
            )}
          </label>
          
          {isVerifying && (
            <div className="mt-2 text-sm text-muted-foreground">
              Verifying document...
            </div>
          )}
          
          {verificationResult && (
            <Alert className={`mt-2 ${verificationResult.isValid ? 'border-green-500' : 'border-destructive'}`}>
              <div className="flex items-center gap-2">
                {verificationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription className="text-sm">
                  {verificationResult.isValid 
                    ? `Verified (${verificationResult.confidence}% confidence)`
                    : verificationResult.issues.join(', ')
                  }
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={data.firstName}
                  onChange={(e) => updateData('firstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={data.lastName}
                  onChange={(e) => updateData('lastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateData('email', e.target.value)}
                placeholder="john.doe@email.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={(e) => updateData('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <div className="grid grid-cols-2 gap-4">
                {/* Date Picker Option */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Select from calendar</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !data.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.dateOfBirth ? format(data.dateOfBirth, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={data.dateOfBirth}
                        onSelect={(date) => updateData('dateOfBirth', date)}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Text Input Option */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Or type date (MM/DD/YYYY)</Label>
                  <Input
                    type="date"
                    value={data.dateOfBirth ? data.dateOfBirth.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value);
                        // Adjust for timezone offset to prevent date shifting
                        selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
                        updateData('dateOfBirth', selectedDate);
                      } else {
                        updateData('dateOfBirth', undefined);
                      }
                    }}
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                    className="w-full"
                  />
                </div>
              </div>
              
              {data.dateOfBirth && (
                <div className="text-sm text-muted-foreground mt-2">
                  Selected: {format(data.dateOfBirth, "MMMM do, yyyy")}
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address *</Label>
              <Input
                id="streetAddress"
                value={data.streetAddress}
                onChange={(e) => updateData('streetAddress', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={data.city}
                  onChange={(e) => updateData('city', e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Select value={data.state} onValueChange={(value) => updateData('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                value={data.zipCode}
                onChange={(e) => updateData('zipCode', e.target.value)}
                placeholder="10001"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Vehicle Type *</Label>
              <Select value={data.vehicleType} onValueChange={(value) => updateData('vehicleType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="walking">Walking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {data.vehicleType && data.vehicleType !== 'walking' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleMake">Make</Label>
                    <Input
                      id="vehicleMake"
                      value={data.vehicleMake}
                      onChange={(e) => updateData('vehicleMake', e.target.value)}
                      placeholder="Honda"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Model</Label>
                    <Input
                      id="vehicleModel"
                      value={data.vehicleModel}
                      onChange={(e) => updateData('vehicleModel', e.target.value)}
                      placeholder="Civic"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear">Year</Label>
                    <Input
                      id="vehicleYear"
                      value={data.vehicleYear}
                      onChange={(e) => updateData('vehicleYear', e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleColor">Color</Label>
                    <Input
                      id="vehicleColor"
                      value={data.vehicleColor}
                      onChange={(e) => updateData('vehicleColor', e.target.value)}
                      placeholder="White"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate</Label>
                  <Input
                    id="licensePlate"
                    value={data.licensePlate}
                    onChange={(e) => updateData('licensePlate', e.target.value)}
                    placeholder="ABC-1234"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Driver's License Number *</Label>
              <Input
                id="licenseNumber"
                value={data.licenseNumber}
                onChange={(e) => updateData('licenseNumber', e.target.value)}
                placeholder="DL123456789"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License State *</Label>
                <Select value={data.licenseState} onValueChange={(value) => updateData('licenseState', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>License Expiry *</Label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Date Picker Option */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !data.licenseExpiry && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {data.licenseExpiry ? format(data.licenseExpiry, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={data.licenseExpiry}
                        onSelect={(date) => updateData('licenseExpiry', date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {/* Text Input Option */}
                  <Input
                    type="date"
                    value={data.licenseExpiry ? data.licenseExpiry.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value);
                        selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
                        updateData('licenseExpiry', selectedDate);
                      } else {
                        updateData('licenseExpiry', undefined);
                      }
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                    placeholder="YYYY-MM-DD"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ssnLastFour">Last 4 digits of SSN *</Label>
              <Input
                id="ssnLastFour"
                value={data.ssnLastFour}
                onChange={(e) => updateData('ssnLastFour', e.target.value)}
                placeholder="1234"
                maxLength={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Bank Account Type *</Label>
              <Select value={data.bankAccountType} onValueChange={(value) => updateData('bankAccountType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={data.routingNumber}
                onChange={(e) => updateData('routingNumber', e.target.value)}
                placeholder="123456789"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumberLastFour">Last 4 digits of Account Number</Label>
              <Input
                id="accountNumberLastFour"
                value={data.accountNumberLastFour}
                onChange={(e) => updateData('accountNumberLastFour', e.target.value)}
                placeholder="5678"
                maxLength={4}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Please upload clear photos of the required documents. All uploads are secure and encrypted.
            </div>
            
            <FileUploadField field="driversLicenseFront" label="Driver's License (Front)" required />
            <FileUploadField field="driversLicenseBack" label="Driver's License (Back)" />
            <FileUploadField field="profilePhoto" label="Profile Photo" required />
            
            {data.vehicleType && data.vehicleType !== 'walking' && (
              <>
                <FileUploadField field="insuranceDocument" label="Insurance Document" />
                <FileUploadField field="vehicleRegistration" label="Vehicle Registration" />
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    "Personal Information",
    "Address Information", 
    "Vehicle & License Information",
    "Tax & Banking Information",
    "Document Upload"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Craver Application</CardTitle>
              <CardDescription>Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}</CardDescription>
            </div>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {renderStep()}
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepValid(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid(currentStep) || loading}
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};