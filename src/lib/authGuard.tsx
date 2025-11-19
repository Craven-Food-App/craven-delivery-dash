import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack, Title, Text, Button, Card } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchUserRoles, hasAnyRole } from './roles';

interface CompanySecureRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export const CompanySecureRoute: React.FC<CompanySecureRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/hub',
}) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get user first, then check roles in parallel
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAuthorized(false);
          setLoading(false);
          return;
        }

        // SPECIAL CASE: tstroman.ceo@cravenusa.com (Torrance Stroman CEO account) always has access to company portal
        if (user.email === 'tstroman.ceo@cravenusa.com') {
          setIsAuthorized(true);
          setLoading(false);
          return;
        }

        // Check both user_roles and exec_users in parallel
        const [roles, execUserResult] = await Promise.all([
          fetchUserRoles(),
          supabase
            .from('exec_users')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);

        const authorized = hasAnyRole(roles, allowedRoles);
        
        // Fallback check with exec_users if not authorized via user_roles
        if (!authorized && execUserResult.data) {
          const execRole = execUserResult.data.role?.toUpperCase();
          const hasAccess = allowedRoles.some(role => {
            const normalizedRole = role.replace('CRAVEN_', '').toLowerCase();
            return execRole === normalizedRole || execRole === 'CEO';
          });
          setIsAuthorized(hasAccess);
        } else {
          setIsAuthorized(authorized);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [allowedRoles]);

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Stack align="center" gap="md">
          <Text>Checking access...</Text>
        </Stack>
      </Container>
    );
  }

  if (!isAuthorized) {
    return (
      <Container size="md" py="xl">
        <Card shadow="md" padding="xl" radius="md">
          <Stack align="center" gap="md">
            <IconLock size={64} stroke={1.5} style={{ color: 'var(--mantine-color-red-6)' }} />
            <Title order={2}>Access Denied</Title>
            <Text size="lg" ta="center" c="dimmed">
              You don't have the required permissions to access this portal.
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              This portal is restricted to high-level corporate access only.
            </Text>
            <Button onClick={() => navigate(fallbackPath)} mt="md">
              Return to Hub
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return <>{children}</>;
};

