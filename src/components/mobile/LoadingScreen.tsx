import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  Spinner,
  VStack,
  HStack,
} from '@chakra-ui/react';
import cravenLogo from '@/assets/craven-c-new.png';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  const [imageError, setImageError] = useState(false);
  const [loadingText, setLoadingText] = useState('Getting ready...');

  useEffect(() => {
    if (!isLoading) return;

    console.log('LoadingScreen: Displaying loading screen');
    
    const messages = [
      'Getting ready...',
      'Loading your dashboard...',
      'Almost there...'
    ];
    let index = 0;
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLoadingText(messages[index]);
    }, 800);

    return () => clearInterval(interval);
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={50}
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-br, orange.500, orange.600)"
    >
      <VStack spacing={8}>
        <Box position="relative">
          {!imageError ? (
            <Image
              src={cravenLogo}
              alt="Crave'n"
              w={32}
              h={32}
              animation="spin 2s ease-in-out infinite"
              onError={() => {
                console.error('LoadingScreen: Failed to load logo image');
                setImageError(true);
              }}
              onLoad={() => console.log('LoadingScreen: Logo loaded successfully')}
            />
          ) : (
            <Spinner
              size="xl"
              thickness="8px"
              speed="1s"
              color="whiteAlpha.300"
              emptyColor="whiteAlpha.300"
            />
          )}
          <Box position="absolute" bottom={-8} left="50%" transform="translateX(-50%)">
            <HStack spacing={1}>
              <Box
                w={2}
                h={2}
                bg="white"
                borderRadius="full"
                animation="pulse 1.4s ease-in-out infinite"
                style={{ animationDelay: '0s' }}
              />
              <Box
                w={2}
                h={2}
                bg="white"
                borderRadius="full"
                animation="pulse 1.4s ease-in-out infinite"
                style={{ animationDelay: '0.2s' }}
              />
              <Box
                w={2}
                h={2}
                bg="white"
                borderRadius="full"
                animation="pulse 1.4s ease-in-out infinite"
                style={{ animationDelay: '0.4s' }}
              />
            </HStack>
          </Box>
        </Box>
        
        <VStack spacing={2} textAlign="center" color="white">
          <Text fontSize="2xl" fontWeight="bold">CRAVE'N</Text>
          <Text fontSize="lg" opacity={0.9}>{loadingText}</Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default LoadingScreen;
