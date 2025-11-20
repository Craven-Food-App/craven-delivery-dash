import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Progress,
  Table,
  Badge,
  Loader,
  Alert,
  Timeline,
  NumberFormatter,
} from '@mantine/core';
import { IconClock, IconCheck, IconAlertCircle, IconCalendar } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';

interface VestingEvent {
  date: string;
  shares: number;
  vested: boolean;
}

interface VestingSchedule {
  id: string;
  total_shares: number;
  vested_shares: number;
  unvested_shares: number;
  vesting_type: string;
  vesting_period_months: number;
  cliff_months: number;
  start_date: string;
  end_date: string;
  vesting_schedule: VestingEvent[];
}

const VestingProgress: React.FC = () => {
  const [schedules, setSchedules] = useState<VestingSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVestingSchedules();
  }, []);

  const loadVestingSchedules = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vesting_schedules')
        .select('*')
        .eq('recipient_user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      // @ts-ignore - Json type mismatch for vesting_schedule
      setSchedules(data || []);
    } catch (error: any) {
      console.error('Error loading vesting schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingVests = (schedule: VestingSchedule) => {
    const now = new Date();
    return schedule.vesting_schedule
      .filter(event => !event.vested && new Date(event.date) > now)
      .slice(0, 5);
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  if (schedules.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="No Vesting Schedules" color="blue">
          You don't have any active vesting schedules. Vesting schedules are created when equity is granted.
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2} c="dark" mb="xs">
            <IconClock size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />
            Vesting Progress
          </Title>
          <Text c="dimmed">
            Track your equity vesting schedule and upcoming vest dates.
          </Text>
        </div>

        {schedules.map((schedule) => {
          const vestingProgress = schedule.total_shares > 0
            ? (Number(schedule.vested_shares || 0) / schedule.total_shares) * 100
            : 0;
          const upcomingVests = getUpcomingVests(schedule);

          return (
            <Card key={schedule.id} padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Title order={4}>
                      {schedule.vesting_type.charAt(0).toUpperCase() + schedule.vesting_type.slice(1)} Vesting Schedule
                    </Title>
                    <Text size="sm" c="dimmed">
                      Started {new Date(schedule.start_date).toLocaleDateString()}
                      {schedule.end_date && ` • Ends ${new Date(schedule.end_date).toLocaleDateString()}`}
                    </Text>
                  </div>
                  <Badge size="lg" color="blue">
                    {schedule.vesting_period_months} months
                  </Badge>
                </Group>

                <Group grow>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Total Shares
                    </Text>
                    <Text size="xl" fw={700}>
                      <NumberFormatter value={schedule.total_shares} thousandSeparator />
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Vested
                    </Text>
                    <Text size="xl" fw={700} c="green">
                      <NumberFormatter value={schedule.vested_shares || 0} thousandSeparator />
                    </Text>
                  </div>
                  <div>
                    <Text size="sm" c="dimmed" mb={4}>
                      Unvested
                    </Text>
                    <Text size="xl" fw={700} c="yellow">
                      <NumberFormatter value={schedule.unvested_shares || 0} thousandSeparator />
                    </Text>
                  </div>
                </Group>

                <div>
                  <Group justify="space-between" mb="xs">
                    <Text size="sm" fw={500}>
                      Vesting Progress
                    </Text>
                    <Text size="sm" c="dimmed">
                      {vestingProgress.toFixed(1)}%
                    </Text>
                  </Group>
                  <Progress value={vestingProgress} size="lg" color="green" />
                </div>

                {upcomingVests.length > 0 && (
                  <div>
                    <Title order={5} mb="md">Upcoming Vest Dates</Title>
                    <Timeline active={-1} bulletSize={24} lineWidth={2}>
                      {upcomingVests.map((event, index) => (
                        <Timeline.Item
                          key={index}
                          bullet={<IconCalendar size={12} />}
                          title={`${new Date(event.date).toLocaleDateString()}`}
                        >
                          <Text size="sm" c="dimmed">
                            <NumberFormatter value={event.shares} thousandSeparator /> shares will vest
                          </Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  </div>
                )}

                {schedule.vesting_schedule.length > 0 && (
                  <div>
                    <Title order={5} mb="md">Full Vesting Schedule</Title>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Vest Date</Table.Th>
                          <Table.Th>Shares</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {schedule.vesting_schedule.map((event, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>
                              {new Date(event.date).toLocaleDateString()}
                            </Table.Td>
                            <Table.Td>
                              <NumberFormatter value={event.shares} thousandSeparator />
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={event.vested ? 'green' : new Date(event.date) <= new Date() ? 'yellow' : 'gray'}
                                leftSection={event.vested ? <IconCheck size={12} /> : <IconClock size={12} />}
                              >
                                {event.vested ? 'Vested' : new Date(event.date) <= new Date() ? 'Pending' : 'Upcoming'}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </div>
                )}
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </Container>
  );
};

export default VestingProgress;

