import React, { useState } from 'react';
import {
  Grid,
  Group,
  Stack,
  Card,
  Text,
  Title,
  Badge,
  Button,
  Timeline,
  Box,
  Paper,
  Progress,
} from '@mantine/core';
import {
  IconRocket,
  IconCode,
  IconServer,
  IconShield,
  IconPlus,
  IconCheck,
  IconClock,
} from '@tabler/icons-react';

interface RoadmapItem {
  id: string;
  quarter: string;
  year: number;
  initiatives: {
    title: string;
    status: 'planned' | 'in-progress' | 'completed';
    priority: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

export const TechnologyRoadmap: React.FC = () => {
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([
    {
      id: '1',
      quarter: 'Q1',
      year: 2024,
      initiatives: [
        {
          title: 'Microservices Migration',
          status: 'in-progress',
          priority: 'high',
          description: 'Migrate monolithic architecture to microservices',
        },
        {
          title: 'Kubernetes Implementation',
          status: 'planned',
          priority: 'high',
          description: 'Container orchestration and auto-scaling',
        },
        {
          title: 'API Gateway Upgrade',
          status: 'completed',
          priority: 'medium',
          description: 'Upgrade to latest API gateway version',
        },
      ],
    },
    {
      id: '2',
      quarter: 'Q2',
      year: 2024,
      initiatives: [
        {
          title: 'Multi-Region Deployment',
          status: 'planned',
          priority: 'high',
          description: 'Deploy infrastructure across multiple regions',
        },
        {
          title: 'Advanced Monitoring',
          status: 'planned',
          priority: 'medium',
          description: 'Implement comprehensive observability',
        },
      ],
    },
    {
      id: '3',
      quarter: 'Q3',
      year: 2024,
      initiatives: [
        {
          title: 'AI/ML Integration',
          status: 'planned',
          priority: 'medium',
          description: 'Integrate machine learning capabilities',
        },
      ],
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in-progress': return 'blue';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      default: return 'blue';
    }
  };

  const totalInitiatives = roadmap.reduce((sum, r) => sum + r.initiatives.length, 0);
  const completedInitiatives = roadmap.reduce(
    (sum, r) => sum + r.initiatives.filter(i => i.status === 'completed').length,
    0
  );
  const inProgressInitiatives = roadmap.reduce(
    (sum, r) => sum + r.initiatives.filter(i => i.status === 'in-progress').length,
    0
  );

  return (
    <Stack gap="lg" p="md">
      <Group justify="space-between">
        <Box>
          <Title order={2}>Technology Roadmap</Title>
          <Text c="dimmed" size="sm">
            Strategic technology planning and innovation pipeline
          </Text>
        </Box>
        <Badge size="lg" color="violet" variant="light" leftSection={<IconRocket size={16} />}>
          Strategic Planning
        </Badge>
      </Group>

      {/* Roadmap Metrics */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Total Initiatives</Text>
              <IconRocket size={20} color="#8b5cf6" />
            </Group>
            <Text size="xl" fw={700} c="violet">
              {totalInitiatives}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Across roadmap
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">Completed</Text>
              <IconCheck size={20} color="#10b981" />
            </Group>
            <Text size="xl" fw={700} c="green">
              {completedInitiatives}
            </Text>
            <Progress
              value={(completedInitiatives / totalInitiatives) * 100}
              color="green"
              size="sm"
              mt="xs"
            />
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">In Progress</Text>
              <IconClock size={20} color="#3b82f6" />
            </Group>
            <Text size="xl" fw={700} c="blue">
              {inProgressInitiatives}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Active initiatives
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">High Priority</Text>
              <IconRocket size={20} color="#ef4444" />
            </Group>
            <Text size="xl" fw={700} c="red">
              {roadmap.reduce(
                (sum, r) => sum + r.initiatives.filter(i => i.priority === 'high').length,
                0
              )}
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Critical initiatives
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Roadmap Timeline */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">
          12-Month Technology Roadmap
        </Title>
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {roadmap.map((quarter) => (
            <Timeline.Item
              key={quarter.id}
              bullet={<IconRocket size={12} />}
              title={`${quarter.quarter} ${quarter.year}`}
            >
              <Stack gap="md" mt="xs">
                {quarter.initiatives.map((initiative, idx) => (
                  <Paper key={idx} p="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text fw={600}>{initiative.title}</Text>
                      <Group gap="xs">
                        <Badge color={getStatusColor(initiative.status)} variant="light">
                          {initiative.status}
                        </Badge>
                        <Badge color={getPriorityColor(initiative.priority)} variant="light">
                          {initiative.priority} priority
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">
                        {initiative.description}
                      </Text>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </Stack>
  );
};

