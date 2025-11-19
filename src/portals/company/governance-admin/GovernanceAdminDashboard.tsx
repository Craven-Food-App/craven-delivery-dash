import React from 'react';
import { Container, Title, Text, Stack, Tabs, Card } from '@mantine/core';
import { IconShield, IconUsers, IconFileText, IconUserCheck, IconHistory } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import AppointmentList from './AppointmentList';
import ResolutionList from './ResolutionList';
import OfficerLedger from './OfficerLedger';
import GovernanceLogList from './GovernanceLogList';

const GovernanceAdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} c="dark" mb="xs">
            <IconShield size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 12 }} />
            Governance Administration
          </Title>
          <Text c="dimmed" size="lg">
            Manage executive appointments, board resolutions, corporate officers, and governance logs.
          </Text>
        </div>

        <Card
          padding="lg"
          radius="md"
          withBorder
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
          }}
        >
          <Tabs defaultValue="appointments">
            <Tabs.List>
              <Tabs.Tab value="appointments" leftSection={<IconUsers size={16} />}>
                Appointments
              </Tabs.Tab>
              <Tabs.Tab value="resolutions" leftSection={<IconFileText size={16} />}>
                Resolutions
              </Tabs.Tab>
              <Tabs.Tab value="officers" leftSection={<IconUserCheck size={16} />}>
                Officers
              </Tabs.Tab>
              <Tabs.Tab value="logs" leftSection={<IconHistory size={16} />}>
                Governance Logs
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="appointments" pt="md">
              <AppointmentList />
            </Tabs.Panel>

            <Tabs.Panel value="resolutions" pt="md">
              <ResolutionList />
            </Tabs.Panel>

            <Tabs.Panel value="officers" pt="md">
              <OfficerLedger />
            </Tabs.Panel>

            <Tabs.Panel value="logs" pt="md">
              <GovernanceLogList />
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Stack>
    </Container>
  );
};

export default GovernanceAdminDashboard;
