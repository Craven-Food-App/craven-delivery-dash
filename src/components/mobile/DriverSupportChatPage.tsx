import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Paperclip,
  Mic
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender_type: 'driver' | 'agent' | 'system';
  message_text: string;
  created_at: string;
  metadata?: any;
}

export function DriverSupportChatPage() {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [quickResponses, setQuickResponses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    initializeChat();
    fetchQuickResponses();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find or create active chat
      let { data: chat } = await supabase
        .from('driver_support_chats')
        .select('*')
        .eq('driver_id', user.id)
        .eq('status', 'open')
        .single();

      if (!chat) {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from('driver_support_chats')
          .insert({
            driver_id: user.id,
            category: 'general',
            subject: 'Driver Support Request',
          })
          .select()
          .single();

        if (error) throw error;
        chat = newChat;
      }

      setCurrentChat(chat);

      // Fetch messages
      const { data: msgs } = await supabase
        .from('driver_support_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      setInitError(error.message || 'Failed to initialize chat');
      toast.error('Chat system not ready. Please run database migrations.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickResponses = async () => {
    try {
      const { data } = await supabase
        .from('chat_quick_responses')
        .select('*')
        .eq('is_active', true)
        .order('priority');

      setQuickResponses(data || []);
    } catch (error) {
      console.error('Error fetching quick responses:', error);
    }
  };

  const handleQuickAction = async (response: any) => {
    setSelectedCategory(response.category);
    await sendMessage(response.auto_message, 'quick_action');
    setShowQuickActions(false);
  };

  const sendMessage = async (text: string, type: string = 'text') => {
    if (!currentChat || (!text.trim() && type === 'text')) return;

    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('driver_support_messages')
        .insert({
          chat_id: currentChat.id,
          sender_id: user.id,
          sender_type: 'driver',
          message_text: text,
          message_type: type,
        });

      if (error) throw error;

      setMessageText('');
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, {
        id: `temp-${Date.now()}`,
        sender_type: 'driver',
        message_text: text,
        created_at: new Date().toISOString(),
      }]);

      // Refresh messages after short delay
      setTimeout(() => {
        initializeChat();
      }, 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="animate-pulse text-4xl">💬</div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-6xl">⚠️</div>
            <h3 className="text-lg font-bold text-gray-900">Database Setup Required</h3>
            <p className="text-sm text-gray-600">
              The support chat system needs to be set up in your Supabase database.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg text-left text-xs">
              <p className="font-semibold mb-2">📋 To fix this:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Go to your Supabase Dashboard</li>
                <li>Open SQL Editor</li>
                <li>Run the file: <code className="bg-white px-1">APPLY_ALL_NEW_FEATURES.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
            <Button onClick={() => navigate('/mobile')} variant="outline">
              ← Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-orange-50">
      {/* Header - Glassmorphism */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/mobile')}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">💬 Support Chat</h1>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-gray-600">Agent Available • Avg 2 min</span>
              </div>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
            <MoreVertical className="h-5 w-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Quick Help Actions */}
      {showQuickActions && messages.length === 0 && (
        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Quick Help:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickResponses.map((response) => (
              <button
                key={response.id}
                onClick={() => handleQuickAction(response)}
                className="p-4 rounded-2xl bg-white border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all duration-200 group"
                style={{
                  boxShadow: '0 2px 8px rgba(240, 90, 40, 0.1)',
                }}
              >
                <div className="text-2xl mb-1">{response.button_icon}</div>
                <div className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">
                  {response.button_text}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !showQuickActions && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How can we help?</h3>
            <p className="text-sm text-gray-600">
              Our support team is here 24/7 to assist you
            </p>
          </div>
        )}

        {messages.map((message, index) => {
          const isDriver = message.sender_type === 'driver';
          const isSystem = message.sender_type === 'system';
          const showTime = index === 0 || 
            new Date(messages[index - 1].created_at).getMinutes() !== new Date(message.created_at).getMinutes();

          return (
            <div key={message.id}>
              {showTime && (
                <div className="text-center text-xs text-gray-500 mb-2">
                  {formatTime(message.created_at)}
                </div>
              )}
              
              <div className={`flex ${isDriver ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isDriver
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg'
                      : isSystem
                      ? 'bg-gray-100 text-gray-700 text-sm italic'
                      : 'bg-white text-gray-900 border border-gray-200 shadow-md'
                  }`}
                  style={isDriver ? {
                    borderRadius: '20px 20px 4px 20px',
                    boxShadow: '0 4px 12px rgba(240, 90, 40, 0.25)',
                  } : !isSystem ? {
                    borderRadius: '20px 20px 20px 4px',
                  } : {}}
                >
                  <p className="text-[15px] leading-relaxed">{message.message_text}</p>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Glassmorphism */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg border-t border-gray-200/50 p-4">
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
            <Paperclip className="h-5 w-5 text-gray-600" />
          </button>
          
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(messageText);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 rounded-full border-gray-300 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
          />

          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
            <Mic className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={() => sendMessage(messageText)}
            disabled={!messageText.trim() || sending}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
            style={{
              boxShadow: '0 4px 12px rgba(240, 90, 40, 0.3)',
            }}
          >
            <Send className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

