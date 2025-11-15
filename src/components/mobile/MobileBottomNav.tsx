import React from 'react';
import {
  Box,
  Flex,
  Text,
  Link as ChakraLink,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, User, ShoppingCart } from 'lucide-react';
import ChatButton from '@/components/chat/ChatButton';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface MobileBottomNavProps {
  cartCount?: number;
  user?: any;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount = 0,
  user
}) => {
  const location = useLocation();
  const restaurantsVisible = useFeatureFlag('feature_restaurants_visible');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('orange.500', 'orange.400');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');
  
  const tabs = [
    ...(restaurantsVisible ? [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        path: '/restaurants'
      }, 
      {
        id: 'restaurants',
        label: 'Search',
        icon: Search,
        path: '/restaurants'
      }
    ] : []),
    {
      id: 'orders',
      label: 'Orders',
      icon: ShoppingCart,
      path: user ? '/customer-dashboard?tab=orders' : '/auth'
    }, 
    {
      id: 'profile',
      label: 'Account',
      icon: User,
      path: user ? '/customer-dashboard?tab=account' : '/auth'
    }
  ];

  return (
    <>
      <Box
        position="fixed"
        bottom={20}
        right={4}
        zIndex={50}
        my="340px"
        px={0}
        mx={0}
        py={0}
      >
        <ChatButton
          type="customer_support"
          userType="customer"
          variant="default"
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 border-2 border-background"
        >
          <Box as="span" srOnly>Chat Support</Box>
        </ChatButton>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        zIndex={40}
        h={16}
        className="safe-area-padding-bottom"
      >
        <Flex h="100%">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = tab.id === 'home' 
              ? location.pathname === '/restaurants' || location.pathname === '/'
              : tab.id === 'restaurants' 
                ? location.pathname === '/restaurants'
                : tab.id === 'orders'
                  ? location.pathname === '/customer-dashboard' && location.search.includes('tab=orders')
                  : tab.id === 'profile'
                    ? location.pathname === '/customer-dashboard' && location.search.includes('tab=account')
                    : location.pathname === tab.path;
            
            return (
              <ChakraLink
                key={tab.id}
                as={Link}
                to={tab.path}
                flex={1}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={1}
                px={1}
                h="100%"
                transition="all 0.2s"
                position="relative"
                color={isActive ? activeColor : inactiveColor}
                bg={isActive ? `${activeColor}0D` : 'transparent'}
                _hover={{ color: isActive ? activeColor : 'gray.700' }}
              >
                <Icon as={TabIcon} h={5} w={5} mb={1} />
                <Text fontSize="10px" fontWeight="medium" lineHeight="tight">{tab.label}</Text>
                
                {tab.id === 'orders' && cartCount > 0 && (
                  <Badge
                    position="absolute"
                    top={-1}
                    right="25%"
                    bg="red.500"
                    color="white"
                    fontSize="xs"
                    borderRadius="full"
                    h={5}
                    w={5}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </Badge>
                )}
              </ChakraLink>
            );
          })}
        </Flex>
      </Box>

      <Box h={16} display={{ base: 'block', md: 'none' }} />
    </>
  );
};

export default MobileBottomNav;
