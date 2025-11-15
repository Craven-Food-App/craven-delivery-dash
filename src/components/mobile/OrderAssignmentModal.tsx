import React, { useEffect, useState } from 'react';
import { ChevronRight, Users, MapPin, Clock, DollarSign, Navigation2, X, Package, Phone, MessageSquare, Star } from 'lucide-react';
import { useToast } from '@chakra-ui/react';
import { supabase } from '@/integrations/supabase/client';
import { DeliveryMap } from './DeliveryMap';
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Badge,
  Card,
  CardBody,
  CardHeader,
  VStack,
  HStack,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Grid,
  Divider,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react';

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
  const toast = useToast();

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
      toast({ title: "Order Accepted!", description: "Navigate to the pickup location.", status: "success" });
    }
  };

  const handleDecline = () => {
    if (assignment) {
      onDecline(assignment);
      toast({ title: "Order Declined", description: "Looking for new offers...", status: "info" });
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
    <Modal isOpen={isOpen} onClose={handleDecline} size="full" motionPreset="slideInBottom">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent
        bg="white"
        borderTopRadius="3xl"
        maxW="md"
        mx={4}
        mb={20}
        maxH="85vh"
        overflowY="auto"
      >
        <ModalBody p={0}>
          <Flex
            px={4}
            py={4}
            align="center"
            justify="space-between"
            borderBottom="1px"
            borderColor="gray.200"
          >
            <Box>
              <Heading size="md" fontWeight="bold">New Delivery Request</Heading>
              <Text fontSize="sm" color="gray.500">Order #{assignment.order_id.slice(-6)}</Text>
            </Box>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecline}
              p={2}
            >
              <Icon as={X} h={5} w={5} color="gray.500" />
            </Button>
          </Flex>

          <Box px={4} py={3} bg="red.50" borderBottom="1px" borderColor="red.100">
            <HStack spacing={2} justify="center">
              <Icon as={Clock} h={5} w={5} color="red.600" />
              <Text color="red.700" fontWeight="semibold">
                {timeLeft}s remaining to accept
              </Text>
            </HStack>
          </Box>

          <Progress value={progressPercentage} colorScheme="red" size="sm" />

          <VStack spacing={4} p={4} align="stretch">
            {assignment.isTestOrder && (
              <Card bg="yellow.50" borderColor="yellow.200">
                <CardBody>
                  <HStack spacing={2}>
                    <Text fontSize="lg">🧪</Text>
                    <Box>
                      <Heading size="sm" fontWeight="semibold" color="yellow.900">Test Order</Heading>
                      <Text fontSize="sm" color="yellow.700">This is a test order for training purposes.</Text>
                    </Box>
                  </HStack>
                </CardBody>
              </Card>
            )}

            <Card variant="elevated" p={0} overflow="hidden">
              <Box h="300px" w="100%">
                <DeliveryMap 
                  pickupAddress={assignment.pickup_address}
                  dropoffAddress={assignment.dropoff_address}
                  showRoute={true}
                />
              </Box>
            </Card>

            <Card>
              <CardHeader>
                <HStack spacing={2}>
                  <Icon as={Package} h={5} w={5} color="orange.500" />
                  <Box>
                    <Heading size="sm" fontWeight="semibold">Pickup Location</Heading>
                    <Text fontSize="sm" color="gray.600">{assignment.restaurant_name}</Text>
                  </Box>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <HStack spacing={3} align="flex-start">
                  <Icon as={MapPin} w={4} h={4} color="gray.400" mt={0.5} flexShrink={0} />
                  <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                    {formatAddress(assignment.pickup_address)}
                  </Text>
                </HStack>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <HStack spacing={2}>
                  <Icon as={Users} h={5} w={5} color="orange.500" />
                  <Box>
                    <Heading size="sm" fontWeight="semibold">Delivery Location</Heading>
                    <Text fontSize="sm" color="gray.600">{getCustomerName()}</Text>
                  </Box>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={3} align="stretch">
                  <HStack spacing={3} align="flex-start">
                    <Icon as={MapPin} w={4} h={4} color="gray.400" mt={0.5} flexShrink={0} />
                    <Text fontSize="sm" color="gray.600" lineHeight="relaxed">
                      {formatAddress(assignment.dropoff_address)}
                    </Text>
                  </HStack>
                  
                  {locationType && (
                    <HStack spacing={2}>
                      <Icon as={Star} w={4} h={4} color="orange.500" />
                      <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                        {locationType}
                      </Badge>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            <Card variant="filled">
              <CardBody>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.900">{miles}</Text>
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">Distance</Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="gray.900">{mins}</Text>
                    <Text fontSize="sm" color="gray.500" fontWeight="medium">Est. Time</Text>
                  </Box>
                </Grid>
                
                {routeMiles && routeMins && (
                  <>
                    <Divider my={4} />
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      Actual route: {routeMiles.toFixed(1)} mi • {routeMins} min
                    </Text>
                  </>
                )}
              </CardBody>
            </Card>

            <Card bgGradient="linear(to-r, orange.50, orange.100)" borderColor="orange.200">
              <CardBody>
                <Flex align="center" justify="space-between" mb={4}>
                  <Box>
                    <Heading size="md" fontWeight="semibold" color="orange.900">Your Earnings</Heading>
                    <Text fontSize="sm" color="orange.600">Base pay + tips</Text>
                  </Box>
                  <Box textAlign="right">
                    <Text fontSize="3xl" fontWeight="bold" color="orange.900">
                      ${estimatedPayout}
                    </Text>
                    <Text fontSize="sm" color="orange.600">
                      {payoutPercent}% of delivery fee
                    </Text>
                  </Box>
                </Flex>
                
                <Divider mb={4} />
                <Grid templateColumns="repeat(2, 1fr)" gap={4} fontSize="sm">
                  <Flex justify="space-between">
                    <Text color="gray.600">Subtotal:</Text>
                    <Text fontWeight="medium">${(subtotalCents / 100).toFixed(2)}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text color="gray.600">Tips:</Text>
                    <Text fontWeight="medium">${(tipCents / 100).toFixed(2)}</Text>
                  </Flex>
                </Grid>
              </CardBody>
            </Card>

            <VStack spacing={3} pt={2}>
              <Button
                onClick={handleAccept}
                w="100%"
                size="lg"
                colorScheme="orange"
                leftIcon={<Icon as={Package} h={5} w={5} />}
                boxShadow="lg"
              >
                Accept Delivery
              </Button>
              <Button
                onClick={handleDecline}
                w="100%"
                size="lg"
                variant="outline"
                leftIcon={<Icon as={X} h={5} w={5} />}
              >
                Decline
              </Button>
            </VStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
