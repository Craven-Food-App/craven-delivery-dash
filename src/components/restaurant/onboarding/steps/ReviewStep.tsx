import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { OnboardingData } from '../RestaurantOnboardingWizard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

interface ReviewStepProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ReviewStep({ data, onBack }: ReviewStepProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!acceptedTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please accept the terms and conditions to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to complete registration',
          variant: 'destructive',
        });
        navigate('/restaurant/auth');
        return;
      }

      // Insert restaurant with all onboarding data
      const { error } = await supabase
        .from('restaurants')
        .insert({
          owner_id: user.id,
          name: data.restaurantName,
          description: data.description,
          cuisine_type: data.cuisineType,
          phone: data.contactPhone,
          email: data.contactEmail,
          address: data.streetAddress,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          logo_url: data.logoUrl,
          image_url: data.coverImageUrl,
          min_delivery_time: data.minPrepTime,
          max_delivery_time: data.maxPrepTime,
          delivery_fee_cents: data.deliveryFeeCents,
          minimum_order_cents: data.minimumOrderCents,
          delivery_radius_miles: data.deliveryRadius,
          is_active: false, // Pending admin approval
          rating: 5.0,
        });

      if (error) throw error;

      // Send welcome email
      await supabase.functions.invoke('send-restaurant-welcome-email', {
        body: {
          restaurantName: data.restaurantName,
          ownerEmail: data.contactEmail,
          ownerName: data.contactName,
        },
      });

      toast({
        title: 'Application Submitted!',
        description: 'Your restaurant has been submitted for review. We\'ll be in touch within 24-48 hours.',
      });

      navigate('/restaurant/dashboard');
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Review & Submit</h2>
        <p className="text-muted-foreground">
          Almost there! Review your information before submitting
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Restaurant Information</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{data.restaurantName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cuisine</dt>
              <dd className="font-medium">{data.cuisineType}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact</dt>
              <dd className="font-medium">{data.contactName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="font-medium">{data.contactPhone}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium">
                {data.streetAddress}, {data.city}, {data.state} {data.zipCode}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Business Details</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Legal Name</dt>
              <dd className="font-medium">{data.legalBusinessName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Business Type</dt>
              <dd className="font-medium capitalize">{data.businessType.replace('_', ' ')}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">EIN</dt>
              <dd className="font-medium">••-•••{data.ein.slice(-4)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Years in Business</dt>
              <dd className="font-medium">{data.yearsInBusiness}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Delivery Settings</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Prep Time</dt>
              <dd className="font-medium">{data.minPrepTime}-{data.maxPrepTime} min</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Delivery Fee</dt>
              <dd className="font-medium">${(data.deliveryFeeCents / 100).toFixed(2)}</dd>
            </div>
          </dl>
        </Card>

        <div className="border-t pt-6">
          <div className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="cursor-pointer">
                <p className="font-medium">I accept the terms and conditions *</p>
                <p className="text-sm text-muted-foreground mt-1">
                  By submitting, you agree to Crave'N's{' '}
                  <a href="/terms" className="text-primary hover:underline">Terms of Service</a>,{' '}
                  <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>, and{' '}
                  Partnership Agreement. You understand that Crave'N will charge a commission on each order.
                </p>
              </Label>
            </div>
          </div>
        </div>

        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-900">
            <strong>🎉 What happens next?</strong><br />
            Our team will review your application within 24-48 hours. Once approved, 
            you'll receive an email with next steps to activate your restaurant and start receiving orders!
          </p>
        </Card>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button onClick={onBack} variant="outline" size="lg" disabled={isSubmitting}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!acceptedTerms || isSubmitting} 
          size="lg"
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Application
              <CheckCircle className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
