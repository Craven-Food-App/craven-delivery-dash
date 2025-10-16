import { supabase } from '@/integrations/supabase/client';
import { ApplicationData, ApplicationFiles } from '@/types/application';

export class ApplicationService {
  /**
   * Check if email already exists
   */
  static async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Create or sign in user account
   */
  static async authenticateUser(email: string, password: string, fullName: string, phone: string) {
    // Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/craver-hub`
      }
    });

    // If user already exists, try to sign in
    if (signUpError?.message?.includes('already registered') || signUpError?.status === 422) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw new Error('Email already registered. Please use your existing password to continue.');
      }

      return { user: signInData.user, isNewUser: false };
    }

    if (signUpError) {
      throw new Error(signUpError.message);
    }

    if (!signUpData.user) {
      throw new Error('Failed to create account');
    }

    // Check if email confirmation is required
    if (!signUpData.session) {
      throw new Error('Please check your email to verify your account before continuing.');
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: signUpData.user.id,
        full_name: fullName,
        phone,
        role: 'driver'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    return { user: signUpData.user, isNewUser: true };
  }

  /**
   * Upload a document to storage
   */
  static async uploadDocument(
    userId: string,
    field: string,
    file: File
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `applications/${userId}/${field}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('craver-documents')
      .upload(fileName, file, { upsert: true });

    if (error) {
      throw new Error(`Failed to upload ${field}: ${error.message}`);
    }

    return fileName;
  }

  /**
   * Submit the complete application
   */
  static async submitApplication(
    userId: string,
    data: ApplicationData,
    documentPaths: Record<string, string>
  ) {
    const { error } = await supabase
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
        
        // Tax Information - Full SSN (encrypted in DB)
        ssn_encrypted: data.ssn.replace(/\D/g, ''), // Store digits only
        ssn_last_four: data.ssn.replace(/\D/g, '').slice(-4),
        
        // Payout Information
        payout_method: data.payoutMethod as any,
        
        // Direct Deposit Information (if applicable)
        bank_account_type: data.payoutMethod === 'direct_deposit' ? data.bankAccountType : null,
        routing_number: data.payoutMethod === 'direct_deposit' ? data.routingNumber : null,
        account_number_encrypted: data.payoutMethod === 'direct_deposit' ? data.accountNumber : null,
        account_number_last_four: data.payoutMethod === 'direct_deposit' ? data.accountNumber.slice(-4) : null,
        
        // Cash App Information (if applicable)
        cash_tag: data.payoutMethod === 'cashapp' ? data.cashTag : null,
        drivers_license: documentPaths.driversLicenseFront || 'pending',
        drivers_license_front: documentPaths.driversLicenseFront,
        drivers_license_back: documentPaths.driversLicenseBack,
        insurance_document: documentPaths.insuranceDocument,
        insurance_policy: documentPaths.insuranceDocument || 'N/A',
        insurance_provider: 'N/A',
        vehicle_registration: documentPaths.vehicleRegistration,
        profile_photo: documentPaths.profilePhoto,
        status: 'pending'
      });

    if (error) {
      throw new Error(`Failed to submit application: ${error.message}`);
    }
  }
}
