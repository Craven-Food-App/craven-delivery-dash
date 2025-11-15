import React, { useEffect, useState } from 'react';
import { IconUsers, IconMapPin, IconClock, IconCurrencyDollar, IconNavigation, IconX, IconPackage, IconPhone, IconMessageSquare, IconStar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryMap } from './DeliveryMap';
import {
  Box,
  Stack,
  Text,
  Title,
  Button,
  Badge,
  Card,
  Group,
  ActionIcon,
  Modal,
  Grid,
  Divider,
  Progress,
  ThemeIcon,
} from '@mantine/core';

interface OrderAssignment {
  assignment_id: string;
  order_id: string;
  restaurant_name: string;
  pickup_address: any; 
  dropoff_address: any; 
  payout_cents: number;
  distance_km: number;
  distance_mi: string;
  expires_at: string;
  estimated_time: number;
  isTestOrder?: boolean;
}

interface OrderAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: OrderAssignment | null;
  onAccept: (assignment: OrderAssignment) => void;
  onDecline: (assignment: OrderAssignment) => void;
}

export const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onAccept,
  onDecline
}) => {
  const [timeLeft, setTimeLeft] = useState(45);

  const [payoutPercent, setPayoutPercent] = useState<number>(70);
  const [subtotalCents, setSubtotalCents] = useState<number>(0);
  const [tipCents, setTipCents] = useState<number>(0);
  const [routeMiles, setRouteMiles] = useState<number | null>(null);
  const [routeMins, setRouteMins] = useState<number | null>(null);
  const [locationType, setLocationType] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !assignment) return;

    const run = async () => {
      try {
        const { data: setting } = await supabase
          .from('driver_payout_settings')
          .select('percentage')
          .eq('is_active', true)
          .maybeSingle();
        if (setting?.percentage != null) setPayoutPercent(Number(setting.percentage));

        const { data: order } = await supabase
          .from('orders')
          .select('subtotal_cents, tip_cents, dropoff_address, pickup_address')
          .eq('id', assignment.order_id)
          .maybeSingle();

        if (order) {
          setSubtotalCents(Number(order.subtotal_cents || 0));
          setTipCents(Number(order.tip_cents || 0));

          const dAddr: any = order.dropoff_address;
          const type = dAddr?.type || dAddr?.address_type || dAddr?.location_type || null;
          if (type) setLocationType(String(type));
        }
      } catch (e) {
        console.warn('Order detail fetch failed', e);
      }
    };

    run();
  }, [isOpen, assignment]);

  useEffect(() => {
    if (!isOpen || !assignment) return;
    let canceled = false;

    const fetchRoute = async () => {
      try {
        const pAddr: any = assignment.pickup_address;
        const dAddr: any = assignment.dropoff_address;

        const tokRes = await supabase.functions.invoke('get-mapbox-token');
        const token = (tokRes.data as any)?.token;
        if (!token) return;

        const buildAddress = (addr: any) => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (addr.address) return addr.address;
          const parts = [addr.street, addr.city, addr.state, addr.zip_code].filter(Boolean);
          return parts.join(', ');
        };

        const geocode = async (addr: any): Promise<[number, number] | null> => {
          const q = buildAddress(addr);
          if (!q) return null;
          const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?limit=1&access_token=${token}`);
          const j = await res.json();
          const c = j?.features?.[0]?.center;
          return Array.isArray(c) && c.length === 2 ? [Number(c[0]), Number(c[1])] : null;
        };

        let pLat = Number(pAddr?.lat ?? pAddr?.latitude);
        let pLng = Number(pAddr?.lng ?? pAddr?.longitude);
        let dLat = Number(dAddr?.lat ?? dAddr?.latitude);
        let dLng = Number(dAddr?.lng ?? dAddr?.longitude);

        if ([pLat, pLng].some(isNaN)) {
          const g = await geocode(pAddr);
          if (g) { pLng = g[0]; pLat = g[1]; }
        }
        if ([dLat, dLng].some(isNaN)) {
          const g = await geocode(dAddr);
          if (g) { dLng = g[0]; dLat = g[1]; }
        }

        if ([pLat, pLng, dLat, dLng].some(isNaN)) return;

        let originLat: number | null = null;
        let originLng: number | null = null;
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 5000 })
          );
          originLat = position.coords.latitude;
          originLng = position.coords.longitude;
        } catch (_) {}

        const coords = originLat && originLng
          ? `${originLng},${originLat};${pLng},${pLat};${dLng},${dLat}`
          : `${pLng},${pLat};${dLng},${dLat}`;

        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}.json?overview=false&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        const route = json?.routes?.[0];

        if (!canceled && route) {
          setRouteMiles(Number((route.distance / 1609.34).toFixed(1)));
          setRouteMins(Math.round(route.duration / 60));
        }
      } catch (e) {
        console.warn('Route fetch failed', e);
      }
    };

    fetchRoute();
    return () => { canceled = true; };
  }, [isOpen, assignment]);

  useEffect(() => {
    if (!isOpen || !assignment) return;

    const playNotificationSequence = async () => {
      try {
        const audioContext = new AudioContext();
        const duration = 0.3;
        const gap = 0.15;
        for (let i = 0; i < 3; i++) {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.setValueAtTime(i % 2 === 0 ? 800 : 600, audioContext.currentTime);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
          const startTime = audioContext.currentTime + (i * (duration + gap));
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        }
      } catch (e) {
        console.log('Notification sound failed:', e);
      }
    };

    playNotificationSequence();
    setTimeLeft(45);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, assignment]);

  const handleAccept = () => {
    if (assignment) {
      onAccept(assignment);
      notifications.show({
        title: 'Order Accepted!',
        message: 'Navigate to the pickup location.',
        color: 'green',
      });
    }
  };

  const handleDecline = () => {
    if (assignment) {
      onDecline(assignment);
      notifications.show({
        title: 'Order Declined',
        message: 'Looking for new offers...',
        color: 'blue',
      });
    }
  };

  if (!isOpen || !assignment) return null;

  const estimatedPayout = (((payoutPercent / 100) * subtotalCents + tipCents) / 100).toFixed(2);
  const milesParsed = parseFloat(assignment.distance_mi || '0') || 0;
  const miles = routeMiles ?? milesParsed;
  const mins = routeMins ?? (assignment.estimated_time || 0);

  const formatAddress = (addr: any): string => {
    if (typeof addr === 'string') return addr;
    if (addr?.address) return addr.address;
    const parts = [addr?.street, addr?.city, addr?.state].filter(Boolean);
    return parts.join(', ') || 'Address unavailable';
  };

  const getCustomerName = () => {
    if (typeof assignment.dropoff_address === 'object' && assignment.dropoff_address?.name) {
      return assignment.dropoff_address.name;
    }
    return 'Customer';
  };

  const progressPercentage = (timeLeft / 45) * 100;

  return (
    <Modal 
      opened={isOpen} 
      onClose={handleDecline} 
      fullScreen
      transitionProps={{ transition: 'slide-up' }}
      styles={{
        body: {
          padding: 0,
        },
        content: {
          backgroundColor: 'white',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxWidth: '448px',
          margin: '0 auto 80px',
          maxHeight: '85vh',
          overflowY: 'auto',
        },
      }}
    >
      <Group
        px="md"
        py="md"
        align="center"
        justify="space-between"
        style={{ borderBottom: '1px solid var(--mantine-color-gray-2)' }}
      >
        <Box>
          <Title order={4} fw={700}>New Delivery Request</Title>
          <Text size="sm" c="dimmed">Order #{assignment.order_id.slice(-6)}</Text>
        </Box>
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={handleDecline}
        >
          <IconX size={20} color="var(--mantine-color-gray-6)" />
        </ActionIcon>
      </Group>

      <Box px="md" py="sm" bg="red.0" style={{ borderBottom: '1px solid var(--mantine-color-red-1)' }}>
        <Group gap="sm" justify="center">
          <IconClock size={20} color="var(--mantine-color-red-6)" />
          <Text c="red.7" fw={600}>
            {timeLeft}s remaining to accept
          </Text>
        </Group>
      </Box>

      <Progress value={progressPercentage} color="red" size="sm" />

      <Stack gap="md" p="md" align="stretch">
        {assignment.isTestOrder && (
          <Card bg="yellow.0" style={{ borderColor: 'var(--mantine-color-yellow-2)' }} withBorder>
            <Group gap="sm">
              <Text size="lg">🧪</Text>
              <Box>
                <Title order={5} fw={600} c="yellow.9">Test Order</Title>
                <Text size="sm" c="yellow.7">This is a test order for training purposes.</Text>
              </Box>
            </Group>
          </Card>
        )}

        <Card shadow="sm" p={0} style={{ overflow: 'hidden' }} withBorder>
          <Box h={300} w="100%">
            <DeliveryMap 
              pickupAddress={assignment.pickup_address}
              dropoffAddress={assignment.dropoff_address}
              showRoute={true}
            />
          </Box>
        </Card>

        <Card withBorder>
          <Card.Section p="md" pb="xs">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="xl" color="orange" variant="light">
                <IconPackage size={20} />
              </ThemeIcon>
              <Box>
                <Title order={5} fw={600}>Pickup Location</Title>
                <Text size="sm" c="dimmed">{assignment.restaurant_name}</Text>
              </Box>
            </Group>
          </Card.Section>
          <Card.Section px="md" pb="md">
            <Group gap="md" align="flex-start">
              <IconMapPin size={16} color="var(--mantine-color-gray-4)" style={{ marginTop: 2, flexShrink: 0 }} />
              <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                {formatAddress(assignment.pickup_address)}
              </Text>
            </Group>
          </Card.Section>
        </Card>

        <Card withBorder>
          <Card.Section p="md" pb="xs">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="xl" color="orange" variant="light">
                <IconUsers size={20} />
              </ThemeIcon>
              <Box>
                <Title order={5} fw={600}>Delivery Location</Title>
                <Text size="sm" c="dimmed">{getCustomerName()}</Text>
              </Box>
            </Group>
          </Card.Section>
          <Card.Section px="md" pb="md">
            <Stack gap="md" align="stretch">
              <Group gap="md" align="flex-start">
                <IconMapPin size={16} color="var(--mantine-color-gray-4)" style={{ marginTop: 2, flexShrink: 0 }} />
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  {formatAddress(assignment.dropoff_address)}
                </Text>
              </Group>
              
              {locationType && (
                <Group gap="sm">
                  <IconStar size={16} color="var(--mantine-color-orange-5)" />
                  <Badge color="orange" variant="light" size="xs">
                    {locationType}
                  </Badge>
                </Group>
              )}
            </Stack>
          </Card.Section>
        </Card>

        <Card variant="filled">
          <Card.Section p="md">
            <Grid gutter="md">
              <Grid.Col span={6}>
                <Box style={{ textAlign: 'center' }}>
                  <Text size="2xl" fw={700} c="dark">{miles}</Text>
                  <Text size="sm" c="dimmed" fw={500}>Distance</Text>
                </Box>
              </Grid.Col>
              <Grid.Col span={6}>
                <Box style={{ textAlign: 'center' }}>
                  <Text size="2xl" fw={700} c="dark">{mins}</Text>
                  <Text size="sm" c="dimmed" fw={500}>Est. Time</Text>
                </Box>
              </Grid.Col>
            </Grid>
            
            {routeMiles && routeMins && (
              <>
                <Divider my="md" />
                <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
                  Actual route: {routeMiles.toFixed(1)} mi • {routeMins} min
                </Text>
              </>
            )}
          </Card.Section>
        </Card>

        <Card style={{ background: 'linear-gradient(to right, var(--mantine-color-orange-0), var(--mantine-color-orange-1))', borderColor: 'var(--mantine-color-orange-2)' }} withBorder>
          <Card.Section p="md">
            <Group align="center" justify="space-between" mb="md">
              <Box>
                <Title order={4} fw={600} c="orange.9">Your Earnings</Title>
                <Text size="sm" c="orange.6">Base pay + tips</Text>
              </Box>
              <Box style={{ textAlign: 'right' }}>
                <Text size="3xl" fw={700} c="orange.9">
                  ${estimatedPayout}
                </Text>
                <Text size="sm" c="orange.6">
                  {payoutPercent}% of delivery fee
                </Text>
              </Box>
            </Group>
            
            <Divider mb="md" />
            <Grid gutter="md" size="sm">
              <Grid.Col span={6}>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Subtotal:</Text>
                  <Text fw={500} size="sm">${(subtotalCents / 100).toFixed(2)}</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={6}>
                <Group justify="space-between">
                  <Text c="dimmed" size="sm">Tips:</Text>
                  <Text fw={500} size="sm">${(tipCents / 100).toFixed(2)}</Text>
                </Group>
              </Grid.Col>
            </Grid>
          </Card.Section>
        </Card>

        <Stack gap="sm" pt="xs">
          <Button
            onClick={handleAccept}
            fullWidth
            size="lg"
            color="orange"
            leftSection={<IconPackage size={20} />}
            style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          >
            Accept Delivery
          </Button>
          <Button
            onClick={handleDecline}
            fullWidth
            size="lg"
            variant="outline"
            leftSection={<IconX size={20} />}
          >
            Decline
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
};
