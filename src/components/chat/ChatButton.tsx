import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ChatInterface from './ChatInterface';

interface ChatButtonProps {
  type: 'customer_support' | 'driver_support' | 'customer_driver';
  userType: 'customer' | 'driver' | 'admin';
  conversationId?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const ChatButton: React.FC<ChatButtonProps> = ({
  type,
  userType,
  conversationId,
  variant = 'default',
  size = 'default',
  className,
  children
}) => {
  const [open, setOpen] = useState(false);

  const getButtonText = () => {
    if (children) return children;
    
    switch (type) {
      case 'customer_support':
        return 'Contact Support';
      case 'driver_support':
        return 'Driver Support';
      case 'customer_driver':
        return 'Chat';
      default:
        return 'Chat';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageCircle className="h-4 w-4 mr-2" />
          {getButtonText()}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <ChatInterface
          conversationId={conversationId}
          conversationType={type}
          currentUserType={userType}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ChatButton;