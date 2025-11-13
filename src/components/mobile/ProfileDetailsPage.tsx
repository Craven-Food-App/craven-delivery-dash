import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ProfileDetailsPageProps = {
  onBack: () => void;
};

const ProfileDetailsPage: React.FC<ProfileDetailsPageProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      // Fetch driver profile
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      // Fetch user profile from drivers table if exists
      // Note: drivers table uses auth_user_id and has different column names
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id, full_name, email, phone, city, zip')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (driverData) {
        setProfile(driverData);
        // Parse full_name into first and last name
        const nameParts = (driverData.full_name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        setFormData({
          firstName,
          lastName,
          email: authUser.email || driverData.email || '',
          phone: driverData.phone || '',
          dateOfBirth: '', // date_of_birth is encrypted in driver_identity table, not accessible directly
          streetAddress: '', // Not stored in drivers table
          city: driverData.city || '',
          state: '', // Not stored in drivers table
          zipCode: driverData.zip || '',
        });
      } else if (driverProfile) {
        setProfile(driverProfile);
        setFormData({
          firstName: authUser.user_metadata?.first_name || authUser.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: authUser.user_metadata?.last_name || authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || '',
          dateOfBirth: '',
          streetAddress: '',
          city: '',
          state: '',
          zipCode: '',
        });
      } else {
        // Use auth user data
        const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || '';
        const nameParts = fullName.split(' ');
        setFormData({
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: authUser.email || '',
          phone: authUser.user_metadata?.phone || '',
          dateOfBirth: '',
          streetAddress: '',
          city: '',
          state: '',
          zipCode: '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error('Not authenticated');
        return;
      }

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      if (!fullName) {
        toast.error('Name is required');
        return;
      }

      // Update drivers table if exists
      // Note: drivers table uses auth_user_id and full_name (not first_name/last_name)
      const { data: existingDriver, error: checkError } = await supabase
        .from('drivers')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking driver:', checkError);
        throw checkError;
      }

      const updateData: any = {
        full_name: fullName,
        phone: formData.phone || null,
        city: formData.city || null,
        zip: formData.zipCode || null,
      };

      if (existingDriver) {
        console.log('Updating driver:', existingDriver.id, updateData);
        const { data, error } = await supabase
          .from('drivers')
          .update(updateData)
          .eq('auth_user_id', authUser.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Update successful:', data);
      } else {
        // Create driver record
        const insertData: any = {
          auth_user_id: authUser.id,
          full_name: fullName,
          email: formData.email || authUser.email,
          phone: formData.phone || null,
          city: formData.city || null,
          zip: formData.zipCode || null,
          status: 'started',
        };

        console.log('Inserting driver:', insertData);
        const { data, error } = await supabase
          .from('drivers')
          .insert(insertData)
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('Insert successful:', data);
      }

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          phone: formData.phone,
        }
      });

      if (authError) {
        console.error('Auth update error:', authError);
        // Don't fail the whole operation if auth update fails
      }

      toast.success('Profile updated successfully');
      // Refresh the data
      await fetchProfileData();
      setTimeout(() => onBack(), 500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      const errorMessage = error?.message || error?.details || 'Failed to save profile';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-50 overflow-y-auto" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between safe-area-top">
        <button onClick={onBack} className="text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-gray-900 text-xl font-bold">Profile Information</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-orange-600 font-bold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Form */}
      <div className="px-6 py-6 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Personal Information</h2>
              <p className="text-sm text-gray-500">Update your personal details</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 font-semibold mb-2 block">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-semibold mb-2 block">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-2 block flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
              placeholder="Email"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-2 block flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-2 block flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Address</h2>
              <p className="text-sm text-gray-500">Your current address</p>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-2 block">Street Address</label>
            <input
              type="text"
              value={formData.streetAddress}
              onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
              placeholder="123 Main St"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 font-semibold mb-2 block">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 font-semibold mb-2 block">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
                placeholder="State"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 font-semibold mb-2 block">Zip Code</label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:outline-none"
              placeholder="12345"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDetailsPage;

