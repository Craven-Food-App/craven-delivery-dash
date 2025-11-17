import React, { useState } from 'react';
import { Card, ThemeIcon, Badge, Button, Group, Stack, Text, Box, Transition } from '@mantine/core';
import { Lock, Unlock, Sparkles } from 'lucide-react';
import { ExclusiveOrder } from '@/types/diamond-orders';

interface VaultOrderCardProps {
  order: ExclusiveOrder;
  onClaim: (orderId: string) => void;
  isDiamond: boolean;
}

export const VaultOrderCard: React.FC<VaultOrderCardProps> = ({ order, onClaim, isDiamond }) => {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(isDiamond);

  const handleUnlock = () => {
    if (!isDiamond) return;
    setIsUnlocking(true);
    setTimeout(() => {
      setIsUnlocking(false);
      setIsUnlocked(true);
    }, 800);
  };

  const payout = (order.base_pay || order.delivery_fee_cents || 0) / 100 + ((order.tip || order.tip_cents || 0) / 100);

  return (
    <Card
      p="lg"
      radius="md"
      sx={(theme) => ({
        background: isUnlocked 
          ? theme.other.cravenOrangeGradient
          : 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        border: `2px solid ${isUnlocked ? '#FF6A00' : '#444'}`,
        boxShadow: isUnlocked ? theme.shadows.glow : 'none',
        position: 'relative',
        overflow: 'hidden',
        filter: isUnlocked ? 'none' : 'blur(1px)',
        opacity: isUnlocked ? 1 : 0.7,
      })}
    >
      <Stack gap="md">
        <Group position="apart">
          <Group gap="xs">
            <ThemeIcon
              size={40}
              radius="xl"
              variant="gradient"
              gradient={isUnlocked 
                ? { from: '#FF6A00', to: '#D45400', deg: 135 }
                : { from: '#444', to: '#666', deg: 135 }
              }
              sx={{
                animation: isUnlocking ? 'burst 0.8s ease-out' : 'none',
                '@keyframes burst': {
                  '0%': { transform: 'scale(1) rotate(0deg)', opacity: 1 },
                  '25%': { transform: 'scale(1.3) rotate(90deg)', opacity: 0.9 },
                  '50%': { transform: 'scale(1.6) rotate(180deg)', opacity: 0.7 },
                  '75%': { transform: 'scale(1.3) rotate(270deg)', opacity: 0.5 },
                  '100%': { transform: 'scale(1) rotate(360deg)', opacity: 0 },
                },
              }}
            >
              {isUnlocked ? <Unlock size={24} /> : <Lock size={24} />}
            </ThemeIcon>
            <Text fw={700} size="lg" c={isUnlocked ? 'white' : 'dimmed'}>
              VAULT ORDER
            </Text>
          </Group>
          
          {isUnlocked && (
            <Badge color="orange" variant="filled" size="sm">
              <Sparkles size={12} style={{ marginRight: 4 }} />
              Unlocked
            </Badge>
          )}
        </Group>

        <Box>
          <Text size="sm" c={isUnlocked ? 'white' : 'dimmed'} mb="xs">
            {order.restaurant?.name || 'Restaurant'}
          </Text>
          <Text fw={700} size="xl" c={isUnlocked ? 'white' : 'dimmed'}>
            ${payout.toFixed(2)}
          </Text>
        </Box>

        {!isUnlocked && (
          <Button
            fullWidth
            size="lg"
            color="gray"
            variant="outline"
            disabled={!isDiamond}
            onClick={handleUnlock}
            leftSection={<Lock size={16} />}
          >
            {isDiamond ? 'Unlock Vault' : '🔒 Diamond Only'}
          </Button>
        )}

        {isUnlocked && (
          <Transition mounted={isUnlocked} transition="fade" duration={400}>
            {(styles) => (
              <Button
                fullWidth
                size="lg"
                style={styles}
                sx={(theme) => ({
                  background: theme.other.cravenOrangeGradient,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #D45400 0%, #FF6A00 100%)',
                    transform: 'scale(1.02)',
                  },
                })}
                onClick={() => onClaim(order.id)}
              >
                Claim Order
              </Button>
            )}
          </Transition>
        )}

        {/* Flames effect when unlocked */}
        {isUnlocked && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '30px',
              background: 'linear-gradient(to top, rgba(255,106,0,0.8), rgba(255,106,0,0.4), transparent)',
              pointerEvents: 'none',
              animation: 'flicker 1.5s infinite',
              '@keyframes flicker': {
                '0%, 100%': { opacity: 0.6, transform: 'scaleY(1)' },
                '25%': { opacity: 0.8, transform: 'scaleY(1.1)' },
                '50%': { opacity: 0.7, transform: 'scaleY(0.95)' },
                '75%': { opacity: 0.9, transform: 'scaleY(1.05)' },
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '20%',
                width: '20px',
                height: '20px',
                background: 'radial-gradient(circle, rgba(255,106,0,0.9) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'flame1 2s infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: 0,
                right: '20%',
                width: '20px',
                height: '20px',
                background: 'radial-gradient(circle, rgba(255,106,0,0.9) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'flame2 2s infinite',
              },
              '@keyframes flame1': {
                '0%, 100%': { transform: 'translateX(0) scale(1)', opacity: 0.8 },
                '50%': { transform: 'translateX(-5px) scale(1.2)', opacity: 1 },
              },
              '@keyframes flame2': {
                '0%, 100%': { transform: 'translateX(0) scale(1)', opacity: 0.8 },
                '50%': { transform: 'translateX(5px) scale(1.2)', opacity: 1 },
              },
            }}
          />
        )}
      </Stack>
    </Card>
  );
};

