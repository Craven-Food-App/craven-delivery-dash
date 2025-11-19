import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Stack, Card, Badge, Loader, Center } from '@mantine/core';
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

const getHierarchyLevel = (title: string): number => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('ceo') || lowerTitle.includes('chief executive')) return 1;
  if (lowerTitle.includes('president') && !lowerTitle.includes('vice')) return 2;
  if (lowerTitle.includes('cfo') || lowerTitle.includes('coo') || lowerTitle.includes('cto') || 
      lowerTitle.includes('chief financial') || lowerTitle.includes('chief operating') || 
      lowerTitle.includes('chief technology')) return 3;
  if (lowerTitle.includes('chief')) return 4;
  if (lowerTitle.includes('vice president') || lowerTitle.includes('vp')) return 5;
  if (lowerTitle.includes('director')) return 6;
  return 7;
};

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
        .eq('status', 'ACTIVE');

      if (error) {
        if (error.code !== '42P01') {
          console.error('Error fetching officers:', error);
        }
        setOfficers([]);
        return;
      }

      const processedOfficers = (data || []).map((officer: any) => ({
        ...officer,
        metadata: typeof officer.metadata === 'string' ? {} : (officer.metadata || {})
      }));

      // Sort by hierarchy level, then by title
      processedOfficers.sort((a, b) => {
        const levelDiff = getHierarchyLevel(a.title) - getHierarchyLevel(b.title);
        if (levelDiff !== 0) return levelDiff;
        return a.title.localeCompare(b.title);
      });

      setOfficers(processedOfficers as any);
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
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Center>
              <Text c="dimmed">No active officers to display</Text>
            </Center>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Group officers by hierarchy level */}
            {Array.from(new Set(officers.map(o => getHierarchyLevel(o.title)))).map(level => {
              const levelOfficers = officers.filter(o => getHierarchyLevel(o.title) === level);
              const isTopLevel = level === 1;
              const isSecondLevel = level === 2 || level === 3;
              
              return (
                <div key={level} className="space-y-4">
                  <div className={`grid gap-6 ${
                    isTopLevel ? 'grid-cols-1 max-w-2xl mx-auto' : 
                    isSecondLevel ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                  }`}>
                    {levelOfficers.map((officer, idx) => (
                      <Card
                        key={officer.id}
                        padding="lg"
                        radius="md"
                        className="relative"
                        style={{
                          backgroundColor: 'hsl(var(--card))',
                          border: `2px solid ${isTopLevel ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                          height: '100%',
                        }}
                      >
                        <Stack gap="md">
                          <div>
                            <Text fw={600} size={isTopLevel ? "xl" : "lg"} c="foreground" mb="xs">
                              {officer.full_name}
                            </Text>
                            <Badge 
                              color="orange" 
                              variant={isTopLevel ? "filled" : "light"}
                              size={isTopLevel ? "lg" : "md"}
                            >
                              {officer.title}
                            </Badge>
                          </div>
                          {officer.metadata?.bio && (
                            <Text size="sm" c="dimmed" lineClamp={isTopLevel ? 4 : 3}>
                              {officer.metadata.bio}
                            </Text>
                          )}
                          <Text size="xs" c="dimmed">
                            Since {dayjs(officer.effective_date).format('MMMM YYYY')}
                          </Text>
                        </Stack>
                        
                        {/* Connection line to next level */}
                        {idx === 0 && level < Math.max(...officers.map(o => getHierarchyLevel(o.title))) && (
                          <div 
                            className="absolute left-1/2 -bottom-6 w-0.5 h-6 bg-border"
                            style={{ transform: 'translateX(-50%)' }}
                          />
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Stack>
    </Container>
  );
};

export default LeadershipPublicPage;
