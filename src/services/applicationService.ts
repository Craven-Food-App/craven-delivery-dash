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
   * Get background check delay from admin settings
   */
  static async getBackgroundCheckDelay(): Promise<number> {
    try {
      const { data } = await supabase
        .from('admin_settings' as any)
        .select('setting_value')
        .eq('setting_key', 'background_check_delay_days')
        .single();

      if ((data as any)?.setting_value?.default) {
        return parseInt((data as any).setting_value.default);
      }
      return 3; // Default to 3 days
    } catch {
      return 3; // Default to 3 days if setting not found
    }
  }

  /**
   * Submit the complete application
   */
  static async submitApplication(
    userId: string,
    data: ApplicationData,
    documentPaths: Record<string, string>,
    referralCode?: string
  ) {
    const now = new Date();

    // Check for referral code
    let referredBy = null;
    if (referralCode) {
      const { data: referrer } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('referral_code', referralCode)
        .single();
      
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // Submit application - MINIMAL VERSION with only existing table fields
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
        vehicle_type: data.vehicleType,
        vehicle_make: data.vehicleType === 'walking' ? 'N/A' : (data.vehicleMake || 'N/A'),
        vehicle_model: data.vehicleType === 'walking' ? 'N/A' : (data.vehicleModel || 'N/A'),
        vehicle_year: data.vehicleType === 'walking' ? 0 : (parseInt(data.vehicleYear) || 0),
        vehicle_color: data.vehicleType === 'walking' ? 'N/A' : (data.vehicleColor || 'N/A'),
        license_plate: data.vehicleType === 'walking' ? 'N/A' : (data.licensePlate || 'N/A'),
        drivers_license: documentPaths.driversLicenseFront || 'pending',
        insurance_provider: 'pending',
        insurance_policy: 'pending',
        background_check: false,
        vehicle_inspection: false,
        profile_photo: documentPaths.profilePhoto,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit application: ${error.message}`);
    }

    return application;
  }

  /**
   * Get driver's onboarding progress and queue position
   */
  static async getDriverProgress(userId: string) {
    const { data: application } = await supabase
      .from('craver_applications')
      .select(`
        *,
        regions!inner(name, status, active_quota)
      `)
      .eq('user_id', userId)
      .single();

    if (!application) {
      throw new Error('Driver application not found');
    }

    // Get onboarding tasks
    const { data: tasks } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('driver_id', application.id)
      .order('created_at');

    // Get queue position
    const { data: queuePosition } = await supabase
      .rpc('get_driver_queue_position', { driver_uuid: application.id });

    return {
      application,
      tasks: tasks || [],
      queuePosition: queuePosition?.[0] || null
    };
  }

  /**
   * Complete an onboarding task and award points
   */
  static async completeTask(userId: string, taskKey: string) {
    const { data: application } = await supabase
      .from('craver_applications')
      .select('id, points, priority_score')
      .eq('user_id', userId)
      .single();

    if (!application) {
      throw new Error('Driver application not found');
    }

    // Get task details
    const { data: task } = await supabase
      .from('onboarding_tasks')
      .select('*')
      .eq('driver_id', application.id)
      .eq('task_key', taskKey)
      .single();

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.completed) {
      throw new Error('Task already completed');
    }

    // Mark task as completed
    const { error: taskError } = await supabase
      .from('onboarding_tasks')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', task.id);

    if (taskError) {
      throw new Error(`Failed to complete task: ${taskError.message}`);
    }

    // Award points and update priority score
    const newPoints = application.points + task.points_reward;
    const newPriorityScore = application.priority_score + task.points_reward;

    const { error: updateError } = await supabase
      .from('craver_applications')
      .update({
        points: newPoints,
        priority_score: newPriorityScore
      })
      .eq('id', application.id);

    if (updateError) {
      throw new Error(`Failed to update points: ${updateError.message}`);
    }

    return {
      pointsAwarded: task.points_reward,
      totalPoints: newPoints,
      priorityScore: newPriorityScore
    };
  }

  /**
   * Get referral code for a driver
   */
  static async getReferralCode(userId: string) {
    const { data: application } = await supabase
      .from('craver_applications')
      .select('referral_code')
      .eq('user_id', userId)
      .single();

    if (!application) {
      throw new Error('Driver application not found');
    }

    // Generate referral code if not exists
    if (!application.referral_code) {
      const referralCode = `CRV${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const { error } = await supabase
        .from('craver_applications')
        .update({ referral_code: referralCode })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to generate referral code: ${error.message}`);
      }

      return referralCode;
    }

    return application.referral_code;
  }

  /**
   * Get region capacity status
   */
  static async getRegionCapacity(regionId: number) {
    const { data } = await supabase
      .rpc('get_region_capacity_status', { region_id_param: regionId });

    return data?.[0] || null;
  }
}
