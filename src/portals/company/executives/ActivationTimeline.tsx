import React, { useState, useEffect } from 'react';
import {
  Timeline,
  Text,
  Badge,
  Card,
  Stack,
  Group,
  Loader,
  Center,
  Paper,
} from '@mantine/core';
import { supabase } from '@/integrations/supabase/client';
import {
  IconCheck,
  IconClock,
  IconFileText,
  IconUserCheck,
  IconCertificate,
  IconUsers,
  IconShield,
  IconCurrencyDollar,
  IconBuildingBank,
  IconClipboardCheck,
  IconRocket,
} from '@tabler/icons-react';
import dayjs from 'dayjs';

interface TimelineEvent {
  id: string;
  event_type: string;
  event_description: string;
  performed_by?: string;
  metadata?: any;
  created_at: string;
}

interface ActivationTimelineProps {
  appointmentId: string;
}

const getEventIcon = (eventType: string) => {
  const iconMap: Record<string, any> = {
    DOCUMENTS_SIGNED: IconFileText,
    SECRETARY_VALIDATED: IconUserCheck,
    CERTIFICATE_GENERATED: IconCertificate,
    LEDGER_UPDATED: IconFileText,
    OFFICER_RECORD_CREATED: IconUsers,
    ROLES_ASSIGNED: IconShield,
    IT_ACCESS_PROVISIONED: IconShield,
    EQUITY_ACTIVATED: IconCurrencyDollar,
    COMPENSATION_ADDED: IconCurrencyDollar,
    BANKING_AUTHORITY_PREPARED: IconBuildingBank,
    COMPLIANCE_ACTIVATED: IconClipboardCheck,
    OFFICER_ACTIVATED: IconRocket,
    ACTIVATION_STARTED: IconRocket,
  };
  return iconMap[eventType] || IconClock;
};

const getEventColor = (eventType: string) => {
  if (eventType === 'OFFICER_ACTIVATED') return 'green';
  if (eventType === 'SECRETARY_VALIDATED') return 'blue';
  if (eventType === 'DOCUMENTS_SIGNED') return 'orange';
  return 'gray';
};

const getEventLabel = (eventType: string) => {
  const labels: Record<string, string> = {
    DOCUMENTS_SIGNED: 'Document Signing Complete',
    SECRETARY_VALIDATED: 'Secretary Validation Complete',
    CERTIFICATE_GENERATED: 'Certificate Generated',
    LEDGER_UPDATED: 'Officer Added to Ledger',
    OFFICER_RECORD_CREATED: 'Officer Record Created',
    ROLES_ASSIGNED: 'Roles Assigned',
    IT_ACCESS_PROVISIONED: 'IT Access Provisioned',
    EQUITY_ACTIVATED: 'Equity Activated',
    COMPENSATION_ADDED: 'Compensation Added',
    BANKING_AUTHORITY_PREPARED: 'Banking Authorization Prepared',
    COMPLIANCE_ACTIVATED: 'Compliance Activated',
    OFFICER_ACTIVATED: 'Officer Activated',
    ACTIVATION_STARTED: 'Activation Started',
  };
  return labels[eventType] || eventType.replace(/_/g, ' ');
};

const ActivationTimeline: React.FC<ActivationTimelineProps> = ({ appointmentId }) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetchTimeline();
    }
  }, [appointmentId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('officer_activation_timeline')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="md" />
      </Center>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <Text c="dimmed" ta="center" py="md">
          No activation timeline events yet. Timeline will appear as the activation workflow progresses.
        </Text>
      </Card>
    );
  }

  return (
    <Card>
      <Text size="lg" fw={600} mb="md">
        Officer Activation Timeline
      </Text>
      <Timeline active={events.length - 1} bulletSize={24} lineWidth={2}>
        {events.map((event, index) => {
          const Icon = getEventIcon(event.event_type);
          const color = getEventColor(event.event_type);
          const isCompleted = index < events.length - 1 || event.event_type === 'OFFICER_ACTIVATED';

          return (
            <Timeline.Item
              key={event.id}
              bullet={<Icon size={12} />}
              color={isCompleted ? color : 'gray'}
            >
              <Group justify="space-between" align="flex-start" mb={4}>
                <div>
                  <Text fw={500} size="sm">
                    {getEventLabel(event.event_type)}
                  </Text>
                  <Text size="xs" c="dimmed" mt={2}>
                    {event.event_description}
                  </Text>
                </div>
                <Badge
                  size="sm"
                  color={isCompleted ? color : 'gray'}
                  variant={isCompleted ? 'filled' : 'light'}
                >
                  {dayjs(event.created_at).format('MMM D, YYYY')}
                </Badge>
              </Group>
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <Paper p="xs" mt="xs" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                  <Text size="xs" c="dimmed">
                    {dayjs(event.created_at).format('h:mm A')}
                  </Text>
                </Paper>
              )}
            </Timeline.Item>
          );
        })}
      </Timeline>
    </Card>
  );
};

export default ActivationTimeline;

