import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import ChatInterface from '../chat/ChatInterface';
import { MessageCircle, Search, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Conversation {
  id: string;
  type: 'customer_driver' | 'customer_support' | 'driver_support';
  status: 'active' | 'closed' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subject?: string;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  driver_id?: string;
  admin_id?: string;
}

const ChatPortal: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
    subscribeToConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } else {
      setConversations((data || []) as Conversation[]);
    }
    setLoading(false);
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel('admin_chat_conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const assignToSelf = async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('chat_conversations')
      .update({ 
        admin_id: user.id,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error assigning conversation:', error);
      toast({
        title: "Error",
        description: "Failed to assign conversation",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Conversation assigned to you",
      });
      loadConversations();
    }
  };

  const updateConversationStatus = async (conversationId: string, status: 'active' | 'closed' | 'archived') => {
    const { error } = await supabase
      .from('chat_conversations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation status:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Conversation marked as ${status}`,
      });
      loadConversations();
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesFilter = filter === 'all' || conv.status === filter || conv.type === filter;
    const matchesSearch = search === '' || 
      (conv.subject?.toLowerCase().includes(search.toLowerCase())) ||
      conv.id.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer_support':
        return 'bg-blue-100 text-blue-800';
      case 'driver_support':
        return 'bg-green-100 text-green-800';
      case 'customer_driver':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (selectedConversation) {
    return (
      <div className="h-full">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedConversation(null)}
          >
            ← Back to Chat Portal
          </Button>
        </div>
        <ChatInterface
          conversationId={selectedConversation}
          conversationType="customer_support"
          currentUserType="admin"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conversations</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="customer_support">Customer Support</SelectItem>
            <SelectItem value="driver_support">Driver Support</SelectItem>
            <SelectItem value="customer_driver">Customer-Driver</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredConversations.map((conversation) => (
              <Card key={conversation.id} className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {conversation.subject || `Conversation ${conversation.id.slice(0, 8)}`}
                      </CardTitle>
                      <Badge className={getTypeColor(conversation.type)}>
                        {conversation.type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityColor(conversation.priority)}>
                        {conversation.priority}
                      </Badge>
                      <Badge variant={conversation.status === 'active' ? 'default' : 'secondary'}>
                        {conversation.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConversation(conversation.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Chat
                    </Button>
                    {!conversation.admin_id && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => assignToSelf(conversation.id)}
                      >
                        Assign to Me
                      </Button>
                    )}
                    {conversation.status === 'active' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => updateConversationStatus(conversation.id, 'closed')}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPortal;