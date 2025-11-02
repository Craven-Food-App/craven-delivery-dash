// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Upload, CheckCircle, ArrowRight, FileText, Car, CreditCard, Shield } from 'lucide-react';
import { message } from 'antd';

interface ApplicationData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip_code: string;
  points?: number;
  priority_score?: number;
}

const STEPS = [
  { id: 1, name: 'Identity & Eligibility', icon: FileText },
  { id: 2, name: 'Driver License', icon: Shield },
  { id: 3, name: 'Vehicle Info', icon: Car },
  { id: 4, name: 'Insurance', icon: Shield },
  { id: 5, name: 'Tax & Payments', icon: CreditCard },
  { id: 6, name: 'Background Check Consent', icon: Shield },
  { id: 7, name: 'Sign ICA', icon: FileText }
];

export const PostWaitlistOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        message.error('Please log in to continue');
        navigate('/driver/auth');
        return;
      }

      const { data: application, error } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !application) {
        message.error('No application found');
        navigate('/driver/auth');
        return;
      }

      setApplicationData(application);
      
      // Determine current step based on what's been filled
      if (!application.date_of_birth) {
        setCurrentStep(1);
      } else if (!application.drivers_license || !application.license_state) {
        setCurrentStep(2);
      } else if (!application.vehicle_make) {
        setCurrentStep(3);
      } else if (!application.insurance_provider) {
        setCurrentStep(4);
      } else if (!application.payout_method) {
        setCurrentStep(5);
      } else if (!application.background_check_consent) {
        setCurrentStep(6);
      } else if (!application.contract_signed_at) {
        setCurrentStep(7);
      } else {
        // All done, go to task dashboard
        navigate('/enhanced-onboarding');
      }

      // Pre-populate form data
      setFormData({
        dateOfBirth: application.date_of_birth || '',
        streetAddress: application.street_address || '',
        driversLicenseNumber: application.drivers_license || '',
        driversLicenseState: application.license_state || application.state || '',
        licenseExpiry: application.license_expiry || '',
        vehicleType: application.vehicle_type || '',
        vehicleMake: application.vehicle_make || '',
        vehicleModel: application.vehicle_model || '',
        vehicleYear: application.vehicle_year || '',
        vehicleColor: application.vehicle_color || '',
        licensePlate: application.license_plate || '',
        insuranceProvider: application.insurance_provider || '',
        insurancePolicy: application.insurance_policy || '',
        payoutMethod: application.payout_method || '',
        routingNumber: application.routing_number || '',
        accountNumber: '',
        cashTag: application.cash_tag || ''
      });
    } catch (error) {
      console.error('Error loading application:', error);
      message.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !applicationData) return;

      let updateData: any = {};

      switch (currentStep) {
        case 1: // Identity
          if (!formData.dateOfBirth || !formData.streetAddress) {
            message.error('Please fill in all required fields');
            setSaving(false);
            return;
          }
          updateData = {
            date_of_birth: formData.dateOfBirth,
            street_address: formData.streetAddress
          };
          break;
        case 2: // License
          if (!formData.driversLicenseNumber || !formData.driversLicenseState || !formData.licenseExpiry) {
            message.error('Please fill in all required fields');
            setSaving(false);
            return;
          }
          updateData = {
            drivers_license: formData.driversLicenseNumber,
            license_state: formData.driversLicenseState,
            license_expiry: formData.licenseExpiry
          };
          break;
        case 3: // Vehicle
          if (!formData.vehicleType || !formData.vehicleMake || !formData.vehicleModel || !formData.vehicleYear || !formData.vehicleColor || !formData.licensePlate) {
            message.error('Please fill in all required fields');
            setSaving(false);
            return;
          }
          updateData = {
            vehicle_type: formData.vehicleType,
            vehicle_make: formData.vehicleMake,
            vehicle_model: formData.vehicleModel,
            vehicle_year: parseInt(formData.vehicleYear) || null,
            vehicle_color: formData.vehicleColor,
            license_plate: formData.licensePlate
          };
          break;
        case 4: // Insurance
          if (!formData.insuranceProvider || !formData.insurancePolicy) {
            message.error('Please fill in all required fields');
            setSaving(false);
            return;
          }
          updateData = {
            insurance_provider: formData.insuranceProvider,
            insurance_policy: formData.insurancePolicy
          };
          break;
        case 5: // Tax & Payment
          if (!formData.payoutMethod) {
            message.error('Please select a payout method');
            setSaving(false);
            return;
          }
          if (formData.payoutMethod === 'direct_deposit') {
            if (!formData.routingNumber || !formData.accountNumber) {
              message.error('Please fill in all required fields');
              setSaving(false);
              return;
            }
            updateData = {
              payout_method: 'direct_deposit',
              routing_number: formData.routingNumber,
              account_number_encrypted: formData.accountNumber,
              account_number_last_four: formData.accountNumber.slice(-4)
            };
          } else if (formData.payoutMethod === 'cashapp') {
            if (!formData.cashTag) {
              message.error('Please enter your Cash App tag');
              setSaving(false);
              return;
            }
            updateData = {
              payout_method: 'cashapp',
              cash_tag: formData.cashTag
            };
          }
          break;
        case 6: // Background Check
          updateData = {
            background_check_consent: true,
            background_check_consent_date: new Date().toISOString()
          };
          break;
        case 7: // ICA Sign
          const signatureData = {
            driver_id: applicationData.id,
            agreement_type: 'ICA',
            agreement_version: '2025-01-01',
            typed_name: `${applicationData.first_name} ${applicationData.last_name}`,
            signed_at: new Date().toISOString()
          };
          
          // Try insert, if duplicate then update
          const { error: insertError } = await supabase
            .from('driver_signatures')
            .insert(signatureData);

          if (insertError && insertError.code !== '23505') {
            // If not a duplicate key error, try update instead
            const { error: updateError } = await supabase
              .from('driver_signatures')
              .update({
                agreement_version: signatureData.agreement_version,
                typed_name: signatureData.typed_name,
                signed_at: signatureData.signed_at
              })
              .eq('driver_id', applicationData.id)
              .eq('agreement_type', 'ICA');

            if (updateError) throw updateError;
          } else if (insertError && insertError.code === '23505') {
            throw new Error('Signature already exists');
          }

          updateData = {
            contract_signed_at: new Date().toISOString()
          };
          break;
      }

      // Update application
      const { error: updateError } = await supabase
        .from('craver_applications')
        .update(updateData)
        .eq('id', applicationData.id);

      if (updateError) throw updateError;

      message.success('Information saved!');

      // Award points for completing this step
      await awardPoints(currentStep);

      // Move to next step or complete
      if (currentStep >= STEPS.length) {
        navigate('/enhanced-onboarding');
      } else {
        setCurrentStep(currentStep + 1);
      }
    } catch (error: any) {
      console.error('Error saving data:', error);
      message.error(error.message || 'Failed to save information');
    } finally {
      setSaving(false);
    }
  };

  const awardPoints = async (step: number) => {
    if (!applicationData) return;

    const pointsByStep: Record<number, number> = {
      1: 25,  // Identity
      2: 30,  // License
      3: 30,  // Vehicle
      4: 25,  // Insurance
      5: 35,  // Tax & Payment
      6: 50,  // Background Consent
      7: 50   // ICA
    };

    const pointsToAdd = pointsByStep[step] || 0;
    
    try {
      // Update points and priority score
      const { error: pointsError } = await supabase
        .from('craver_applications')
        .update({
          points: (applicationData.points || 0) + pointsToAdd,
          priority_score: (applicationData.points || 0) + pointsToAdd
        })
        .eq('id', applicationData.id);

      if (pointsError) {
        console.error('Error awarding points:', pointsError);
      } else {
        // Update local state to reflect new points
        setApplicationData({
          ...applicationData,
          points: (applicationData.points || 0) + pointsToAdd
        });
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progressPercentage = (currentStep / STEPS.length) * 100;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!applicationData) return null;

  const CurrentStepIcon = STEPS[currentStep - 1]?.icon || FileText;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Welcome, {applicationData.first_name}! 🎉
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Complete your driver onboarding to start earning
            </p>
          </CardHeader>
        </Card>

        {/* Progress Bar */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} of {STEPS.length}
              </span>
              <span className="text-sm font-medium text-orange-600">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Steps Indicator */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index < currentStep - 1;
                const isCurrent = index === currentStep - 1;

                return (
                  <div key={step.id} className="flex flex-col items-center min-w-0 flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <StepIcon className="h-6 w-6" />
                      )}
                    </div>
                    <p className={`text-xs text-center ${isCurrent ? 'font-bold text-orange-600' : 'text-gray-600'}`}>
                      {step.name}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || saving}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            loading={saving}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            {currentStep === STEPS.length ? 'Complete' : 'Continue'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Verify Identity & Eligibility</h2>
              <p className="text-gray-600">Please provide your personal information</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="streetAddress">Street Address</Label>
                <Input
                  id="streetAddress"
                  value={formData.streetAddress}
                  onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                  placeholder="123 Main St"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={applicationData.city} disabled />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={applicationData.state} disabled />
                </div>
              </div>

              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input id="zip_code" value={applicationData.zip_code} disabled />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">25 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Driver's License Information</h2>
              <p className="text-gray-600">Enter your driver's license details</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="driversLicenseNumber">License Number</Label>
                <Input
                  id="driversLicenseNumber"
                  value={formData.driversLicenseNumber}
                  onChange={(e) => setFormData({ ...formData, driversLicenseNumber: e.target.value })}
                  placeholder="D123456789"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="driversLicenseState">State</Label>
                  <Input
                    id="driversLicenseState"
                    value={formData.driversLicenseState}
                    onChange={(e) => setFormData({ ...formData, driversLicenseState: e.target.value.toUpperCase() })}
                    placeholder="OH"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="licenseExpiry">Expiration Date</Label>
                  <Input
                    id="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Note: You'll need to upload photos of your license front and back in the next phase.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">30 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Car className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Vehicle Information</h2>
              <p className="text-gray-600">Tell us about your delivery vehicle</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="vehicleType">Vehicle Type</Label>
                <select
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Vehicle Type</option>
                  <option value="car">Car</option>
                  <option value="suv">SUV</option>
                  <option value="truck">Truck</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="scooter">Scooter</option>
                  <option value="bike">Bike</option>
                  <option value="walking">Walking</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input
                    id="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                    placeholder="Toyota"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="Camry"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                    placeholder="2020"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">Color</Label>
                  <Input
                    id="vehicleColor"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                    placeholder="Blue"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input
                  id="licensePlate"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  placeholder="ABC1234"
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Note: You'll need to upload vehicle photos in the next phase.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">30 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Insurance Information</h2>
              <p className="text-gray-600">Provide your auto insurance details</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="insuranceProvider">Insurance Company</Label>
                <Input
                  id="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  placeholder="State Farm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="insurancePolicy">Policy Number</Label>
                <Input
                  id="insurancePolicy"
                  value={formData.insurancePolicy}
                  onChange={(e) => setFormData({ ...formData, insurancePolicy: e.target.value })}
                  placeholder="POL123456789"
                  required
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Note: You'll need to upload your insurance card in the next phase.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">25 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CreditCard className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Tax & Payment Setup</h2>
              <p className="text-gray-600">Choose how you want to get paid</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="payoutMethod">Payout Method</Label>
                <select
                  id="payoutMethod"
                  value={formData.payoutMethod}
                  onChange={(e) => setFormData({ ...formData, payoutMethod: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select Payment Method</option>
                  <option value="cashapp">Cash App</option>
                  <option value="direct_deposit">Direct Deposit</option>
                </select>
              </div>

              {formData.payoutMethod === 'cashapp' && (
                <>
                  <div>
                    <Label htmlFor="cashTag">Cash App $Cashtag</Label>
                    <Input
                      id="cashTag"
                      value={formData.cashTag}
                      onChange={(e) => setFormData({ ...formData, cashTag: e.target.value })}
                      placeholder="$YourCashtag"
                      required
                    />
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800">
                      💚 Cash App payouts are instant! You'll receive your earnings immediately.
                    </p>
                  </div>
                </>
              )}

              {formData.payoutMethod === 'direct_deposit' && (
                <>
                  <div>
                    <Label htmlFor="routingNumber">Routing Number</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })}
                      placeholder="123456789"
                      maxLength={9}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      type="password"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="Secure, encrypted storage"
                      required
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      🔒 All banking information is encrypted and secure. This is required for tax reporting.
                    </p>
                  </div>
                </>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> You'll provide your SSN for tax purposes in the next phase if needed.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">35 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Background Check Consent</h2>
              <p className="text-gray-600">Required for driver eligibility</p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6 space-y-4">
              <p className="text-sm text-gray-800 font-medium">
                Background Check Authorization
              </p>
              <p className="text-sm text-gray-700">
                By proceeding, you authorize Crave'N to conduct a background check to verify your eligibility as a driver. This check may include:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-2 ml-4">
                <li>Criminal history search</li>
                <li>Motor vehicle record (MVR) check</li>
                <li>Identity verification</li>
                <li>SSN trace</li>
              </ul>
              <p className="text-sm text-gray-700 font-medium">
                You will be notified of the results within 2-5 business days.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">50 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Sign Independent Contractor Agreement</h2>
              <p className="text-gray-600">Review and sign your ICA</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <p className="text-sm text-gray-800 font-medium">
                Independent Contractor Agreement
              </p>
              <p className="text-sm text-gray-700">
                By clicking "Continue" below, you acknowledge that you have read, understood, and agree to the terms of the Independent Contractor Agreement. This includes:
              </p>
              <ul className="text-sm text-gray-700 list-disc list-inside space-y-2 ml-4">
                <li>Classification as an independent contractor</li>
                <li>Your rights and responsibilities as a driver</li>
                <li>Payment terms and dispute resolution</li>
                <li>Confidentiality and non-compete provisions</li>
              </ul>
              <p className="text-sm text-gray-700">
                Your typed signature below will constitute a legally binding agreement.
              </p>
            </div>

            <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
              <p className="text-sm font-bold text-gray-900">
                Signature: {applicationData.first_name} {applicationData.last_name}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                By proceeding, you electronically sign this document
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> You will earn <Badge className="ml-1">50 points</Badge> for completing this step!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  }
};
