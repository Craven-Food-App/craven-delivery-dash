import React, { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Text,
  Paper,
  Badge,
  Loader,
  Center,
  Button,
  Card,
} from '@mantine/core';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';
import { IconFileText, IconDownload } from '@tabler/icons-react';
import dayjs from 'dayjs';

interface CorporateOfficer {
  id: string;
  full_name: string;
  email?: string;
  title: string;
  effective_date: string;
  term_end?: string;
  status: string;
  certificate_url?: string;
  appointed_by?: string;
}

const MyAppointment: React.FC = () => {
  const [officer, setOfficer] = useState<CorporateOfficer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAppointment();
  }, []);

  const fetchMyAppointment = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Find officer by email match
      const { data, error } = await supabase
        .from('corporate_officers')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (error) {
        if (error.code !== '42P01') {
          throw error;
        }
        setOfficer(null);
        return;
      }

      setOfficer(data);
    } catch (error: any) {
      console.error('Error fetching appointment:', error);
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to load appointment',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'green';
      case 'RESIGNED':
        return 'orange';
      case 'REMOVED':
        return 'red';
      case 'EXPIRED':
        return 'gray';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  if (!officer) {
    return (
      <Paper p="xl" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <Center>
          <Stack align="center" gap="md">
            <Text c="dimmed">No appointment found for your account</Text>
            <Text size="sm" c="dimmed">
              If you believe this is an error, please contact the Corporate Secretary.
            </Text>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Card
        padding="lg"
        radius="md"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e7eb',
        }}
      >
        <Stack gap="md">
          <Group justify="space-between">
            <div>
              <Text fw={600} size="xl" c="dark" mb="xs">
                {officer.full_name}
              </Text>
              <Text size="lg" c="dimmed">
                {officer.title}
              </Text>
            </div>
            <Badge color={getStatusColor(officer.status)} size="lg" variant="light">
              {officer.status}
            </Badge>
          </Group>

          <Group>
            <div>
              <Text size="sm" c="dimmed" mb={4}>
                Effective Date
              </Text>
              <Text fw={500} c="dark">
                {dayjs(officer.effective_date).format('MMMM D, YYYY')}
              </Text>
            </div>
            {officer.term_end && (
              <div>
                <Text size="sm" c="dimmed" mb={4}>
                  Term End
                </Text>
                <Text fw={500} c="dark">
                  {dayjs(officer.term_end).format('MMMM D, YYYY')}
                </Text>
              </div>
            )}
          </Group>

          {officer.certificate_url && (
            <Group>
              <Button
                leftSection={<IconDownload size={16} />}
                component="a"
                href={officer.certificate_url}
                target="_blank"
                variant="light"
              >
                Download Certificate
              </Button>
            </Group>
          )}
        </Stack>
      </Card>
    </Stack>
  );
};

export default MyAppointment;
