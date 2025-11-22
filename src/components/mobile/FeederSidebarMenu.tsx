import React from 'react';
import { IconX, IconHome, IconCalendar, IconCurrencyDollar, IconUser, IconStar, IconTrendingUp, IconMessageCircle, IconLogout, IconFlame } from '@tabler/icons-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Box,
  Stack,
  Text,
  Button,
  Group,
  ActionIcon,
  Badge,
  Divider,
  Paper,
  Title,
  ThemeIcon,
} from '@mantine/core';

type FeederSidebarMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: string;
  onNavigate?: (path: string) => void;
};

const FeederSidebarMenu: React.FC<FeederSidebarMenuProps> = ({
  isOpen,
  onClose,
  activeTab = 'home',
  onNavigate
}) => {
  const [driverName, setDriverName] = React.useState('Torrance S');
  const [driverRating, setDriverRating] = React.useState(5.00);
  const [deliveries, setDeliveries] = React.useState(0);
  const [perfection, setPerfection] = React.useState(100);
  const [driverStatus, setDriverStatus] = React.useState('New Driver');
  const [driverPoints, setDriverPoints] = React.useState(87); // Diamond status

  // Fetch driver data
  React.useEffect(() => {
    const fetchDriverData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch driver profile
        const { data: profile } = await supabase
          .from('driver_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setDriverRating(profile.rating || 5.00);
          setDeliveries(profile.total_deliveries || 0);
          setPerfection(profile.rating ? Math.round((profile.rating / 5) * 100) : 100);
          
          // Calculate points based on rating and deliveries
          const points = Math.round((profile.rating || 5) * 17 + (profile.total_deliveries || 0) * 0.1);
          setDriverPoints(points);
        }

        // Fetch user metadata for name
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.user_metadata?.full_name) {
          setDriverName(authUser.user_metadata.full_name);
        } else if (authUser?.email) {
          const emailName = authUser.email.split('@')[0];
          setDriverName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
        }

        // Check if new driver (less than 10 deliveries)
        if (profile && (profile.total_deliveries || 0) < 10) {
          setDriverStatus('New Driver');
        } else {
          setDriverStatus('');
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
      }
    };

    if (isOpen) {
      fetchDriverData();
    }
  }, [isOpen]);

  const getStatus = (points: number) => {
    if (points >= 85) return { name: 'Diamond', gradient: 'linear-gradient(to bottom right, var(--mantine-color-cyan-2), var(--mantine-color-blue-3), var(--mantine-color-purple-3))', icon: '💎' };
    if (points >= 76) return { name: 'Platinum', gradient: 'linear-gradient(to bottom right, var(--mantine-color-gray-3), var(--mantine-color-gray-1), var(--mantine-color-gray-3))', icon: '⚪' };
    if (points >= 65) return { name: 'Gold', gradient: 'linear-gradient(to bottom right, var(--mantine-color-yellow-3), var(--mantine-color-yellow-2), var(--mantine-color-yellow-4))', icon: '🥇' };
    return { name: 'Silver', gradient: 'linear-gradient(to bottom right, var(--mantine-color-gray-4), var(--mantine-color-gray-3), var(--mantine-color-gray-5))', icon: '🥈' };
  };

  const status = getStatus(driverPoints);

  const menuItems = [
    { icon: IconHome, label: 'Home', path: 'home' },
    { icon: IconCalendar, label: 'Schedule', path: 'schedule' },
    { icon: IconCurrencyDollar, label: 'Earnings', path: 'earnings' },
    { icon: IconMessageCircle, label: 'Chat', path: 'messages' },
    { icon: IconUser, label: 'Account', path: 'account' },
    { icon: IconStar, label: 'Ratings', path: 'ratings' },
    { icon: IconTrendingUp, label: 'Promos', path: 'promos' }
  ];

  const handleMenuClick = (path: string) => {
    if (onNavigate) {
      // Convert path to capitalized format expected by handleMenuNavigation
      // Map lowercase paths to the capitalized format
      const pathMap: Record<string, string> = {
        'home': 'Home',
        'schedule': 'Schedule',
        'earnings': 'Earnings',
        'notifications': 'Notifications',
        'account': 'Account',
        'ratings': 'Ratings',
        'promos': 'Promos',
        'help': 'Messages',
        'messages': 'Messages'
      };
      const capitalizedPath = pathMap[path] || path.charAt(0).toUpperCase() + path.slice(1);
      onNavigate(capitalizedPath);
    }
    onClose();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect to mobile splash page
      window.location.href = '/mobile';
    } catch (error) {
      console.error('Error logging out:', error);
      // Still redirect even on error
      window.location.href = '/mobile';
    }
  };

  return (
    <Box
      pos="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      style={{ 
        zIndex: 50, 
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s',
      }}
    >
      {/* Overlay */}
      <Box 
        pos="absolute" 
        inset={0} 
        style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <Paper
        pos="absolute"
        left={0}
        top={0}
        h="100%"
        w={320}
        shadow="xl"
        style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        bg="white"
      >
        <style>{`
          [data-mantine-paper]::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {/* Header Section */}
        <Box
          pos="relative"
          p="xl"
          style={{ background: status.gradient, overflow: 'hidden' }}
        >
          {/* Sparkle effects for Diamond */}
          {status.name === 'Diamond' && (
            <Box pos="absolute" inset={0} style={{ opacity: 0.3 }}>
              <Box pos="absolute" top={16} left={32} w={12} h={12} bg="white" style={{ borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' }} />
              <Box pos="absolute" top={48} right={48} w={8} h={8} bg="white" style={{ borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite', animationDelay: '0.3s' }} />
              <Box pos="absolute" bottom={32} left={64} w={8} h={8} bg="white" style={{ borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite', animationDelay: '0.6s' }} />
            </Box>
          )}

          {/* Close Button */}
          <ActionIcon
            pos="absolute"
            top={16}
            right={16}
            variant="light"
            color="gray"
            size="lg"
            radius="xl"
            onClick={onClose}
            style={{ backgroundColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)' }}
          >
            <IconX size={24} />
          </ActionIcon>

          {/* Driver Info */}
          <Box pos="relative" mt="xl">
            <Title order={2} fw={900} c="dark" mb="md">{driverName}</Title>
            
            {/* Status Badge with Icon */}
            <Badge
              size="lg"
              variant="light"
              mb="md"
              style={{ backgroundColor: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)', border: '2px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              <Group gap="xs">
                <Text size="xl">{status.icon}</Text>
                <Text fw={900} c="dark">{status.name} Feeder</Text>
              </Group>
            </Badge>

            {/* Stats Row */}
            <Paper p="md" radius="lg" style={{ backgroundColor: 'rgba(255,255,255,0.3)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.5)' }}>
              <Group justify="space-between" gap={0}>
                <Stack gap={4} align="center" style={{ flex: 1 }}>
                  <Group gap={4} justify="center">
                    <IconStar size={16} fill="var(--mantine-color-yellow-6)" color="var(--mantine-color-yellow-6)" />
                    <Text size="2xl" fw={900} c="dark">{driverRating.toFixed(2)}</Text>
                  </Group>
                  <Text size="xs" c="dark" fw={600}>Rating</Text>
                </Stack>
                <Divider orientation="vertical" h={48} style={{ borderColor: 'rgba(255,255,255,0.5)' }} />
                <Stack gap={4} align="center" style={{ flex: 1 }}>
                  <Text size="2xl" fw={900} c="dark">{deliveries}</Text>
                  <Text size="xs" c="dark" fw={600}>deliveries</Text>
                </Stack>
                <Divider orientation="vertical" h={48} style={{ borderColor: 'rgba(255,255,255,0.5)' }} />
                <Stack gap={4} align="center" style={{ flex: 1 }}>
                  <Text size="2xl" fw={900} c="dark">{perfection}%</Text>
                  <Text size="xs" c="dark" fw={600}>perfect</Text>
                </Stack>
              </Group>
            </Paper>
          </Box>
        </Box>

        {/* New Driver Badge */}
        {driverStatus && (
          <Box px="xl" style={{ marginTop: -16, position: 'relative', zIndex: 10 }}>
            <Paper
              p="md"
              radius="lg"
              style={{ background: 'linear-gradient(to right, var(--mantine-color-orange-5), var(--mantine-color-red-6))', boxShadow: '0 10px 15px rgba(0,0,0,0.2)' }}
            >
              <Group gap="md">
                <ThemeIcon size="lg" radius="xl" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
                  <IconFlame size={20} color="white" />
                </ThemeIcon>
                <Text c="white" fw={900} size="sm">{driverStatus}</Text>
              </Group>
            </Paper>
          </Box>
        )}

        {/* Menu Items */}
        <Stack gap="xs" p="md" pt="xl">
          {menuItems.map((item, idx) => {
            const isActive = activeTab === item.path;
            const IconComponent = item.icon;
            const isMessagesItem = item.path === 'messages';
            return (
              <Button
                key={idx}
                onClick={() => handleMenuClick(item.path)}
                variant={isActive ? 'filled' : 'subtle'}
                color={isActive ? 'orange' : 'gray'}
                fullWidth
                justify="flex-start"
                leftSection={
                  <ThemeIcon
                    size="lg"
                    radius="md"
                    color={isActive ? 'white' : 'orange'}
                    variant={isActive ? 'light' : 'light'}
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : 'var(--mantine-color-orange-1)' }}
                  >
                    {isMessagesItem ? (
                      <img 
                        src="/app-chat.png" 
                        alt="Messages" 
                        style={{ 
                          width: '24px', 
                          height: '24px',
                          filter: isActive ? 'brightness(0) invert(1)' : 'none'
                        }} 
                      />
                    ) : (
                      <IconComponent size={24} color={isActive ? 'white' : 'var(--mantine-color-orange-6)'} />
                    )}
                  </ThemeIcon>
                }
                size="lg"
                style={{
                  background: isActive 
                    ? 'linear-gradient(to right, var(--mantine-color-orange-5), var(--mantine-color-red-6))' 
                    : undefined,
                  color: isActive ? 'white' : 'var(--mantine-color-gray-7)',
                  boxShadow: isActive ? '0 4px 6px rgba(0,0,0,0.1)' : undefined,
                  transform: isActive ? 'scale(1.05)' : undefined,
                }}
              >
                <Text fw={700} size="lg">{item.label}</Text>
              </Button>
            );
          })}
        </Stack>

        {/* Logout */}
        <Box px="md" pb="xl">
          <Button
            onClick={handleLogout}
            variant="light"
            color="red"
            fullWidth
            justify="flex-start"
            leftSection={
              <ThemeIcon size="lg" radius="md" color="red" variant="light">
                <IconLogout size={24} color="var(--mantine-color-red-6)" />
              </ThemeIcon>
            }
            size="lg"
            style={{ border: '2px solid var(--mantine-color-red-2)' }}
          >
            <Text fw={700} size="lg" c="red.6">Logout</Text>
          </Button>
        </Box>

        {/* Bottom Accent */}
        <Box h={80} />
      </Paper>
    </Box>
  );
};

export default FeederSidebarMenu;
