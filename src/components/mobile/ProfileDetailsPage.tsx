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
      const { data: driverData } = await supabase
        .from('drivers')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (driverData) {
        setProfile(driverData);
        setFormData({
          firstName: driverData.first_name || '',
          lastName: driverData.last_name || '',
          email: authUser.email || driverData.email || '',
          phone: driverData.phone || '',
          dateOfBirth: driverData.date_of_birth || '',
          streetAddress: driverData.street_address || '',
          city: driverData.city || '',
          state: driverData.state || '',
          zipCode: driverData.zip_code || '',
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
      if (!authUser) return;

      // Update drivers table if exists
      const { data: existingDriver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (existingDriver) {
        const { error } = await supabase
          .from('drivers')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth || null,
            street_address: formData.streetAddress || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zipCode || null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', authUser.id);

        if (error) throw error;
      } else {
        // Create driver record
        const { error } = await supabase
          .from('drivers')
          .insert({
            user_id: authUser.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            date_of_birth: formData.dateOfBirth || null,
            street_address: formData.streetAddress || null,
            city: formData.city || null,
            state: formData.state || null,
            zip_code: formData.zipCode || null,
          });

        if (error) throw error;
      }

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone,
        }
      });

      toast.success('Profile updated successfully');
      onBack();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
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

