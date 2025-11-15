import React, { useState, useEffect, useMemo } from 'react';
import { Check, MapPin, Navigation, DollarSign, Clock, Package, Home, Bell, Copy, Camera, RotateCcw, Utensils } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import FullscreenCamera from './FullscreenCamera';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ===== TYPES =====

type DeliveryStage = 'navigate_to_restaurant' | 'arrived_at_restaurant' | 'verify_pickup' | 'pickup_photo_verification' | 'navigate_to_customer' | 'capture_proof' | 'delivered';

interface OrderItem {
  name: string;
  quantity: number;
  special_instructions?: string;
}

interface DeliveryProgress {
  currentStage: DeliveryStage;
  stageNumber: number;
  totalStages: number;
  stageName: string;
  isCompleted: boolean;
  pickupPhotoUrl?: string;
  deliveryPhotoUrl?: string;
}

interface ActiveDeliveryProps {
  orderDetails: any;
  onCompleteDelivery: () => void;
  onProgressChange?: (progress: DeliveryProgress) => void;
  onCameraStateChange?: (isOpen: boolean) => void;
}

// ===== DRIVER STATUS =====

const DRIVER_STATUS = {
  TO_STORE: 'to_store',
  AT_STORE: 'at_store',
  AWAITING_PICKUP_PHOTO: 'awaiting_pickup_photo',
  TO_CUSTOMER: 'to_customer',
  AT_CUSTOMER: 'at_customer',
  AWAITING_DELIVERY_PHOTO: 'awaiting_delivery_photo',
  COMPLETE: 'complete',
};

const STATUS_TO_STAGE_MAP: Record<string, DeliveryStage> = {
  [DRIVER_STATUS.TO_STORE]: 'navigate_to_restaurant',
  [DRIVER_STATUS.AT_STORE]: 'arrived_at_restaurant',
  [DRIVER_STATUS.AWAITING_PICKUP_PHOTO]: 'pickup_photo_verification',
  [DRIVER_STATUS.TO_CUSTOMER]: 'navigate_to_customer',
  [DRIVER_STATUS.AT_CUSTOMER]: 'arrived_at_restaurant',
  [DRIVER_STATUS.AWAITING_DELIVERY_PHOTO]: 'capture_proof',
  [DRIVER_STATUS.COMPLETE]: 'delivered',
};

const STAGE_NAMES: Record<DeliveryStage, string> = {
  navigate_to_restaurant: 'Navigate to Restaurant',
  arrived_at_restaurant: 'Arrived at Restaurant',
  verify_pickup: 'Verify Pickup',
  pickup_photo_verification: 'Pickup Photo Verification',
  navigate_to_customer: 'Navigate to Customer',
  capture_proof: 'Capture Delivery Proof',
  delivered: 'Delivered',
};

// ===== UTILITY FUNCTIONS =====

const formatAddress = (address: any): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [
      address.street || address.address,
      address.city,
      address.state,
      address.zip || address.zip_code
    ].filter(Boolean);
    return parts.join(', ');
  }
  return String(address);
};

const copyToClipboard = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed'; 
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
  document.body.removeChild(textarea);
};

// ===== PRESENTATIONAL COMPONENTS =====

const SimulatedMapView: React.FC<{ isToStore: boolean }> = ({ isToStore }) => {
  const driverPos = isToStore ? { top: '75%', left: '15%' } : { top: '20%', left: '70%' };
  const storePos = { top: '35%', left: '40%' };
  const customerPos = { top: '65%', left: '80%' };

  const routePath = isToStore 
    ? "M 20 80 L 45 40 L 85 70"
    : "M 75 25 L 85 70";

  return (
    <Box position="absolute" inset={0} bg="gray.900" overflow="hidden">
      <Box position="absolute" inset={0} opacity={0.2}>
        <Box position="absolute" top={0} bottom={0} left="50%" w="16px" bg="gray.700" />
        <Box position="absolute" top="50%" left={0} right={0} h="16px" bg="gray.700" />
        <Box position="absolute" top="10%" right={0} bottom="60%" w="25%" bg="blue.900" opacity={0.5} />
      </Box>

      <Box
        as="svg"
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path 
          d={routePath} 
          fill="none" 
          stroke="#FF3D00" 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeDasharray="8 4"
          style={{
            animation: 'routeFlow 1s linear infinite',
          }}
        />
        <style>{`
          @keyframes routeFlow {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: -12; }
          }
        `}</style>
      </Box>

      <Box position="absolute" {...driverPos} zIndex={30} p={1} bg="blue.500" borderRadius="full" ring={4} ringColor="whiteAlpha.800">
        <Icon as={Navigation} w={4} h={4} color="white" transform="rotate(-45deg)" />
      </Box>
      
      <Box position="absolute" {...storePos} zIndex={20} color="white" bg="red.600" p={1} borderRadius="full" ring={2} ringColor="red.300" boxShadow="lg">
        <Icon as={Utensils} w={4} h={4} />
      </Box>

      <Box position="absolute" {...customerPos} zIndex={20} color="white" bg="green.600" p={1} borderRadius="full" ring={2} ringColor="green.300" boxShadow="lg">
        <Icon as={Home} w={4} h={4} />
      </Box>
    </Box>
  );
};

interface MapHeaderProps {
  title: string;
  status: string;
  locationIcon: React.ReactNode;
  distance: number;
  pay: number;
}

const MapHeader: React.FC<MapHeaderProps> = ({ title, status, locationIcon, distance, pay }) => {
  const payAmount = typeof pay === 'number' ? pay.toFixed(2) : '0.00';
  const bgGradient = useColorModeValue(
    'linear(to-br, orange.600, red.600)',
    'linear(to-br, orange.700, red.700)'
  );
  
  return (
    <Box
      p={4}
      className="safe-area-top"
      color="white"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      h="100%"
      position="relative"
      zIndex={40}
      bgGradient={bgGradient}
      opacity={0.8}
    >
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" fontWeight="bold">CRAVEN</Heading>
        <Badge colorScheme="whiteAlpha" bg="whiteAlpha.200" color="white" borderColor="whiteAlpha.300">
          <HStack spacing={1}>
            <Text fontSize="sm" fontWeight="semibold">ON FIRE</Text>
            <Icon as={Clock} w={4} h={4} ml={1} />
          </HStack>
        </Badge>
      </Flex>

      <Flex justify="space-between" align="flex-end">
        <HStack spacing={3}>
          <Box
            w={10}
            h={10}
            bg="whiteAlpha.20"
            borderRadius="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px"
            borderColor="whiteAlpha.50"
          >
            {locationIcon}
          </Box>
          <Box>
            <Text fontSize="xs" color="whiteAlpha.800" fontWeight="medium">{status}</Text>
            <Heading size="md" fontWeight="bold" isTruncated>{title}</Heading>
          </Box>
        </HStack>

        <Box textAlign="right">
          <Text fontSize="xl" fontWeight="bold" lineHeight="none">
            {typeof distance === 'number' ? distance.toFixed(1) : '0.0'} mi
          </Text>
          <Text fontSize="xs" color="whiteAlpha.800" fontWeight="medium">to destination</Text>
        </Box>
      </Flex>
    </Box>
  );
};

interface DetailCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  actionButton?: React.ReactNode;
  linkHref?: string;
}

const DetailCard: React.FC<DetailCardProps> = ({ title, content, icon, actionButton, linkHref }) => (
  <Card mb={4}>
    <CardBody p={4}>
      <Flex align="flex-start" gap={4}>
        <Box
          w={10}
          h={10}
          bg="orange.100"
          borderRadius="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
        >
          <Box color="orange.600">
            {icon}
          </Box>
        </Box>
        <Box flex={1} minW={0}>
          <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1} textTransform="uppercase" letterSpacing="wide">
            {title}
          </Text>
          {linkHref ? (
            <Text
              as="a"
              href={linkHref}
              fontSize="sm"
              fontWeight="medium"
              color="blue.600"
              _hover={{ color: 'blue.700' }}
              lineHeight="tight"
              display="block"
              isTruncated
              onClick={(e) => { e.preventDefault(); }}
            >
              {content}
            </Text>
          ) : (
            <Text fontSize="sm" fontWeight="medium" color="gray.900" lineHeight="tight" wordBreak="break-word">
              {content}
            </Text>
          )}
        </Box>
        {actionButton && <Box flexShrink={0}>{actionButton}</Box>}
      </Flex>
    </CardBody>
  </Card>
);

// ===== MAIN COMPONENT =====

const CravenDeliveryFlow: React.FC<ActiveDeliveryProps> = ({ 
  orderDetails, 
  onCompleteDelivery, 
  onProgressChange,
  onCameraStateChange 
}) => {
  const toast = useToast();
  
  // Early validation
  if (!orderDetails) {
    return (
      <Flex flex={1} align="center" justify="center" p={6}>
        <Box textAlign="center">
          <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={2}>Missing Order Details</Text>
          <Text fontSize="sm" color="gray.600">Order information is not available.</Text>
        </Box>
      </Flex>
    );
  }

  const [status, setStatus] = useState(DRIVER_STATUS.TO_STORE);
  const [pickupCode, setPickupCode] = useState<string | null>(null);
  const [pickupPhotoUrl, setPickupPhotoUrl] = useState<string>();
  const [deliveryPhotoUrl, setDeliveryPhotoUrl] = useState<string>();
  const [showCamera, setShowCamera] = useState(false);
  const [photoType, setPhotoType] = useState<'pickup' | 'delivery'>('pickup');

  const isTestOrder = orderDetails.isTestOrder || false;

  const currentOrder = useMemo(() => {
    return {
      id: orderDetails?.id || orderDetails?.order_id || 'CRAVEN-' + Math.floor(Math.random() * 9000 + 1000),
      pay: orderDetails?.payout_cents ? (orderDetails.payout_cents / 100) : (orderDetails?.pay || orderDetails?.total || 16.25),
      distanceToStore: orderDetails?.distance_mi || (orderDetails?.distance_km ? orderDetails.distance_km * 0.621371 : 0.8),
      distanceToCustomer: orderDetails?.distance_mi || (orderDetails?.distance_km ? orderDetails.distance_km * 0.621371 : 5.1),
      totalDistance: orderDetails?.distance_mi || (orderDetails?.distance_km ? orderDetails.distance_km * 0.621371 : 5.9),
      timeEstimate: orderDetails?.estimated_time || 30,
      store: {
        name: orderDetails?.restaurant_name || 'Craven Restaurant',
        address: formatAddress(orderDetails?.pickup_address) || '123 Main St',
        pickupCode: pickupCode || 'LOADING...',
        phone: orderDetails?.customer_phone || '(555) 555-5555',
      },
      customer: {
        name: orderDetails?.customer_name || 'Customer',
        address: formatAddress(orderDetails?.dropoff_address) || '456 Oak Ave',
        deliveryNotes: orderDetails?.delivery_notes || 'Ring doorbell',
        phone: orderDetails?.customer_phone || '(555) 555-1234',
      },
      items: orderDetails?.items || [],
    };
  }, [orderDetails, pickupCode]);

  useEffect(() => {
    if (isTestOrder || !orderDetails.order_id) return;
    
    const fetchPickupCode = async () => {
      try {
        const { data } = await supabase
          .from('orders')
          .select('pickup_code')
          .eq('id', orderDetails.order_id)
          .maybeSingle();
        if (data?.pickup_code) {
          setPickupCode(data.pickup_code);
        }
      } catch (error) {
        console.error('Error fetching pickup code:', error);
      }
    };
    fetchPickupCode();
  }, [orderDetails.order_id, isTestOrder]);

  const updateOrderStatus = async (newStatus: string) => {
    if (isTestOrder || !orderDetails.order_id) return;
    
    try {
      const statusMap: Record<string, string> = {
        'at_restaurant': 'assigned',
        'picked_up': 'picked_up',
        'at_customer': 'picked_up',
      };
      
      const dbStatus = statusMap[newStatus] || newStatus;
      
      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderDetails.order_id);
        
      if (error) throw error;
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const uploadPhoto = async (photoDataUrl: string, type: 'pickup' | 'delivery'): Promise<string | null> => {
    if (isTestOrder) {
      return `https://mock-storage.com/${type}-${Date.now()}.jpg`;
    }

    if (!orderDetails.order_id) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileName = `${orderDetails.order_id}/${type}-${Date.now()}.jpg`;
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: 'image/jpeg' });

      const { data, error } = await supabase.storage
        .from('delivery-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('delivery-photos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload photo. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
  };

  useEffect(() => {
    if (onProgressChange) {
      const stage = STATUS_TO_STAGE_MAP[status];
      if (stage) {
        const stageNumber = Object.keys(STATUS_TO_STAGE_MAP).indexOf(status) + 1;
        const progress: DeliveryProgress = {
          currentStage: stage,
          stageNumber,
          totalStages: 7,
          stageName: STAGE_NAMES[stage],
          isCompleted: status === DRIVER_STATUS.COMPLETE,
          pickupPhotoUrl,
          deliveryPhotoUrl,
        };
        onProgressChange(progress);
      }
    }
  }, [status, onProgressChange, pickupPhotoUrl, deliveryPhotoUrl]);

  useEffect(() => {
    if (onCameraStateChange) {
      const isCameraOpen = status === DRIVER_STATUS.AWAITING_PICKUP_PHOTO || status === DRIVER_STATUS.AWAITING_DELIVERY_PHOTO;
      onCameraStateChange(isCameraOpen);
    }
  }, [status, onCameraStateChange]);

  const handleConfirmArrivalAtStore = async () => {
    setStatus(DRIVER_STATUS.AT_STORE);
    await updateOrderStatus('at_restaurant');
  };

  const handleStartPickupVerification = () => {
    setPhotoType('pickup');
    setShowCamera(true);
    onCameraStateChange?.(true);
  };
  
  const handleConfirmPickupPhoto = async (photoUrl: string) => {
    const uploadedUrl = await uploadPhoto(photoUrl, 'pickup');
    if (uploadedUrl) {
      setPickupPhotoUrl(uploadedUrl);
      setStatus(DRIVER_STATUS.TO_CUSTOMER);
      await updateOrderStatus('picked_up');
    }
    setShowCamera(false);
    onCameraStateChange?.(false);
  };
  
  const handleConfirmArrivalAtCustomer = async () => {
    setStatus(DRIVER_STATUS.AT_CUSTOMER);
    await updateOrderStatus('at_customer');
  };
  
  const handleStartDeliveryVerification = () => {
    setPhotoType('delivery');
    setShowCamera(true);
    onCameraStateChange?.(true);
  };
  
  const handleConfirmDeliveryPhoto = async (photoUrl: string) => {
    const uploadedUrl = await uploadPhoto(photoUrl, 'delivery');
    if (uploadedUrl) {
      setDeliveryPhotoUrl(uploadedUrl);
      
      if (!isTestOrder && orderDetails.order_id) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.functions.invoke('finalize-delivery', {
            body: {
              orderId: orderDetails.order_id,
              driverId: user?.id,
              pickupPhotoUrl: pickupPhotoUrl,
              deliveryPhotoUrl: uploadedUrl,
            }
          });
        } catch (error) {
          console.error('Error finalizing delivery:', error);
        }
      }
      
      setStatus(DRIVER_STATUS.COMPLETE);
    }
    setShowCamera(false);
    onCameraStateChange?.(false);
  };

  const handleCancelPhoto = () => {
    if (status === DRIVER_STATUS.AWAITING_PICKUP_PHOTO) {
      setStatus(DRIVER_STATUS.AT_STORE);
    } else if (status === DRIVER_STATUS.AWAITING_DELIVERY_PHOTO) {
      setStatus(DRIVER_STATUS.AT_CUSTOMER);
    }
    setShowCamera(false);
    onCameraStateChange?.(false);
  };

  const currentFlow = useMemo(() => {
    switch (status) {
      case DRIVER_STATUS.TO_STORE:
      case DRIVER_STATUS.AT_STORE:
      case DRIVER_STATUS.AWAITING_PICKUP_PHOTO:
        return {
          title: currentOrder.store.name,
          statusText: status === DRIVER_STATUS.TO_STORE ? 'Routing to Kitchen' 
                      : status === DRIVER_STATUS.AT_STORE ? 'Awaiting Hand-off'
                      : 'Verify Pickup',
          address: currentOrder.store.address,
          distance: currentOrder.distanceToStore,
          icon: <Icon as={Utensils} w={5} h={5} />,
          isPickup: true,
        };
      case DRIVER_STATUS.TO_CUSTOMER:
      case DRIVER_STATUS.AT_CUSTOMER:
      case DRIVER_STATUS.AWAITING_DELIVERY_PHOTO:
        return {
          title: currentOrder.customer.name,
          statusText: status === DRIVER_STATUS.TO_CUSTOMER ? 'En Route to Customer' 
                      : status === DRIVER_STATUS.AT_CUSTOMER ? 'At Drop-off Location'
                      : 'Verify Drop-off',
          address: currentOrder.customer.address,
          distance: currentOrder.distanceToCustomer,
          icon: <Icon as={Home} w={5} h={5} />,
          isPickup: false,
        };
      default:
        return {
          title: currentOrder.store.name,
          statusText: 'Preparing for pickup',
          address: currentOrder.store.address,
          distance: currentOrder.distanceToStore,
          icon: <Icon as={Utensils} w={5} h={5} />,
          isPickup: true,
        };
    }
  }, [status, currentOrder]);

  if (showCamera) {
    return (
      <FullscreenCamera
        isOpen={showCamera}
        onClose={handleCancelPhoto}
        onCapture={photoType === 'pickup' ? handleConfirmPickupPhoto : handleConfirmDeliveryPhoto}
        title={photoType === 'pickup' ? "Kitchen Hand-off Check" : "Customer Drop-off Proof"}
        description={photoType === 'pickup' ? 
          "Snap a photo of the sealed Craven bag with the order ID sticker clearly visible." : 
          "Take a photo showing the delivered bag at the customer's preferred drop-off location."}
        type={photoType}
        onVisibilityChange={onCameraStateChange}
      />
    );
  }

  const renderActiveFlow = () => {
    const payAmount = typeof currentOrder.pay === 'number' ? currentOrder.pay : parseFloat(String(currentOrder.pay || 0));
    const isToStore = currentFlow?.isPickup ?? true;

    if (!currentFlow || !currentFlow.title) {
      return (
        <Flex flex={1} align="center" justify="center" p={6}>
          <Box textAlign="center">
            <Text fontSize="lg" fontWeight="semibold" color="gray.900" mb={2}>Loading delivery details...</Text>
            <Text fontSize="sm" color="gray.600">Please wait while we load your order information.</Text>
          </Box>
        </Flex>
      );
    }

    return (
      <Flex flex={1} flexDirection="column" fontFamily="sans-serif">
        <Box h="40%" w="100%" position="relative" flexShrink={0}>
          <SimulatedMapView isToStore={isToStore} /> 
          <MapHeader
            title={currentFlow.title}
            status={currentFlow.statusText || ''}
            locationIcon={currentFlow.icon}
            distance={currentFlow.distance || 0}
            pay={payAmount}
          />
        </Box>
        <Box h={6} />

        <Box flex={1} px={4} pb={4} overflowY="auto" bg="white" borderTopRadius="3xl" mt={-6}>
          <VStack spacing={4} pt={6} align="stretch">
            <Flex align="center" justify="space-between">
              <Heading size="lg" fontWeight="bold" color="gray.900">
                Order #{currentOrder.id.split('-')[1] || currentOrder.id.slice(-8)}
              </Heading>
              {isTestOrder && (
                <Badge colorScheme="orange" variant="outline" bg="orange.50" color="orange.600" borderColor="orange.300">
                  Test Order
                </Badge>
              )}
            </Flex>
        
            {currentFlow.isPickup ? (
              <>
                <DetailCard 
                  title="PICKUP ADDRESS"
                  content={currentOrder.store.address}
                  icon={<Icon as={MapPin} w={5} h={5} />}
                  actionButton={
                    <Button 
                      variant="outline"
                      size="sm"
                      title="Start Navigation"
                      onClick={() => {
                        const address = encodeURIComponent(currentOrder.store.address || '');
                        window.open(`https://maps.apple.com/?daddr=${address}`, '_blank');
                      }}
                    >
                      <Icon as={Navigation} w={4} h={4} mr={1} /> Navigate
                    </Button>
                  }
                />
                {pickupCode && (
                  <DetailCard 
                    title="ORDER CODE (FOR KITCHEN)"
                    content={pickupCode}
                    icon={<Icon as={Package} w={5} h={5} />}
                    actionButton={
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          copyToClipboard(pickupCode);
                          toast({
                            title: "Copied!",
                            description: `Pickup code ${pickupCode} copied to clipboard`,
                            status: "success",
                            duration: 2000,
                            isClosable: true,
                          });
                        }} 
                        title="Copy Code"
                      >
                        <Icon as={Copy} w={4} h={4} />
                      </Button>
                    }
                  />
                )}
                
                {currentOrder.items && currentOrder.items.length > 0 && (
                  <Card bg="orange.50" borderColor="orange.200">
                    <CardHeader pb={3}>
                      <Heading size="sm" fontWeight="semibold" color="orange.700">
                        Items ({currentOrder.items.length})
                      </Heading>
                    </CardHeader>
                    <CardBody pt={0}>
                      <VStack spacing={2} align="stretch">
                        {currentOrder.items.map((item: any, index: number) => (
                          <Flex key={index} justify="space-between" align="center" py={1} borderBottom="1px" borderColor="orange.100" _last={{ borderBottom: 'none' }}>
                            <Text fontSize="sm" color="gray.900">{item.name}</Text>
                            <Badge colorScheme="gray" ml={2}>
                              x{item.qty || item.quantity}
                            </Badge>
                          </Flex>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                <Card mt={4}>
                  <CardBody p={4}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={1}>
                        <Icon as={DollarSign} w={4} h={4} color="green.600" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.500">Estimated Pay</Text>
                      </HStack>
                      <Text fontSize="2xl" fontWeight="bold" color="green.700" lineHeight="none">
                        ${typeof payAmount === 'number' ? payAmount.toFixed(2) : String(payAmount || '0.00')}
                      </Text>
                    </Flex>
                  </CardBody>
                </Card>

                {status === DRIVER_STATUS.TO_STORE && (
                  <Button 
                    onClick={handleConfirmArrivalAtStore}
                    size="lg"
                    w="100%"
                    mt={4}
                    colorScheme="gray"
                  >
                    Arrived at Craven Kitchen
                  </Button>
                )}
                
                {status === DRIVER_STATUS.AT_STORE && (
                  <Button 
                    onClick={handleStartPickupVerification}
                    size="lg"
                    w="100%"
                    mt={4}
                    colorScheme="gray"
                  >
                    Order Ready? Start Hand-off Check
                  </Button>
                )}
              </>
            ) : (
              <>
                <DetailCard 
                  title="CUSTOMER ADDRESS"
                  content={currentOrder.customer.address}
                  icon={<Icon as={Home} w={5} h={5} />}
                  actionButton={
                    <Button 
                      variant="outline"
                      size="sm"
                      title="Start Navigation"
                      onClick={() => {
                        const address = encodeURIComponent(currentOrder.customer.address || '');
                        window.open(`https://maps.apple.com/?daddr=${address}`, '_blank');
                      }}
                    >
                      <Icon as={Navigation} w={4} h={4} mr={1} /> Navigate
                    </Button>
                  }
                />
                {currentOrder.customer.deliveryNotes && (
                  <DetailCard 
                    title="SPECIAL INSTRUCTIONS"
                    content={currentOrder.customer.deliveryNotes}
                    icon={<Icon as={Bell} w={5} h={5} />}
                    actionButton={
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          copyToClipboard(currentOrder.customer.deliveryNotes);
                          toast({
                            title: "Copied!",
                            description: "Delivery notes copied to clipboard",
                            status: "success",
                            duration: 2000,
                            isClosable: true,
                          });
                        }} 
                        title="Copy Instructions"
                      >
                        <Icon as={Copy} w={4} h={4} />
                      </Button>
                    }
                  />
                )}

                <Card mt={4}>
                  <CardBody p={4}>
                    <Flex justify="space-between" align="center">
                      <HStack spacing={1}>
                        <Icon as={DollarSign} w={4} h={4} color="green.600" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.500">Estimated Pay</Text>
                      </HStack>
                      <Text fontSize="2xl" fontWeight="bold" color="green.700" lineHeight="none">
                        ${typeof payAmount === 'number' ? payAmount.toFixed(2) : String(payAmount || '0.00')}
                      </Text>
                    </Flex>
                  </CardBody>
                </Card>

                {status === DRIVER_STATUS.TO_CUSTOMER && (
                  <Button 
                    onClick={handleConfirmArrivalAtCustomer}
                    size="lg"
                    w="100%"
                    mt={4}
                    colorScheme="gray"
                  >
                    Arrived at Customer's Location
                  </Button>
                )}
                
                {status === DRIVER_STATUS.AT_CUSTOMER && (
                  <Button 
                    onClick={handleStartDeliveryVerification}
                    size="lg"
                    w="100%"
                    mt={4}
                    colorScheme="gray"
                  >
                    Drop-off & Complete Delivery
                  </Button>
                )}
              </>
            )}
          </VStack>
        </Box>
      </Flex>
    );
  };

  const renderComplete = () => {
    const bgGradient = useColorModeValue(
      'linear(to-br, orange.600, red.600)',
      'linear(to-br, orange.700, red.700)'
    );
    
    return (
      <Flex
        flex={1}
        flexDirection="column"
        align="center"
        justify="center"
        p={6}
        textAlign="center"
        bgGradient={bgGradient}
      >
        <Box className="safe-area-top" />
        <Icon as={Check} w={20} h={20} color="white" mb={6} border="4px" borderColor="white" borderRadius="full" p={2} bg="green.500" opacity={0.8} />
        <Heading size="xl" fontWeight="bold" color="white" mb={2}>Delivery Complete!</Heading>
        <Text color="whiteAlpha.900" mb={1} fontWeight="medium" fontSize="lg">Great job! You earned:</Text>
        <Text fontSize="5xl" fontWeight="bold" color="white" mb={8} textShadow="lg">
          ${typeof currentOrder.pay === 'number' ? currentOrder.pay.toFixed(2) : parseFloat(String(currentOrder.pay || 0)).toFixed(2)}
        </Text>

        <Card w="100%" maxW="sm" mb={8}>
          <CardHeader>
            <Heading size="sm" fontWeight="semibold" color="gray.500" textTransform="uppercase" letterSpacing="wide">
              Order Summary
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={2} align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.500">Order ID:</Text>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {currentOrder.id.split('-')[1] || currentOrder.id.slice(-8)}
                </Text>
              </Flex>
              <Flex justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.500">Total Distance:</Text>
                <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                  {currentOrder.totalDistance.toFixed(1)} mi
                </Text>
              </Flex>
            </VStack>
          </CardBody>
        </Card>

        <Button
          onClick={onCompleteDelivery}
          size="lg"
          variant="solid"
          colorScheme="gray"
          w="100%"
          maxW="sm"
          h={14}
          fontSize="lg"
          fontWeight="semibold"
        >
          Continue Accepting Orders
        </Button>
      </Flex>
    );
  };

  if (status === DRIVER_STATUS.COMPLETE) {
    return renderComplete();
  }
  
  return renderActiveFlow();
}

export default CravenDeliveryFlow;
