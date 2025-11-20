import React, { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Card,
  Group,
  Grid,
  Badge,
  Table,
  Progress,
  Loader,
  Alert,
  NumberFormatter,
} from '@mantine/core';
import { IconChartPie, IconAlertCircle } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';

interface CapTable {
  id: string;
  total_authorized: number;
  total_issued: number;
  total_unissued: number;
  equity_pool: number;
  trust_shares: number;
  founder_shares: number;
  trust_percentage: number;
  founder_percentage: number;
  pool_percentage: number;
  as_of_date: string;
}

const CapTableOverview: React.FC = () => {
  const [capTable, setCapTable] = useState<CapTable | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCapTable();
  }, []);

  const loadCapTable = async () => {
    try {
      const { data, error } = await supabase
        .from('cap_tables')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCapTable(data);
    } catch (error: any) {
      console.error('Error loading cap table:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container size="xl" py="xl">
        <Loader size="lg" />
      </Container>
    );
  }

  if (!capTable) {
    return (
      <Container size="xl" py="xl">
        <Alert icon={<IconAlertCircle size={16} />} title="No Cap Table" color="blue">
          Cap table has not been initialized. Please set up the initial capitalization.
        </Alert>
      </Container>
    );
  }

  const issuedPercentage = (capTable.total_issued / capTable.total_authorized) * 100;
  const unissuedPercentage = (capTable.total_unissued / capTable.total_authorized) * 100;

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={2} c="dark" mb="xs">
            <IconChartPie size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />
            Capitalization Table Overview
          </Title>
          <Text c="dimmed">
            Current state of authorized, issued, and reserved shares as of {new Date(capTable.as_of_date).toLocaleDateString()}.
          </Text>
        </div>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Authorized Shares</Title>
                <Text size="xl" fw={700}>
                  <NumberFormatter value={capTable.total_authorized} thousandSeparator />
                </Text>
                <Progress value={100} color="blue" size="lg" />
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Issued Shares</Title>
                <Text size="xl" fw={700}>
                  <NumberFormatter value={capTable.total_issued} thousandSeparator />
                </Text>
                <Progress value={issuedPercentage} color="green" size="lg" />
                <Text size="sm" c="dimmed">
                  {issuedPercentage.toFixed(1)}% of authorized
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Unissued Shares</Title>
                <Text size="xl" fw={700}>
                  <NumberFormatter value={capTable.total_unissued} thousandSeparator />
                </Text>
                <Progress value={unissuedPercentage} color="yellow" size="lg" />
                <Text size="sm" c="dimmed">
                  {unissuedPercentage.toFixed(1)}% of authorized
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Title order={4}>Equity Pool (Reserved)</Title>
                <Text size="xl" fw={700}>
                  <NumberFormatter value={capTable.equity_pool} thousandSeparator />
                </Text>
                <Badge color="orange" size="lg">
                  {capTable.pool_percentage.toFixed(1)}% Reserved
                </Badge>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <Card padding="lg" radius="md" withBorder>
          <Title order={4} mb="md">Share Distribution</Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Holder</Table.Th>
                <Table.Th>Shares</Table.Th>
                <Table.Th>Percentage</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Trust</Text>
                </Table.Td>
                <Table.Td>
                  <NumberFormatter value={capTable.trust_shares} thousandSeparator />
                </Table.Td>
                <Table.Td>
                  <Badge color="blue">{capTable.trust_percentage.toFixed(1)}%</Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Founder</Text>
                </Table.Td>
                <Table.Td>
                  <NumberFormatter value={capTable.founder_shares} thousandSeparator />
                </Table.Td>
                <Table.Td>
                  <Badge color="green">{capTable.founder_percentage.toFixed(1)}%</Badge>
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>
                  <Text fw={500}>Equity Pool</Text>
                </Table.Td>
                <Table.Td>
                  <NumberFormatter value={capTable.equity_pool} thousandSeparator />
                </Table.Td>
                <Table.Td>
                  <Badge color="orange">{capTable.pool_percentage.toFixed(1)}%</Badge>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Card>
      </Stack>
    </Container>
  );
};

export default CapTableOverview;

