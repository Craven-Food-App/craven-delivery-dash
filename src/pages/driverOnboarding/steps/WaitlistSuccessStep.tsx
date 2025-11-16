import React, { useState, useEffect } from 'react';
import { Card, Text, Stack, Alert, Divider, Box, Loader } from '@mantine/core';
import { CheckCircle, Clock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface WaitlistSuccessStepProps {
  applicationData: any;
}

export const WaitlistSuccessStep: React.FC<WaitlistSuccessStepProps> = ({ applicationData }) => {
  const navigate = useNavigate();
  const [queuePosition, setQueuePosition] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueuePosition();
  }, []);

  const fetchQueuePosition = async () => {
    if (!applicationData?.applicationId) return;

    try {
      const { data, error } = await supabase.rpc('get_driver_queue_position', {
        driver_uuid: applicationData.applicationId
      });

      if (error) {
        console.error('Error fetching queue position:', error);
      } else if (data && data[0]) {
        setQueuePosition(data[0]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      p="lg"
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Stack gap="lg">
        {/* Success Icon */}
        <Box ta="center">
          <Box
            style={{
              display: 'inline-block',
              padding: 16,
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '50%',
            }}
          >
            <CheckCircle size={80} style={{ color: '#22c55e' }} />
          </Box>
        </Box>

        {/* Header */}
        <Stack align="center" gap="xs">
          <Text fw={700} size="xl">Application Submitted!</Text>
          <Text size="md" c="dimmed">
            You've been placed on our waitlist
          </Text>
        </Stack>

        {/* Info Alert */}
        <Alert
          title="You're on the Waitlist"
          color="blue"
          icon={<Clock size={16} />}
        >
          <Stack gap="xs">
            <Text size="sm">
              Thanks for applying! We've received your information and added you to our
              waitlist for your area.
            </Text>
            <Text size="sm">
              We're currently planning our launch in <strong>{applicationData.city}</strong>.
              You'll be notified by email when we're ready to activate you as a driver.
            </Text>
          </Stack>
        </Alert>

        {/* What Happens Next */}
        <Card
          p="md"
          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
        >
          <Text fw={600} size="lg" mb="md">What Happens Next?</Text>
          <Stack gap="md">
            <div>
              <Text fw={500} size="sm">📧 Email Confirmation</Text>
              <Text size="sm" c="dimmed">
                Check your inbox at <strong>{applicationData.email}</strong> for a confirmation
                message with your waitlist position.
              </Text>
            </div>
            <Divider />
            <div>
              <Text fw={500} size="sm">📍 Area Launch</Text>
              <Text size="sm" c="dimmed">
                We'll contact you when we're ready to launch in your area and need drivers.
              </Text>
            </div>
            <Divider />
            <div>
              <Text fw={500} size="sm">✅ Background Check</Text>
              <Text size="sm" c="dimmed">
                When we activate you, we'll run a background check and complete onboarding.
              </Text>
            </div>
            <Divider />
            <div>
              <Text fw={500} size="sm">🚗 Start Earning</Text>
              <Text size="sm" c="dimmed">
                Once activated, you can start accepting delivery orders and earning money!
              </Text>
            </div>
          </Stack>
        </Card>

        {/* Waitlist Position Info */}
        {loading ? (
          <Box ta="center" p="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed" mt="xs">Loading queue position...</Text>
          </Box>
        ) : queuePosition && (
          <Card
            p="md"
            style={{
              backgroundColor: '#fff7e6',
              border: '2px solid #ff7a00'
            }}
          >
            <Stack align="center" gap="xs">
              <Text fw={600} size="md" c="#ff7a00">
                🎯 Your Position in Queue
              </Text>
              <Text
                fw={700}
                size="3xl"
                c="#ff7a00"
              >
                #{queuePosition.queue_position}
              </Text>
              <Text size="sm" c="dimmed">
                out of <strong>{queuePosition.total_in_region}</strong> drivers in {queuePosition.region_name || 'your area'}
              </Text>
            </Stack>
          </Card>
        )}

        {/* Additional Info */}
        <Card
          p="md"
          style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
        >
          <Stack gap="xs">
            <Text fw={500} size="sm">
              <Mail size={16} style={{ display: 'inline', marginRight: 8 }} />
              Stay Updated
            </Text>
            <Text size="sm" c="dimmed">
              We'll send you regular updates about our launch timeline and when you can
              expect to start driving. Check your email regularly!
            </Text>
          </Stack>
        </Card>

        {/* Footer Message */}
        <Box ta="center" p="md">
          <Text fw={600} size="md" c="#22c55e" mb="xs">
            Welcome to the Crave'N Family!
          </Text>
          <Text size="sm" c="dimmed">
            We're excited to have you join us as we revolutionize food delivery.
          </Text>
        </Box>
      </Stack>
    </Card>
  );
};
