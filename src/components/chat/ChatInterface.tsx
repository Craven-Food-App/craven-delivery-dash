import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Headphones } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  content: string;
  sender_type: 'customer' | 'driver' | 'admin' | 'ai';
  created_at: string;
  sender_id?: string;
}

interface Conversation {
  id: string;
  type: 'customer_driver' | 'customer_support' | 'driver_support';
  status: 'active' | 'closed' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject?: string;
}

interface ChatInterfaceProps {
  conversationId?: string;
  conversationType: 'customer_driver' | 'customer_support' | 'driver_support';
  currentUserType: 'customer' | 'driver' | 'admin';
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  conversationType,
  currentUserType,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
      subscribeToMessages();
    } else if (conversationType.includes('support')) {
      createSupportConversation();
    }
  }, [conversationId, conversationType]);

  const loadConversation = async () => {
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error) {
      console.error('Error loading conversation:', error);
      return;
    }

        setConversation(data as Conversation);
  };

  const createSupportConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const conversationData = {
      type: conversationType,
      status: 'active' as const,
      priority: 'normal' as const,
      subject: conversationType === 'customer_support' ? 'Customer Support Request' : 'Driver Support Request',
      ...(currentUserType === 'customer' && { customer_id: user.id }),
      ...(currentUserType === 'driver' && { driver_id: user.id }),
    };

    const { data, error } = await supabase
      .from('chat_conversations')
      .insert(conversationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
      return;
    }

    setConversation(data as Conversation);
    window.history.replaceState(null, '', `?chat=${data.id}`);
  };

  const loadMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data as Message[]);
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat_messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create the message
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: user.id,
          sender_type: currentUserType,
          content: messageContent,
          message_type: 'text'
        });

      if (error) throw error;

      // Check if user is asking for representative and escalate
      const needsRepresentative = messageContent.toLowerCase().includes('representative') || 
                                 messageContent.toLowerCase().includes('human') ||
                                 messageContent.toLowerCase().includes('agent') ||
                                 messageContent.toLowerCase().includes('speak to someone') ||
                                 messageContent.toLowerCase().includes('talk to someone');

      if (needsRepresentative && conversationType === 'customer_support') {
        await supabase
          .from('chat_conversations')
          .update({ 
            priority: 'high',
            status: 'active',
            subject: 'Customer requesting representative - URGENT'
          })
          .eq('id', conversation.id);

        // Add escalation message
        await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversation.id,
            sender_type: 'ai',
            content: 'Your request has been escalated to our support team. A representative will assist you shortly.',
            message_type: 'text'
          });

        toast({
          title: "Escalated to representative",
          description: "Your request has been escalated to a human representative. They will respond shortly.",
        });
      }

      // Trigger AI response for support conversations (unless escalated)
      if (conversationType === 'customer_support' && currentUserType === 'customer' && !needsRepresentative) {
        try {
          await supabase.functions.invoke('ai-chat-support', {
            body: {
              message: messageContent,
              conversationId: conversation.id,
              userId: user.id
            }
          });
        } catch (aiError) {
          console.error('AI response error:', aiError);
          // Show fallback message if AI fails
          setTimeout(async () => {
            await supabase
              .from('chat_messages')
              .insert({
                conversation_id: conversation.id,
                sender_id: null,
                sender_type: 'ai',
                content: "I'm having trouble processing your request right now. Please try again or ask to speak to a representative for immediate assistance.",
                message_type: 'text'
              });
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return <Bot className="h-4 w-4" />;
      case 'admin':
        return <Headphones className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'ai':
        return 'Crave\'n Assistant';
      case 'admin':
        return 'Support Agent';
      case 'customer':
        return 'Customer';
      case 'driver':
        return 'Driver';
      default:
        return 'User';
    }
  };

  if (!conversation) {
    return (
      <Card className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Starting conversation...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-96">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{conversation.subject || 'Chat'}</h3>
          <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
            {conversation.status}
          </Badge>
          {conversation.priority !== 'normal' && (
            <Badge variant={conversation.priority === 'high' || conversation.priority === 'urgent' ? 'destructive' : 'default'}>
              {conversation.priority}
            </Badge>
          )}
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.sender_type === currentUserType ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10">
                  {getSenderIcon(message.sender_type)}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.sender_type === currentUserType
                    ? 'bg-primary text-primary-foreground'
                    : message.sender_type === 'ai'
                    ? 'bg-muted border border-border'
                    : 'bg-secondary'
                }`}
              >
                <div className="text-xs opacity-70 mb-1">
                  {getSenderName(message.sender_type)} • {new Date(message.created_at).toLocaleTimeString()}
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={loading || conversation.status !== 'active'}
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || loading || conversation.status !== 'active'}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatInterface;