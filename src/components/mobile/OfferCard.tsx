import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  Badge,
  Card,
  CardBody,
  HStack,
  Icon,
  Progress,
} from '@chakra-ui/react';
import { Star, MapPin, Clock, Package } from 'lucide-react';

interface Offer {
  id: string;
  pickupName: string;
  pickupRating: number;
  dropoffDistance: number;
  estimatedTime: number;
  estimatedPay: number;
  itemCount: number;
  miles: number;
}

interface OfferCardProps {
  offer: Offer;
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
  countdownSeconds?: number;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  onAccept,
  onDecline,
  countdownSeconds = 30
}) => {
  const [timeLeft, setTimeLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onDecline(offer.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, offer.id, onDecline]);

  const progressPercentage = (timeLeft / countdownSeconds) * 100;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={50}
      bg="blackAlpha.600"
      backdropFilter="blur(4px)"
      display="flex"
      alignItems="flex-end"
    >
      <Box w="100%" p={4}>
        <Card w="100%" boxShadow="xl" borderRadius="lg">
          <CardBody p={6}>
            <Progress
              value={progressPercentage}
              colorScheme="blue"
              size="sm"
              borderRadius="full"
              mb={4}
              transition="all 1s linear"
            />

            <Flex align="center" justify="space-between" mb={4}>
              <Box flex={1}>
                <HStack spacing={2} mb={1}>
                  <Heading size="md" fontWeight="semibold">{offer.pickupName}</Heading>
                  <HStack spacing={1}>
                    <Icon as={Star} h={4} w={4} color="yellow.400" fill="yellow.400" />
                    <Text fontSize="sm" fontWeight="medium">{offer.pickupRating}</Text>
                  </HStack>
                </HStack>
                <HStack spacing={4} fontSize="sm" color="gray.500">
                  <HStack spacing={1}>
                    <Icon as={MapPin} h={4} w={4} />
                    <Text>{offer.dropoffDistance} mi</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={Clock} h={4} w={4} />
                    <Text>{offer.estimatedTime} min</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Icon as={Package} h={4} w={4} />
                    <Text>{offer.itemCount} items</Text>
                  </HStack>
                </HStack>
              </Box>
              
              <Box textAlign="right">
                <Text fontSize="2xl" fontWeight="bold" color="green.600">
                  ${offer.estimatedPay.toFixed(2)}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {offer.miles.toFixed(1)} mi total
                </Text>
              </Box>
            </Flex>

            <Box textAlign="center" mb={4}>
              <Badge variant="outline" fontSize="sm">
                {timeLeft}s remaining
              </Badge>
            </Box>

            <HStack spacing={3}>
              <Button
                variant="outline"
                onClick={() => onDecline(offer.id)}
                flex={1}
              >
                Decline
              </Button>
              <Button
                onClick={() => onAccept(offer.id)}
                flex={1}
                colorScheme="green"
              >
                Accept
              </Button>
            </HStack>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
};
