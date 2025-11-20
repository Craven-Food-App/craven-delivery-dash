import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  TextInput,
  NumberInput,
  Select,
  Button,
  Group,
  Alert,
  Loader,
  Switch,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCoins, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';

const EquityGrantForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient_user_id: '',
    recipient_email: '',
    shares_amount: 0,
    share_class: 'Common',
    vesting_type: 'graded',
    vesting_period_months: 48,
    cliff_months: 12,
    start_date: null as Date | null,
    resolution_id: '',
  });

  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .limit(100);

      if (error) throw error;

      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      const userList = (data || []).map(profile => ({
        id: profile.user_id,
        email: authUsers?.users.find(u => u.id === profile.user_id)?.email || '',
        full_name: profile.full_name || '',
      }));

      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const searchUser = async (email: string) => {
    if (!email) return;
    
    setSearching(true);
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      // @ts-ignore - listUsers type mismatch
      const foundUser = authUsers?.users?.find(u => u.email?.toLowerCase().includes(email.toLowerCase()));
      
      if (foundUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', foundUser.id)
          .maybeSingle();

        setFormData({
          ...formData,
          recipient_user_id: foundUser.id,
          recipient_email: foundUser.email || '',
        });
      }
    } catch (error) {
      console.error('Error searching user:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('governance-grant-equity', {
        body: {
          recipient_user_id: formData.recipient_user_id,
          shares_amount: formData.shares_amount,
          share_class: formData.share_class,
          vesting_type: formData.vesting_type,
          vesting_period_months: formData.vesting_period_months,
          cliff_months: formData.cliff_months,
          start_date: formData.start_date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          resolution_id: formData.resolution_id || null,
        },
      });

      if (error) throw error;

      notifications.show({
        title: 'Success',
        message: 'Equity grant created successfully',
        color: 'green',
        icon: <IconCheck size={16} />,
      });

      // Reset form
      setFormData({
        recipient_user_id: '',
        recipient_email: '',
        shares_amount: 0,
        share_class: 'Common',
        vesting_type: 'graded',
        vesting_period_months: 48,
        cliff_months: 12,
        start_date: null,
        resolution_id: '',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to create equity grant',
        color: 'red',
        icon: <IconAlertCircle size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2} c="dark" mb="xs">
            <IconCoins size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />
            Create Equity Grant
          </Title>
          <Text c="dimmed">
            Grant equity to executives and key personnel. This will create a vesting schedule and update the cap table.
          </Text>
        </div>

        <Card padding="lg" radius="md" withBorder>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Recipient Email"
                placeholder="Enter recipient email to search"
                value={formData.recipient_email}
                onChange={(e) => {
                  setFormData({ ...formData, recipient_email: e.target.value });
                  searchUser(e.target.value);
                }}
                required
              />

              {formData.recipient_user_id && (
                <Alert icon={<IconCheck size={16} />} color="green" title="User Found">
                  Equity will be granted to this user.
                </Alert>
              )}

              <NumberInput
                label="Shares Amount"
                placeholder="Enter number of shares"
                value={formData.shares_amount}
                onChange={(value) => setFormData({ ...formData, shares_amount: Number(value) || 0 })}
                required
                min={0}
                thousandSeparator=","
              />

              <Select
                label="Share Class"
                data={[
                  { value: 'Common', label: 'Common Stock' },
                  { value: 'Preferred', label: 'Preferred Stock' },
                ]}
                value={formData.share_class}
                onChange={(value) => setFormData({ ...formData, share_class: value || 'Common' })}
              />

              <Select
                label="Vesting Type"
                data={[
                  { value: 'graded', label: 'Graded (Monthly)' },
                  { value: 'cliff', label: 'Cliff (All at once)' },
                  { value: 'immediate', label: 'Immediate (No vesting)' },
                ]}
                value={formData.vesting_type}
                onChange={(value) => setFormData({ ...formData, vesting_type: value || 'graded' })}
                required
              />

              {formData.vesting_type !== 'immediate' && (
                <>
                  <NumberInput
                    label="Vesting Period (Months)"
                    value={formData.vesting_period_months}
                    onChange={(value) => setFormData({ ...formData, vesting_period_months: Number(value) || 48 })}
                    required
                    min={1}
                  />

                  {formData.vesting_type === 'cliff' && (
                    <NumberInput
                      label="Cliff Period (Months)"
                      value={formData.cliff_months}
                      onChange={(value) => setFormData({ ...formData, cliff_months: Number(value) || 12 })}
                      required
                      min={0}
                    />
                  )}
                </>
              )}

              <DateInput
                label="Grant Start Date"
                placeholder="Select start date"
                value={formData.start_date}
                onChange={(value) => setFormData({ ...formData, start_date: value })}
              />

              <TextInput
                label="Resolution ID (Optional)"
                placeholder="Link to board resolution"
                value={formData.resolution_id}
                onChange={(e) => setFormData({ ...formData, resolution_id: e.target.value })}
              />

              <Group justify="flex-end" mt="md">
                <Button
                  type="submit"
                  leftSection={<IconCheck size={16} />}
                  loading={loading}
                  disabled={!formData.recipient_user_id || !formData.shares_amount}
                >
                  Create Equity Grant
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
};

export default EquityGrantForm;

