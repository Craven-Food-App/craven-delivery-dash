import React from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';

type DriverTabType = 'home' | 'schedule' | 'earnings' | 'notifications' | 'account';

interface DriverBottomNavProps {
  activeTab: DriverTabType;
  onTabChange: (tab: DriverTabType) => void;
  notificationCount?: number;
}

const tabs = [
  { id: 'home' as const, label: 'Home', icon: '/app-home.png' },
  { id: 'schedule' as const, label: 'Schedule', icon: '/app-schedule.png' },
  { id: 'earnings' as const, label: 'Earnings', icon: '/app-earnings.png' },
  { id: 'notifications' as const, label: 'Alerts', icon: '/app-alerts.png' },
  { id: 'account' as const, label: 'Account', icon: '/app-account.png' },
];

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onTabChange,
  notificationCount = 0
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('orange.600', 'orange.400');
  const inactiveColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <>
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        zIndex={50}
        boxShadow="lg"
        h="calc(5rem + env(safe-area-inset-bottom, 0px))"
        pb="env(safe-area-inset-bottom, 0px)"
      >
        <Flex h={20}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const hasNotification = tab.id === 'notifications' && notificationCount > 0;
            
            return (
              <Box
                key={tab.id}
                as="button"
                flex={1}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                py={2}
                px={1}
                h="100%"
                transition="all 0.2s"
                position="relative"
                color={isActive ? activeColor : inactiveColor}
                _hover={{ color: isActive ? activeColor : 'gray.700' }}
                onClick={() => onTabChange(tab.id)}
              >
                <Box position="relative">
                  <Image
                    src={tab.icon}
                    alt={tab.label}
                    h={6}
                    w={6}
                    mb={1.5}
                    opacity={isActive ? 1 : 0.6}
                    transition="all 0.2s"
                  />
                  {hasNotification && (
                    <Badge
                      position="absolute"
                      top={-1}
                      right={-1}
                      w={5}
                      h={5}
                      bg="red.500"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="white"
                      fontSize="xs"
                      fontWeight="bold"
                    >
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Badge>
                  )}
                </Box>
                <Text
                  fontSize="xs"
                  fontWeight={isActive ? 'semibold' : 'medium'}
                  lineHeight="tight"
                  color={isActive ? activeColor : inactiveColor}
                >
                  {tab.label}
                </Text>
              </Box>
            );
          })}
        </Flex>
      </Box>

      <Box h="calc(5rem + env(safe-area-inset-bottom, 0px))" />
    </>
  );
};
