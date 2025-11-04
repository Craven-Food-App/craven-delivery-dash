// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, Download, FileText, User, Users, ChevronLeft, Search, MoreVertical, Share2, Copy, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isCLevelPosition, getExecRoleFromPosition } from '@/utils/roleUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

type AttachmentType = 'image' | 'file';

interface FileAttachment {
  type: AttachmentType;
  name: string;
  url: string;
  size: string;
}

interface Message {
  id: number;
  sender: 'self' | 'other';
  content: string;
  timestamp: string;
  attachment?: FileAttachment;
  senderName: string;
  messageId?: string; // Database message ID
  conversationId?: string; // Conversation ID
  senderRole?: string; // Sender's role (ceo, cfo, etc.) for color coding
  senderEmail?: string; // Sender's email to detect CEO
  createdAt?: string; // Full timestamp for chronological ordering
}

interface ExecutiveInboxIMessageProps {
  role?: 'ceo' | 'cfo' | 'coo' | 'cto' | 'board';
  deviceId?: string; // Optional device/component ID for isolation
}

interface Contact {
  id: string;
  exec_id: string;
  user_id: string | null;
  name: string;
  role: string;
  email?: string;
  position?: string;
  department?: string;
  hasExecUser: boolean;
  isActive?: boolean;
  lastLogin?: Date | null;
}

const AttachmentRenderer: React.FC<{ attachment: FileAttachment }> = ({ attachment }) => {
  if (attachment.type === 'image') {
    return (
      <div className="flex flex-col items-start space-y-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-full h-auto max-w-xs md:max-w-md rounded-lg shadow-md object-cover cursor-pointer transition duration-300 hover:opacity-90"
        />
        <span className="text-xs text-gray-600 dark:text-gray-400 truncate w-full">{attachment.name} ({attachment.size})</span>
      </div>
    );
  }

  if (attachment.type === 'file') {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center p-3 rounded-xl bg-white shadow-md transition-all duration-200 hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
      >
        <FileText className="w-6 h-6 text-indigo-500 mr-3 flex-shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate text-gray-800 dark:text-white">{attachment.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{attachment.size} • Click to Download</span>
        </div>
        <Download className="w-4 h-4 ml-4 text-gray-400 flex-shrink-0" />
      </a>
    );
  }

  return null;
};

const MessageBubble: React.FC<{ 
  message: Message; 
  onShare?: (message: Message) => void;
  onCopy?: (message: Message) => void;
  onSave?: (message: Message) => void;
}> = ({ message, onShare, onCopy, onSave }) => {
  const isSelf = message.sender === 'self';
  const { toast } = useToast();

  // Check if sender is CEO (Torrance Stroman)
  const isCEO = message.senderRole === 'ceo' || 
                message.senderEmail === 'craven@usa.com' ||
                message.senderName.toLowerCase().includes('torrance') ||
                message.senderName.toLowerCase().includes('stroman');

  // Color scheme: 
  // - Self (sending): Orange
  // - Other (receiving): Grey
  // - CEO (receiving): Burnt orange/reddish
  let bubbleColorClass = '';
  let textColorClass = '';
  
  if (isSelf) {
    // Sending: Orange
    bubbleColorClass = 'bg-orange-500';
    textColorClass = 'text-white';
  } else if (isCEO) {
    // CEO receiving: Burnt orange/reddish
    bubbleColorClass = 'bg-amber-700';
    textColorClass = 'text-white';
  } else {
    // Other receiving: Grey
    bubbleColorClass = 'bg-gray-300 dark:bg-gray-600';
    textColorClass = 'text-gray-900 dark:text-gray-100';
  }

  const bubbleClasses = `
    max-w-[75%] md:max-w-[60%] lg:max-w-[45%] p-3 rounded-xl shadow-md transition-all duration-300
    ${bubbleColorClass} ${textColorClass}
    ${isSelf ? 'rounded-br-sm self-end ml-auto' : 'rounded-tl-sm self-start mr-auto'}
  `;

  const contentClasses = `
    ${message.attachment ? 'text-sm mb-2' : 'text-base'}
  `;

  const handleShare = () => {
    if (onShare) {
      onShare(message);
    } else {
      if (navigator.share) {
        navigator.share({
          title: `Message from ${message.senderName}`,
          text: message.content,
          url: window.location.href,
        }).catch(() => {
          // Fallback to copy if share fails
          handleCopy();
        });
      } else {
        handleCopy();
        toast({
          title: "Copied to clipboard",
          description: "Message copied. Share it manually.",
        });
      }
    }
  };

  const handleCopy = () => {
    const textToCopy = message.content + (message.attachment ? `\nAttachment: ${message.attachment.name}` : '');
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      });
    });
    if (onCopy) onCopy(message);
  };

  const handleSave = async () => {
    if (onSave) {
      onSave(message);
    } else {
      // Create a downloadable text file
      const content = `Message from ${message.senderName}\nDate: ${message.timestamp}\n\n${message.content}${message.attachment ? `\n\nAttachment: ${message.attachment.name}\nURL: ${message.attachment.url}` : ''}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `message-${message.id}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Saved",
        description: "Message saved to local files",
      });
    }
  };


  return (
    <div className={`flex flex-col w-full ${isSelf ? 'items-end' : 'items-start'} mb-3 group relative`}>
      {!isSelf && (
        <span className="text-xs font-medium text-gray-600 mb-1 pl-2">
          {message.senderName}
        </span>
      )}

      <div className={`${bubbleClasses} relative`}>
        {message.attachment && (
          <div className="mb-2">
            <AttachmentRenderer attachment={message.attachment} />
          </div>
        )}
        {message.content && (
          <p className={contentClasses}>{message.content}</p>
        )}
        <div className={`flex items-center justify-between mt-1 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`text-[10px] opacity-70 ${isSelf ? 'text-right' : 'text-left'}`}>
            {message.timestamp}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 ${isSelf ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isSelf ? 'end' : 'start'} className="w-48">
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Save to local files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export const ExecutiveInboxIMessage: React.FC<ExecutiveInboxIMessageProps> = ({ role = 'ceo', deviceId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSendingAttachment, setIsSendingAttachment] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    fetchContacts();
    
    // Set up real-time subscription for exec_users updates
    const channel = supabase
      .channel('executive-contacts-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exec_users',
        },
        () => {
          fetchContacts(); // Refresh when exec_users change
        }
      )
      .subscribe();
    
    // Refresh contacts every 30 seconds to update active status
    const intervalId = setInterval(() => {
      fetchContacts();
    }, 30000); // 30 seconds
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [role, currentUserId]);

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for messages in current conversation
    let msgChannel: any = null;
    
    const setupMessageSubscription = async () => {
      if (!selectedContact?.exec_id || !currentUserId) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: currentExec } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!currentExec) return;

      const portalContext = role || 'ceo';
      const { data: conversationId } = await supabase.rpc(
        'get_or_create_conversation',
        {
          p_participant1_exec_id: currentExec.id,
          p_participant2_exec_id: selectedContact.exec_id,
          p_portal_context: portalContext,
          p_device_id: deviceId || null
        }
      );

      if (conversationId) {
        msgChannel = supabase
          .channel(`exec-conversation-${conversationId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'exec_conversation_messages',
              filter: `conversation_id=eq.${conversationId}`,
            },
            () => {
              fetchMessages(); // Refresh messages when new message is added
            }
          )
          .subscribe();
      }
    };

    setupMessageSubscription();
    
    return () => {
      if (msgChannel) {
        supabase.removeChannel(msgChannel);
      }
    };
  }, [selectedContact, currentUserId, role, deviceId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Note: Messages are never deleted - they remain in the conversation thread permanently
  // This ensures full conversation history is always retained

  // Helper function to format last seen time
  const formatLastSeen = (lastLogin: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastLogin.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return lastLogin.toLocaleDateString();
  };

  const fetchContacts = async () => {
    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      // Fetch ALL exec_users directly (these are the contacts)
      const { data: execUsersData, error: execError } = await supabase
        .from('exec_users')
        .select('id, user_id, role, title, department, last_login')
        .order('role');

      if (execError) {
        console.error('Error fetching exec_users:', execError);
        throw execError;
      }

      if (!execUsersData || execUsersData.length === 0) {
        console.warn('No exec_users found');
        setContacts([]);
        return;
      }

      // Fetch user_profiles for all exec_users
      const userIds = execUsersData.map((eu: any) => eu.user_id).filter(Boolean);
      let userProfilesMap: Record<string, any> = {};
      
      if (userIds.length > 0) {
        const { data: userProfiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (!profilesError && userProfiles) {
          userProfiles.forEach((profile: any) => {
            userProfilesMap[profile.id] = profile;
          });
        }
      }

      // Fetch employees for all exec_users  
      let employeesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('user_id, first_name, last_name, email, position')
          .in('user_id', userIds);
        
        if (!empError && employees) {
          employees.forEach((emp: any) => {
            employeesMap[emp.user_id] = emp;
          });
        }
      }

      // Map to contact format
      const formattedContacts = execUsersData
        .filter((execUser: any) => execUser.user_id !== user.id) // Filter out current user
        .map((execUser: any) => {
          const userProfile = execUser.user_id ? userProfilesMap[execUser.user_id] : null;
          const employee = execUser.user_id ? employeesMap[execUser.user_id] : null;

          const fullName = userProfile?.full_name || 
                          (employee ? `${employee.first_name || ''} ${employee.last_name || ''}`.trim() : '') ||
                          execUser.title ||
                          'Unknown Executive';

          // Check if user is active (logged in within last 5 minutes)
          const lastLogin = execUser.last_login ? new Date(execUser.last_login) : null;
          const isActive = lastLogin && (Date.now() - lastLogin.getTime()) < 5 * 60 * 1000; // 5 minutes
          
          return {
            id: execUser.id, // exec_users.id
            exec_id: execUser.id, // Keep for reference
            user_id: execUser.user_id,
            name: fullName,
            role: (execUser.role || 'EXECUTIVE').toUpperCase(),
            email: userProfile?.email || employee?.email,
            position: execUser.title || employee?.position,
            department: execUser.department,
            hasExecUser: true, // All exec_users have messaging capability
            isActive, // Track if user is currently active
            lastLogin, // Store last login timestamp
          };
        });

      console.log('Fetched contacts:', formattedContacts);
      setContacts(formattedContacts);
      if (formattedContacts.length > 0 && !selectedContact) {
        setSelectedContact(formattedContacts[0]);
      }
    } catch (error) {
      console.error('Error fetching executive contacts:', error);
      setContacts([]);
    }
  };

  const fetchMessages = async () => {
    if (!selectedContact) {
      setMessages([]);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get exec_users.id for current user
      const { data: currentExec } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!currentExec || !selectedContact.exec_id) {
        setMessages([]);
        return;
      }

      // Get or create conversation for this portal context
      const portalContext = role || 'ceo';
      const { data: conversationId, error: convError } = await supabase.rpc(
        'get_or_create_conversation',
        {
          p_participant1_exec_id: currentExec.id,
          p_participant2_exec_id: selectedContact.exec_id,
          p_portal_context: portalContext,
          p_device_id: deviceId || null
        }
      );

      if (convError || !conversationId) {
        console.error('Error getting conversation:', convError);
        setMessages([]);
        return;
      }

      // Fetch messages from this conversation (always fetch all, never delete)
      const { data: messageData, error: msgError } = await supabase
        .from('exec_conversation_messages')
        .select(`
          *,
          from_exec:exec_users!exec_conversation_messages_from_exec_id_fkey(
            id,
            user_id,
            role,
            user_profiles(full_name, email),
            employees:user_id(first_name, last_name, email)
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        setMessages([]);
        return;
      }

      if (messageData && messageData.length > 0) {
        const formattedMessages: Message[] = messageData
          .map((msg: any) => {
            const isSelf = msg.from_exec_id === currentExec.id;
            const senderName = isSelf 
              ? 'You'
              : (msg.from_exec?.user_profiles?.full_name || 
                 `${msg.from_exec?.employees?.first_name || ''} ${msg.from_exec?.employees?.last_name || ''}`.trim() ||
                 selectedContact.name);

            // Get sender role and email for CEO detection and color coding
            const senderRole = msg.from_exec?.role || '';
            const senderEmail = msg.from_exec?.user_profiles?.email || msg.from_exec?.employees?.email || '';

            return {
              id: parseInt(msg.id.slice(0, 8), 16) || Date.now(),
              sender: isSelf ? 'self' : 'other',
              senderName,
              content: msg.message_text || '',
              timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              attachment: msg.attachment_url ? {
                type: msg.attachment_type || 'file',
                name: msg.attachment_name || 'Attachment',
                url: msg.attachment_url,
                size: msg.attachment_size || '0 KB'
              } : undefined,
              messageId: msg.id, // Store database message ID
              conversationId: conversationId as string, // Store conversation ID
              senderRole, // Store sender role for color coding
              senderEmail, // Store sender email for CEO detection
              createdAt: msg.created_at, // Full timestamp for chronological ordering
            };
          })
          .sort((a, b) => {
            // Sort by createdAt to ensure chronological order
            if (a.createdAt && b.createdAt) {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            return 0;
          });
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleSend = async (attachment?: FileAttachment) => {
    if (!inputContent.trim() && !attachment) return;
    if (!selectedContact) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get exec_user id for current user
      const { data: currentExec } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!currentExec || !selectedContact.exec_id) {
        console.error('Missing exec_user records');
        return;
      }

      // Get or create conversation for this portal context
      const portalContext = role || 'ceo';
      const { data: conversationId, error: convError } = await supabase.rpc(
        'get_or_create_conversation',
        {
          p_participant1_exec_id: currentExec.id,
          p_participant2_exec_id: selectedContact.exec_id,
          p_portal_context: portalContext,
          p_device_id: deviceId || null
        }
      );

      if (convError || !conversationId) {
        console.error('Error getting conversation:', convError);
        return;
      }

      // Insert message into conversation
      const { data: newMessage, error: msgError } = await supabase
        .from('exec_conversation_messages')
        .insert({
          conversation_id: conversationId,
          from_exec_id: currentExec.id,
          message_text: inputContent.trim(),
          attachment_type: attachment?.type || null,
          attachment_url: attachment?.url || null,
          attachment_name: attachment?.name || null,
          attachment_size: attachment?.size || null,
        })
        .select()
        .single();

      if (msgError) {
        console.error('Error saving message:', msgError);
        return;
      }

      // Add message to local state (maintain chronological order)
      const newMsg: Message = {
        id: parseInt(newMessage.id.slice(0, 8), 16) || Date.now(),
        sender: 'self',
        senderName: 'You',
        content: inputContent.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        attachment: attachment,
        messageId: newMessage.id, // Store database message ID
        conversationId: conversationId as string, // Store conversation ID
        senderRole: 'self', // Current user's role
        createdAt: newMessage.created_at || new Date().toISOString(), // Full timestamp
      };

      // Insert in chronological order
      const sortedMessages = [...messages, newMsg].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return 0;
      });
      setMessages(sortedMessages);
      setInputContent('');
      setIsSendingAttachment(false);

      // Update conversation last_message_at
      await supabase
        .from('exec_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const AttachmentSelector = () => (
    <div className="absolute bottom-16 left-0 w-64 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-10">
      <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Select Attachment Type</h3>
      <div className="flex flex-col space-y-2">
        <button
          onClick={() => handleSend({ type: 'image', name: 'New_Screenshot.jpg', url: 'https://placehold.co/400x250/3b82f6/ffffff?text=Sent+Image', size: '300 KB' })}
          className="flex items-center p-2 rounded-lg text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <Image className="w-5 h-5 text-red-500 mr-3" /> Send Image
        </button>
        <button
          onClick={() => handleSend({ type: 'file', name: 'Annual_Report_v3.pdf', url: '#', size: '2.1 MB' })}
          className="flex items-center p-2 rounded-lg text-left text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <FileText className="w-5 h-5 text-indigo-500 mr-3" /> Send Document
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full" style={{ height: '600px', minHeight: '600px' }}>
      <div className="flex w-full h-full bg-white shadow-xl rounded-2xl overflow-hidden dark:bg-gray-800 border border-gray-100 dark:border-gray-700">

        {/* Sidebar */}
        <div className="hidden md:flex flex-col w-1/4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Executive Chat</h1>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search executives..."
                className="w-full p-2 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-grow">
            {contacts.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No C-level executives found
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  className={`p-4 flex items-center border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors ${
                    selectedContact?.id === contact.id ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${!contact.hasExecUser ? 'opacity-75' : ''}`}
                >
                  <User className={`w-5 h-5 mr-3 ${selectedContact?.id === contact.id ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="flex flex-col flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold truncate ${selectedContact?.id === contact.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {contact.name}
                      </span>
                      {!contact.hasExecUser && (
                        <span className="text-xs text-orange-500 ml-2 flex-shrink-0" title="Messaging will be available after setup">
                          ⚠
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.role}</span>
                    {!contact.hasExecUser && (
                      <span className="text-xs text-orange-500">Setup required</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex flex-col flex-grow bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 shadow-sm bg-white z-10">
            <div className="flex items-center">
              <ChevronLeft className="w-5 h-5 mr-3 md:hidden text-gray-600 dark:text-gray-300 cursor-pointer" />
              {selectedContact ? (
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedContact.name}</h2>
                  {selectedContact.isActive ? (
                    <p className="text-xs text-green-500">Active now</p>
                  ) : selectedContact.lastLogin ? (
                    <p className="text-xs text-gray-500">
                      Last seen {formatLastSeen(selectedContact.lastLogin)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">Offline</p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Select a contact</h2>
                </div>
              )}
            </div>
            <button className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400">
              <Users className="w-5 h-5" />
            </button>
          </div>

          {/* Message List Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-white">
            {selectedContact ? (
              <>
                {messages.map((msg) => (
                  <MessageBubble 
                    key={msg.messageId || msg.id} 
                    message={msg}
                  />
                ))}
                <div ref={chatEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a contact to start messaging
              </div>
            )}
          </div>

          {/* Input Area */}
          {selectedContact && (
            <div className="relative p-4 border-t border-gray-200 bg-white">
              {!selectedContact.hasExecUser && (
                <div className="mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Messaging unavailable for this contact. Exec user record setup required.
                  </p>
                </div>
              )}
              {isSendingAttachment && <AttachmentSelector />}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsSendingAttachment(!isSendingAttachment)}
                  disabled={!selectedContact.hasExecUser}
                  className="p-3 text-gray-500 hover:text-blue-600 transition duration-150 rounded-full hover:bg-blue-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Attach File"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedContact.hasExecUser ? "iMessage Style: Send a message..." : "Messaging unavailable - setup required"}
                  rows={1}
                  disabled={!selectedContact.hasExecUser}
                  className="flex-grow resize-none p-3 text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ maxHeight: '150px' }}
                />

                <button
                  onClick={() => handleSend()}
                  disabled={(!inputContent.trim() && !isSendingAttachment) || !selectedContact.hasExecUser}
                  className={`p-3 rounded-full transition-all duration-300 ease-in-out ${
                    inputContent.trim() && selectedContact.hasExecUser
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                  }`}
                  title={selectedContact.hasExecUser ? "Send" : "Messaging unavailable"}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

