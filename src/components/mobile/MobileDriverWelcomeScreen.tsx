import React, { useEffect, useState } from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Image,
  Link,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import mobileDriverWelcomeImage from '@/assets/mobile-driver-welcome.png';
import MobileFeederLogin from './MobileFeederLogin';
import { supabase } from '@/integrations/supabase/client';

interface MobileDriverWelcomeScreenProps {
  onStartFeeding?: () => void;
}

const MobileDriverWelcomeScreen: React.FC<MobileDriverWelcomeScreenProps> = ({ 
  onStartFeeding 
}) => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  
  console.log('MobileDriverWelcomeScreen rendered');
  console.log('Image source:', mobileDriverWelcomeImage);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('Session exists, redirecting to dashboard');
          if (onStartFeeding) {
            onStartFeeding();
          } else {
            navigate('/mobile');
          }
        }
      } catch (e) {
        console.error('Session check failed:', e);
      }
    };
    
    const timeoutId = setTimeout(() => {
      console.log('Session check timeout - proceeding with welcome screen');
    }, 1000);
    
    checkExistingSession().finally(() => clearTimeout(timeoutId));
  }, []);

  const handleFeedNow = () => {
    console.log('FEED NOW clicked, showing login screen');
    setShowLogin(true);
  };

  const handleLoginSuccess = () => {
    console.log('Login successful, proceeding to dashboard');
    setShowLogin(false);
    if (onStartFeeding) {
      onStartFeeding();
    } else {
      navigate('/mobile');
    }
  };

  return (
    <Box position="fixed" inset={0} w="100%" h="100%" bg="white">
      <Box
        position="absolute"
        left={0}
        right={0}
        zIndex={10}
        top="calc(env(safe-area-inset-top, 150px) + 8px)"
      >
        <Box px={4} textAlign="center">
          <Text fontSize="xs" color="gray.600">
            Wrong app if you're Crave'N food{' '}
            <Link href="/" color="black" textDecoration="underline" fontWeight="medium" _hover={{ color: 'black' }}>
              Download app for Customers
            </Link>
          </Text>
        </Box>
      </Box>

      <Image
        src={mobileDriverWelcomeImage}
        alt="CRAVE'N Delivery Rider"
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        objectFit="cover"
        onLoad={() => console.log('Mobile driver welcome image loaded successfully')}
        onError={(e) => {
          console.error('Mobile driver welcome image failed to load:', e);
          e.currentTarget.style.display = 'none';
          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
          if (nextElement) {
            nextElement.style.display = 'block';
          }
        }}
      />
      
      <Box
        display="none"
        position="absolute"
        inset={0}
        w="100%"
        h="100%"
        bgGradient="linear(to-br, orange.400, orange.600)"
      />

      {showLogin ? (
        <MobileFeederLogin onLoginSuccess={handleLoginSuccess} />
      ) : (
        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          flexDirection="column"
          align="center"
          justify="flex-end"
          pb={8}
          px={6}
          zIndex={20}
        >
          <Button
            size="lg"
            w="100%"
            maxW="400px"
            h={14}
            fontSize="xl"
            fontWeight="bold"
            bgGradient="linear(to-r, orange.500, orange.600)"
            _hover={{ bgGradient: 'linear(to-r, orange.600, orange.700)' }}
            color="white"
            boxShadow="xl"
            borderRadius="2xl"
            onClick={handleFeedNow}
            mb={4}
          >
            FEED NOW
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default MobileDriverWelcomeScreen;
