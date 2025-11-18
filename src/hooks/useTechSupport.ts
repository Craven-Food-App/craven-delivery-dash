import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ITHelpDeskTicket, ITHelpDeskMessage, CodeChangeRequest, DeveloperPermission, DeveloperOnboarding, KnowledgeBaseArticle } from '@/types/tech-support';

// IT Help Desk Hooks
export const useITHelpDeskTickets = () => {
  const [tickets, setTickets] = useState<ITHelpDeskTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('it_help_desk_tickets')
        .select(`
          *,
          requester:auth.users!requester_id(email),
          assignee:auth.users!assigned_to(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('IT help desk tickets table does not exist. Migration may not have been run.');
          setTickets([]);
          return;
        }
        throw error;
      }
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  return { tickets, loading, refetch: fetchTickets };
};

export const useITHelpDeskMessages = (ticketId: string) => {
  const [messages, setMessages] = useState<ITHelpDeskMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ticketId) {
      fetchMessages();
    }
  }, [ticketId]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('it_help_desk_messages')
        .select(`
          *,
          sender:auth.users!sender_id(email)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, refetch: fetchMessages };
};

// Code Change Requests Hooks
export const useCodeChangeRequests = () => {
  const [requests, setRequests] = useState<CodeChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('code_change_requests')
        .select(`
          *,
          developer:auth.users!developer_id(email),
          reviewer:auth.users!reviewer_id(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Code change requests table does not exist. Migration may not have been run.');
          setRequests([]);
          return;
        }
        throw error;
      }
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching code change requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  return { requests, loading, refetch: fetchRequests };
};

// Developer Permissions Hooks
export const useDeveloperPermissions = () => {
  const [permissions, setPermissions] = useState<DeveloperPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_permissions')
        .select(`
          *,
          developer:auth.users!developer_id(email)
        `)
        .eq('is_active', true)
        .order('granted_at', { ascending: false });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return { permissions, loading, refetch: fetchPermissions };
};

// Developer Onboarding Hooks
export const useDeveloperOnboarding = () => {
  const [onboarding, setOnboarding] = useState<DeveloperOnboarding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const fetchOnboarding = async () => {
    try {
      const { data, error } = await supabase
        .from('developer_onboarding')
        .select(`
          *,
          developer:auth.users!developer_id(email),
          mentor:auth.users!assigned_mentor_id(email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('Developer onboarding table does not exist. Migration may not have been run.');
          setOnboarding([]);
          return;
        }
        throw error;
      }
      setOnboarding(data || []);
    } catch (error) {
      console.error('Error fetching onboarding:', error);
      setOnboarding([]);
    } finally {
      setLoading(false);
    }
  };

  return { onboarding, loading, refetch: fetchOnboarding };
};

// Knowledge Base Hooks
export const useKnowledgeBase = (category?: string) => {
  const [articles, setArticles] = useState<KnowledgeBaseArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [category]);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('tech_knowledge_base')
        .select(`
          *,
          author:auth.users!author_id(email)
       `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching knowledge base:', error);
    } finally {
      setLoading(false);
    }
  };

  return { articles, loading, refetch: fetchArticles };
};

