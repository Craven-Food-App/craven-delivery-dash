import { supabase } from '@/integrations/supabase/client';

export class ApplicationService {
  static async submitApplication(userId: string, data: any, documentPaths: any) {
    console.log('MINIMAL VERSION - Submitting application with basic fields only');
    
    // Submit as waitlist - MINIMAL VERSION
    const { data: application, error } = await supabase
      .from('craver_applications')
      .insert({
        user_id: userId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        street_address: data.streetAddress,
        city: data.city,
        state: data.state,
        zip_code: data.zipCode,
        vehicle_type: data.vehicleType as any,
        vehicle_make: data.vehicleType === 'walking' ? 'N/A' : data.vehicleMake,
        vehicle_model: data.vehicleType === 'walking' ? 'N/A' : data.vehicleModel,
        vehicle_year: data.vehicleType === 'walking' ? 0 : parseInt(data.vehicleYear),
        vehicle_color: data.vehicleType === 'walking' ? 'N/A' : data.vehicleColor,
        license_plate: data.vehicleType === 'walking' ? 'N/A' : data.licensePlate,
        license_number: data.licenseNumber,
        license_state: data.licenseState,
        license_expiry: data.licenseExpiry,
        ssn_last_four: data.ssn.replace(/\D/g, '').slice(-4),
        payout_method: 'direct_deposit',
        drivers_license: 'pending',
        insurance_provider: 'pending',
        insurance_policy: 'pending',
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Application submission error:', error);
      throw new Error(`Failed to submit application: ${error.message}`);
    }

    console.log('Application submitted successfully:', application);
    return application;
  }
}
