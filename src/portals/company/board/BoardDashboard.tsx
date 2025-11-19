import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Card, Grid, Badge, Group, Button, Paper, Loader, Center } from '@mantine/core';
import { IconUsers, IconFileText, IconClock } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import BoardResolutionList from './BoardResolutionList';

interface ResolutionSummary {
  pending: number;
  adopted: number;
  rejected: number;
}

const BoardDashboard: React.FC = () => {
  const [summary, setSummary] = useState<ResolutionSummary>({
    pending: 0,
    adopted: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const [pendingResult, adoptedResult, rejectedResult] = await Promise.all([
        supabase
          .from('governance_board_resolutions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'PENDING_VOTE'),
        supabase
          .from('governance_board_resolutions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ADOPTED'),
        supabase
          .from('governance_board_resolutions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'REJECTED'),
      ]);

      setSummary({
        pending: pendingResult.count || 0,
        adopted: adoptedResult.count || 0,
        rejected: rejectedResult.count || 0,
      });
    } catch (error: any) {
      if (error.code !== '42P01') {
        console.error('Error fetching summary:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Loader size="lg" />
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} c="dark" mb="xs">
            Board Dashboard
          </Title>
          <Text c="dimmed" size="lg">
            Review and vote on board resolutions requiring your attention.
          </Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              padding="lg"
              radius="md"
              withBorder
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconFileText size={32} stroke={1.5} style={{ color: 'var(--mantine-color-blue-6)' }} />
                <Badge color="blue" variant="light" size="lg">
                  {summary.pending}
                </Badge>
              </Group>
              <Text fw={600} size="lg" c="dark" mb={4}>
                Pending Votes
              </Text>
              <Text size="sm" c="dimmed">
                Resolutions awaiting your vote
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              padding="lg"
              radius="md"
              withBorder
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconUsers size={32} stroke={1.5} style={{ color: 'var(--mantine-color-green-6)' }} />
                <Badge color="green" variant="light" size="lg">
                  {summary.adopted}
                </Badge>
              </Group>
              <Text fw={600} size="lg" c="dark" mb={4}>
                Adopted
              </Text>
              <Text size="sm" c="dimmed">
                Successfully passed resolutions
              </Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Card
              padding="lg"
              radius="md"
              withBorder
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
              }}
            >
              <Group justify="space-between" mb="xs">
                <IconClock size={32} stroke={1.5} style={{ color: 'var(--mantine-color-red-6)' }} />
                <Badge color="red" variant="light" size="lg">
                  {summary.rejected}
                </Badge>
              </Group>
              <Text fw={600} size="lg" c="dark" mb={4}>
                Rejected
              </Text>
              <Text size="sm" c="dimmed">
                Resolutions that did not pass
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        <Card
          padding="lg"
          radius="md"
          withBorder
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
          }}
        >
          <Title order={3} c="dark" mb="md">
            Resolutions Requiring Your Vote
          </Title>
          <BoardResolutionList />
        </Card>
      </Stack>
    </Container>
  );
};

export default BoardDashboard;
