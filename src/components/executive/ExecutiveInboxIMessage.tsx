// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, Download, FileText, User, Users, ChevronLeft, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { isCLevelPosition, getExecRoleFromPosition } from '@/utils/roleUtils';

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
}

interface ExecutiveInboxIMessageProps {
  role?: 'ceo' | 'cfo' | 'coo' | 'cto' | 'board';
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

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isSelf = message.sender === 'self';

  const bubbleClasses = `
    max-w-[75%] md:max-w-[60%] lg:max-w-[45%] p-3 rounded-xl shadow-md transition-all duration-300
    ${isSelf
      ? 'bg-blue-500 text-white rounded-br-sm self-end ml-auto'
      : 'bg-gray-200 text-gray-800 rounded-tl-sm self-start mr-auto dark:bg-gray-700 dark:text-gray-100'
    }
  `;

  const contentClasses = `
    ${message.attachment ? 'text-sm mb-2' : 'text-base'}
  `;

  return (
    <div className={`flex flex-col w-full ${isSelf ? 'items-end' : 'items-start'} mb-3`}>
      {!isSelf && (
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 pl-2">
          {message.senderName}
        </span>
      )}

      <div className={bubbleClasses}>
        {message.attachment && (
          <div className="mb-2">
            <AttachmentRenderer attachment={message.attachment} />
          </div>
        )}
        {message.content && (
          <p className={contentClasses}>{message.content}</p>
        )}
        <div className={`text-[10px] opacity-70 mt-1 ${isSelf ? 'text-right' : 'text-left'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export const ExecutiveInboxIMessage: React.FC<ExecutiveInboxIMessageProps> = ({ role = 'ceo' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [isSendingAttachment, setIsSendingAttachment] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get current user ID
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    fetchContacts();
    
    // Set up real-time subscription for employee updates
    const channel = supabase
      .channel('executive-contacts-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'employees',
        },
        () => {
          fetchContacts(); // Refresh when employees change
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, currentUserId]);

  useEffect(() => {
    fetchMessages();
  }, [selectedContact, currentUserId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchContacts = async () => {
    try {
      // Fetch employees and filter for C-level executives (CEO, CFO, COO, CTO, CXO, etc.)
      const { data: employeesData, error: empError } = await supabase
        .from('employees')
        .select('id, user_id, position, first_name, last_name, email, department_id, departments(name), user_profiles(full_name, email)')
        .order('position');

      if (empError) throw empError;

      // Filter to only C-level positions (using centralized utility)
      const executives = (employeesData || []).filter((emp: any) => 
        isCLevelPosition(emp.position)
      );

      // Map to contact format and fetch exec_users records
      const formattedContactsPromises = executives.map(async (emp: any) => {
        const position = String(emp.position || '').toLowerCase();
        let role = position;
        
        // Normalize position to role (using centralized utility)
        const execRole = getExecRoleFromPosition(emp.position);
        role = execRole || position;

        const fullName = emp.user_profiles?.full_name || 
                        `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
                        emp.position ||
                        'Unknown';

        // Get exec_users record for this employee, or create it if missing
        let execUserId = null;
        let hasExecUser = false;
        
        if (emp.user_id) {
          // Check if exec_user exists
          const { data: execUser } = await supabase
            .from('exec_users')
            .select('id')
            .eq('user_id', emp.user_id)
            .single();
          
          if (execUser) {
            execUserId = execUser.id;
            hasExecUser = true;
          } else {
            // Auto-create exec_user for C-level employee (using centralized utility)
            try {
              // Determine exec role from position
              const execRole = getExecRoleFromPosition(emp.position) || 'board_member';
              
              const { data: newExecUser, error: createError } = await supabase
                .from('exec_users')
                .insert({
                  user_id: emp.user_id,
                  role: execRole,
                  department: emp.departments?.name || 'Executive',
                  title: emp.position,
                  access_level: 1,
                })
                .select('id')
                .single();
              
              if (!createError && newExecUser) {
                execUserId = newExecUser.id;
                hasExecUser = true;
              }
            } catch (createErr) {
              console.error(`Failed to auto-create exec_user for ${fullName}:`, createErr);
            }
          }
        }

        return {
          id: execUserId || emp.user_id || emp.id, // Use exec_users.id if available, fallback to user_id
          user_id: emp.user_id, // Keep original user_id for reference
          name: fullName,
          role: role.toUpperCase(),
          email: emp.user_profiles?.email || emp.email,
          position: emp.position,
          hasExecUser, // Flag to indicate if messaging is available
        };
      });

      const formattedContacts = await Promise.all(formattedContactsPromises);

      // Filter out current user from contacts
      const filteredContacts = formattedContacts.filter(contact => 
        contact.user_id !== currentUserId
      );

      setContacts(filteredContacts);
      if (filteredContacts.length > 0 && !selectedContact) {
        // Prefer selecting a contact with exec_user if available
        const contactWithExec = filteredContacts.find(c => c.hasExecUser);
        setSelectedContact(contactWithExec || filteredContacts[0]);
      }
    } catch (error) {
      console.error('Error fetching executive contacts:', error);
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

      // Get exec_users.id for current user and selected contact
      const { data: currentExec } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { data: contactExec } = await supabase
        .from('exec_users')
        .select('id')
        .eq('user_id', selectedContact.user_id)
        .single();

      if (!currentExec || !contactExec) {
        // No exec_users records, use mock data
        const mockMessages: Message[] = [
          {
            id: 1,
            sender: 'other',
            senderName: `${selectedContact.name} (${selectedContact.role})`,
            content: 'Hi, the Q4 projections are finalized and need review before the meeting. Are you free to discuss this afternoon?',
            timestamp: '1:01 PM',
          },
          {
            id: 2,
            sender: 'self',
            senderName: 'You',
            content: 'Sounds good. I\'ll clear my calendar.',
            timestamp: '1:03 PM',
          },
        ];
        setMessages(mockMessages);
        return;
      }

      // Try to fetch from exec_messages table using exec_users.id
      const { data: messageData } = await supabase
        .from('exec_messages')
        .select('*, from_user:exec_users!exec_messages_from_user_id_fkey(id, role, user_id, user_profiles(full_name))')
        .or(`from_user_id.eq.${currentExec.id},${contactExec.id}=ANY(to_user_ids)`)
        .order('created_at', { ascending: true });

      if (messageData && messageData.length > 0) {
        // Filter messages to current conversation
        const conversationMessages = messageData.filter((msg: any) => {
          return (
            (msg.from_user_id === currentExec.id && Array.isArray(msg.to_user_ids) && msg.to_user_ids.includes(contactExec.id)) ||
            (msg.from_user_id === contactExec.id && Array.isArray(msg.to_user_ids) && msg.to_user_ids.includes(currentExec.id))
          );
        });

        if (conversationMessages.length > 0) {
          const formattedMessages: Message[] = conversationMessages.map((msg: any) => {
            return {
              id: parseInt(msg.id.slice(0, 8), 16),
              sender: msg.from_user_id === currentExec.id ? 'self' : 'other',
              senderName: msg.from_user_id === currentExec.id 
                ? 'You'
                : `${msg.from_user?.user_profiles?.full_name || selectedContact.name} (${selectedContact.role})`,
              content: msg.message || msg.subject || '',
              timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            };
          });
          setMessages(formattedMessages);
          return;
        }
      }

      // Fallback to mock data if no messages found
      const mockMessages: Message[] = [
        {
          id: 1,
          sender: 'other',
          senderName: `${selectedContact.name} (${selectedContact.role})`,
          content: 'Hi, the Q4 projections are finalized and need review before the meeting. Are you free to discuss this afternoon?',
          timestamp: '1:01 PM',
        },
        {
          id: 2,
          sender: 'self',
          senderName: 'You',
          content: 'Sounds good. I\'ll clear my calendar.',
          timestamp: '1:03 PM',
        },
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Fallback to mock data on error
      const mockMessages: Message[] = [
        {
          id: 1,
          sender: 'other',
          senderName: `${selectedContact?.name || 'CFO'} (${selectedContact?.role || 'CFO'})`,
          content: 'Hi, the Q4 projections are finalized and need review.',
          timestamp: '1:01 PM',
        },
      ];
      setMessages(mockMessages);
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

      // Use selectedContact.id which should be exec_users.id if available
      // Otherwise try to look it up
      let contactExecId = selectedContact.id;
      if (!contactExecId || !selectedContact.user_id) {
        const { data: contactExec } = await supabase
          .from('exec_users')
          .select('id')
          .eq('user_id', selectedContact.user_id)
          .single();
        contactExecId = contactExec?.id;
      }

      // Try to insert into exec_messages table if exec_users exist
      if (currentExec && contactExecId) {
        const { data: newMessage, error } = await supabase
          .from('exec_messages')
          .insert({
            from_user_id: currentExec.id,
            to_user_ids: [contactExecId],
            subject: 'Executive Chat',
            message: inputContent.trim(),
            priority: 'normal',
            is_confidential: true,
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving to database, using local state:', error);
        }
      }

      const newMsg: Message = {
        id: Date.now(),
        sender: 'self',
        senderName: 'You',
        content: inputContent.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        attachment: attachment,
      };

      setMessages([...messages, newMsg]);
      setInputContent('');
      setIsSendingAttachment(false);
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
        <div className="flex flex-col flex-grow">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800 z-10">
            <div className="flex items-center">
              <ChevronLeft className="w-5 h-5 mr-3 md:hidden text-gray-600 dark:text-gray-300 cursor-pointer" />
              {selectedContact ? (
                <div className="flex flex-col">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedContact.name}</h2>
                  <p className="text-xs text-green-500">Active now</p>
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
          <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {selectedContact ? (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
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
            <div className="relative p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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

