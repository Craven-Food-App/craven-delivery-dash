import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Card, Grid, Badge, Group, Loader, Center } from '@mantine/core';
import { supabase } from '@/integrations/supabase/client';
import dayjs from 'dayjs';

interface CorporateOfficer {
  id: string;
  full_name: string;
  title: string;
  effective_date: string;
  metadata?: {
    bio?: string;
  };
}

const LeadershipPublicPage: React.FC = () => {
  const [officers, setOfficers] = useState<CorporateOfficer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('corporate_officers')
        .select('id, full_name, title, effective_date, metadata')
        .eq('status', 'ACTIVE')
        .order('title', { ascending: true });

      if (error) {
        if (error.code !== '42P01') {
          console.error('Error fetching officers:', error);
        }
        setOfficers([]);
        return;
      }

      setOfficers((data || []).map((officer: any) => ({
        ...officer,
        metadata: typeof officer.metadata === 'string' ? {} : (officer.metadata || {})
      })) as any);
    } catch (error) {
      console.error('Error:', error);
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
            Leadership Team
          </Title>
          <Text c="dimmed" size="lg">
            Meet the executive leadership team driving Crave'n forward.
          </Text>
        </div>

        {officers.length === 0 ? (
          <Card
            padding="xl"
            radius="md"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
            }}
          >
            <Center>
              <Text c="dimmed">No active officers to display</Text>
            </Center>
          </Card>
        ) : (
          <Grid>
            {officers.map((officer) => (
              <Grid.Col key={officer.id} span={{ base: 12, sm: 6, md: 4 }}>
                <Card
                  padding="lg"
                  radius="md"
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    height: '100%',
                  }}
                >
                  <Stack gap="md">
                    <div>
                      <Text fw={600} size="xl" c="dark" mb="xs">
                        {officer.full_name}
                      </Text>
                      <Badge color="orange" variant="light">
                        {officer.title}
                      </Badge>
                    </div>
                    {officer.metadata?.bio && (
                      <Text size="sm" c="dimmed" lineClamp={3}>
                        {officer.metadata.bio}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed">
                      Since {dayjs(officer.effective_date).format('MMMM YYYY')}
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
};

export default LeadershipPublicPage;
