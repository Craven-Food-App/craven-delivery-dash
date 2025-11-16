import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, TextInput, Stack, Grid, Text, Group, Box } from '@mantine/core';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';

export const ProfileCompletionForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (application) {
        setProfile({
          firstName: application.first_name || '',
          lastName: application.last_name || '',
          phone: application.phone || '',
          email: application.email || '',
          streetAddress: application.street_address || '',
          city: application.city || '',
          state: application.state || '',
          zipCode: application.zip_code || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: application } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!application) return;

      // Update application
      const { error: updateError } = await supabase
        .from('craver_applications')
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          email: profile.email,
          street_address: profile.streetAddress,
          city: profile.city,
          state: profile.state,
          zip_code: profile.zipCode
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Complete the task
      const { data: task } = await supabase
        .from('onboarding_tasks')
        .select('id')
        .eq('driver_id', application.id)
        .eq('task_key', 'complete_profile')
        .single();

      if (task) {
        await supabase.functions.invoke('complete-onboarding-task', {
          body: {
            task_id: task.id,
            driver_id: application.id,
          },
        });
      }

      toast({
        title: "Profile Updated! ✅",
        description: "Your personal information has been saved.",
      });

      navigate('/enhanced-onboarding');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-gray-0)', padding: 24 }}>
      <Box style={{ maxWidth: 672, margin: '0 auto' }}>
        <Button
          variant="subtle"
          onClick={() => navigate('/enhanced-onboarding')}
          mb="md"
          leftSection={<ArrowLeft size={16} />}
        >
          Back to Onboarding
        </Button>

        <Card>
          <Stack gap="md" p="lg">
            <div>
              <Text fw={600} size="lg" mb="xs">Complete Your Profile</Text>
              <Text size="sm" c="dimmed">
                Fill in your personal information to complete this task
              </Text>
            </div>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="First Name"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Last Name"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />

            <TextInput
              label="Phone Number"
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />

            <TextInput
              label="Street Address"
              value={profile.streetAddress}
              onChange={(e) => setProfile({ ...profile, streetAddress: e.target.value })}
            />

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="City"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="State"
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Zip Code"
                  value={profile.zipCode}
                  onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                />
              </Grid.Col>
            </Grid>

            <Button
              onClick={handleSave}
              disabled={loading}
              fullWidth
              color="#ff7a00"
              leftSection={<Save size={16} />}
            >
              {loading ? 'Saving...' : 'Save & Complete Task'}
            </Button>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
};
