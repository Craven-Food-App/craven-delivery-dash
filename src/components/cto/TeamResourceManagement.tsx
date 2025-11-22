import React, { useState, useEffect } from 'react';
import {
  Grid,
  Group,
  Stack,
  Card,
  Text,
  Title,
  Badge,
  Table,
  Tabs,
  Box,
  Paper,
  Progress,
  Avatar,
} from '@mantine/core';
import {
  IconUsers,
  IconTrendingUp,
  IconCode,
  IconClock,
  IconCheck,
} from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useEmbeddedToast';
import { FuturisticChart } from '@/components/cfo/FuturisticChart';
import { MantineTable } from '@/components/cfo/MantineTable';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  sprintVelocity: number;
  codeReviews: number;
  pullRequests: number;
  availability: number;
}

interface SprintMetrics {
  sprint: string;
  velocity: number;
  completed: number;
  planned: number;
}

export const TeamResourceManagement: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sprintMetrics, setSprintMetrics] = useState<SprintMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('team');
  const toast = useToast();

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Mock team data
      setTeamMembers([
        {
          id: '1',
          name: 'John Developer',
          role: 'Senior Engineer',
          sprintVelocity: 18,
          codeReviews: 24,
          pullRequests: 12,
          availability: 100,
        },
        {
          id: '2',
          name: 'Jane Engineer',
          role: 'Full Stack Developer',
          sprintVelocity: 15,
          codeReviews: 18,
          pullRequests: 10,
          availability: 85,
        },
        {
          id: '3',
          name: 'Bob Coder',
          role: 'Backend Engineer',
          sprintVelocity: 20,
          codeReviews: 30,
          pullRequests: 15,
          availability: 100,
        },
      ]);

      // Generate sprint metrics
      const metrics: SprintMetrics[] = Array.from({ length: 8 }, (_, i) => ({
        sprint: `Sprint ${i + 1}`,
        velocity: 15 + Math.floor(Math.random() * 10),
        completed: 12 + Math.floor(Math.random() * 8),
        planned: 18 + Math.floor(Math.random() * 5),
      }));
      setSprintMetrics(metrics);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast.error('Failed to load team data', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const totalVelocity = teamMembers.reduce((sum, m) => sum + m.sprintVelocity, 0);
  const avgVelocity = teamMembers.length > 0 ? totalVelocity / teamMembers.length : 0;
  const totalCodeReviews = teamMembers.reduce((sum, m) => sum + m.codeReviews, 0);

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Box>
          <Title order={2}>Team & Resource Management</Title>
          <Text c="dimmed" size="sm">
            Developer productivity, sprint velocity, and resource allocation
          </Text>
        </Box>
        <Badge size="lg" color="blue" variant="light" leftSection={<IconUsers size={16} />}>
          Team Ops
        </Badge>
      </Group>

      {/* Key Team Metrics */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Team Size</Text>
              <IconUsers size={20} color="#3b82f6" />
            </Group>
            <Text size="xl" fw={700} c="blue">
              {teamMembers.length}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Active developers
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Avg Sprint Velocity</Text>
              <IconTrendingUp size={20} color="#10b981" />
            </Group>
            <Text size="xl" fw={700} c="green">
              {avgVelocity.toFixed(1)}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Story points per sprint
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Code Reviews</Text>
              <IconCode size={20} color="#8b5cf6" />
            </Group>
            <Text size="xl" fw={700} c="violet">
              {totalCodeReviews}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              This month
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Team Availability</Text>
              <IconCheck size={20} color="#10b981" />
            </Group>
            <Text size="xl" fw={700} c="green">
              {teamMembers.length > 0
                ? Math.round(teamMembers.reduce((sum, m) => sum + m.availability, 0) / teamMembers.length)
                : 0}%
            </Text>
            <Progress
              value={teamMembers.length > 0 ? teamMembers.reduce((sum, m) => sum + m.availability, 0) / teamMembers.length : 0}
              color="green"
              size="sm"
              mt="xs"
            />
          </Card>
        </Grid.Col>
      </Grid>

      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || 'team')}>
        <Tabs.List>
          <Tabs.Tab value="team" leftSection={<IconUsers size={16} />}>
            Team Members
          </Tabs.Tab>
          <Tabs.Tab value="velocity" leftSection={<IconTrendingUp size={16} />}>
            Sprint Velocity
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="team" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              Developer Performance
            </Title>
            <MantineTable
              data={teamMembers}
              loading={loading}
              rowKey="id"
              columns={[
                {
                  title: 'Developer',
                  dataIndex: 'name',
                  render: (name: string, record: TeamMember) => (
                    <Group gap="xs">
                      <Avatar size="sm" radius="xl" color="blue">
                        {name.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Text fw={600}>{name}</Text>
                        <Text size="xs" c="dimmed">{record.role}</Text>
                      </Box>
                    </Group>
                  ),
                },
                {
                  title: 'Sprint Velocity',
                  dataIndex: 'sprintVelocity',
                  render: (v: number) => (
                    <Group gap="xs">
                      <Text fw={600}>{v}</Text>
                      <Text size="xs" c="dimmed">points</Text>
                    </Group>
                  ),
                },
                {
                  title: 'Code Reviews',
                  dataIndex: 'codeReviews',
                },
                {
                  title: 'Pull Requests',
                  dataIndex: 'pullRequests',
                },
                {
                  title: 'Availability',
                  dataIndex: 'availability',
                  render: (v: number) => (
                    <Group gap="xs">
                      <Text fw={600}>{v}%</Text>
                      <Progress value={v} size="sm" style={{ width: 80 }} />
                    </Group>
                  ),
                },
              ]}
            />
          </Card>
        </Tabs.Panel>

        <Tabs.Panel value="velocity" pt="md">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">
              Sprint Velocity Trends
            </Title>
            <FuturisticChart
              data={sprintMetrics}
              type="bar"
              title=""
              height={400}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
              dataKeys={{ revenue: 'velocity', profit: 'completed', expenses: 'planned' }}
            />
          </Card>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

