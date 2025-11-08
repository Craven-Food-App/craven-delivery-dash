import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from 'react';
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Tag,
  Plus,
  User,
  Mail,
  Search,
  Menu,
  X,
  ChevronLeft,
  Paperclip,
  ChevronRight,
  CornerDownLeft,
  RefreshCw,
} from 'lucide-react';
import { message, Modal, Form, Input, Alert, Typography, Spin, Button } from 'antd';
import { SettingOutlined, SyncOutlined } from '@ant-design/icons';
import { supabase } from '@/integrations/supabase/client';

type FolderId = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive';

interface Folder {
  id: FolderId;
  name: string;
  icon: React.ElementType;
}

interface FolderWithCount extends Folder {
  count: number;
}

interface Email {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  body: string;
  timestamp: string;
  folder: FolderId;
  read: boolean;
  priority?: 'high' | 'low';
  gmail_message_id?: string;
  gmail_thread_id?: string;
}

interface WorkspaceFormValues {
  serviceAccountEmail: string;
  privateKey: string;
  delegatedUser: string;
  defaultFrom: string;
  executiveFrom?: string;
  treasuryFrom?: string;
  scope?: string;
}

const DEFAULT_GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const TextArea = Input.TextArea;

const INITIAL_EMAILS: Email[] = [
  {
    id: '1',
    subject: 'Project Status Update',
    sender: 'Alice Johnson (via Zoho)',
    recipient: 'You',
    body: 'The Q3 report is finalized and ready for your review. Please check the attached document for detailed metrics and next steps.',
    timestamp: '10:30 AM',
    folder: 'inbox',
    read: false,
    priority: 'high',
  },
  {
    id: '2',
    subject: 'Meeting Confirmation',
    sender: 'Calendar Bot',
    recipient: 'You',
    body: 'Your meeting with the marketing team on Nov 10th is confirmed.',
    timestamp: '9:15 AM',
    folder: 'inbox',
    read: true,
  },
  {
    id: '3',
    subject: 'Draft: Quarterly Goals',
    sender: 'You',
    recipient: 'Bob Smith',
    body: 'Just a draft outlining the core Q4 goals for the team...',
    timestamp: 'Yesterday',
    folder: 'drafts',
    read: true,
  },
  {
    id: '4',
    subject: 'Follow-up on Customer CX',
    sender: 'Charlie Doe (via Zoho)',
    recipient: 'You',
    body: 'We received excellent feedback from the latest customer survey! Great work team.',
    timestamp: '3 days ago',
    folder: 'inbox',
    read: false,
  },
  {
    id: '5',
    subject: 'Re: Team Lunch',
    sender: 'You',
    recipient: 'Team',
    body: 'Yes, pizza sounds perfect for Friday!',
    timestamp: '5:00 PM',
    folder: 'sent',
    read: true,
  },
];

const BASE_FOLDERS: Folder[] = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'drafts', name: 'Drafts', icon: FileText },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'trash', name: 'Trash', icon: Trash2 },
  { id: 'archive', name: 'Archive', icon: Tag },
];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`bg-white shadow-lg rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

interface ExecHandle {
  id: string;
  title: string | null;
  role: string | null;
  mention_handle: string;
  allow_direct_messages: boolean;
}

const sanitizeHandle = (value: string) =>
  value
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();

interface SidebarProps {
  folders: FolderWithCount[];
  activeFolder: FolderId;
  onFolderChange: (id: FolderId) => void;
  onCompose: () => void;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  folders,
  activeFolder,
  onFolderChange,
  onCompose,
  isMobileMenuOpen,
  closeMobileMenu,
}) => (
  <aside
    className={`absolute inset-y-0 left-0 z-40 w-72 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-none lg:w-64 ${
      isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
    }`}
  >
    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 lg:hidden">
      <h2 className="text-xl font-bold text-gray-800">Mailbox</h2>
      <button onClick={closeMobileMenu} className="text-gray-500 hover:text-gray-700">
        <X size={24} />
      </button>
    </div>

    <div className="p-4 space-y-6">
      <button
        onClick={() => {
          onCompose();
          closeMobileMenu();
        }}
        className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-150 flex items-center justify-center space-x-2"
      >
        <Plus size={20} />
        <span>Compose</span>
      </button>

      <nav className="space-y-1">
        {folders.map((folder) => {
          const isActive = activeFolder === folder.id;
          const Icon = folder.icon;
          return (
            <button
              key={folder.id}
              onClick={() => {
                onFolderChange(folder.id);
                closeMobileMenu();
              }}
              className={`flex items-center justify-between w-full py-2 px-3 rounded-lg text-sm font-medium transition duration-150 ${
                isActive
                  ? 'bg-orange-100 text-orange-700 border-l-4 border-orange-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {React.createElement(Icon as React.ComponentType<{ size: number }>, { size: 20 })}
                <span>{folder.name}</span>
              </div>
              {folder.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {folder.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  </aside>
);

interface EmailListProps {
  emails: Email[];
  selectedEmailId: string | null;
  setSelectedEmailId: (id: string | null) => void;
  activeFolder: FolderId;
  isLoading?: boolean;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  setSelectedEmailId,
  activeFolder,
  isLoading = false,
}) => {
  const filteredEmails = useMemo(
    () =>
      emails
        .filter((email) => email.folder === activeFolder)
        .sort((a, b) => {
          // Sort by received_at if available, otherwise use timestamp
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeB - timeA;
        }),
    [emails, activeFolder],
  );

  return (
    <Card className="flex flex-col h-full min-w-0">
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 capitalize">{activeFolder}</h2>
        <div className="flex items-center space-x-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search mail..."
            className="p-1 text-sm border-b focus:outline-none focus:border-orange-500 transition w-full max-w-[150px]"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {isLoading ? (
          <div className="text-center p-8">
            <Spin size="large" />
            <p className="mt-4 text-gray-500">Loading emails...</p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center p-8 text-gray-500">No emails in this folder.</div>
        ) : (
          filteredEmails.map((email) => {
            const isSelected = email.id === selectedEmailId;
            return (
              <button
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={`w-full text-left p-4 transition duration-150 border-l-4 ${
                  isSelected
                    ? 'bg-orange-50 border-orange-500'
                    : 'hover:bg-gray-50 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start">
                  <p
                    className={`font-semibold ${
                      email.read ? 'text-gray-700' : 'text-gray-900'
                    }`}
                  >
                    {activeFolder === 'sent' ? `To: ${email.recipient}` : email.sender}
                  </p>
                  <p className="text-xs text-gray-500 flex-shrink-0">{email.timestamp}</p>
                </div>
                <p
                  className={`text-sm mt-1 truncate ${
                    email.read ? 'text-gray-500' : 'text-gray-700 font-medium'
                  }`}
                >
                  {email.subject}
                </p>
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                  {email.body.substring(0, 50)}...
                </p>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
};

interface EmailViewerProps {
  email: Email;
  setIsComposing: (state: boolean) => void;
  setSelectedEmailId: (id: string | null) => void;
  handleDelete: (id: string) => void;
  handleArchive: (id: string) => void;
}

const EmailViewer: React.FC<EmailViewerProps> = ({
  email,
  setIsComposing,
  setSelectedEmailId,
  handleDelete,
  handleArchive,
}) => {
  const handleReply = useCallback(() => {
    setIsComposing(true);
    setSelectedEmailId(null);
  }, [setIsComposing, setSelectedEmailId]);

  const handleBack = useCallback(() => {
    setSelectedEmailId(null);
  }, [setSelectedEmailId]);

  return (
    <Card className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center text-sm text-gray-600 hover:text-orange-600 transition lg:hidden"
        >
          <ChevronLeft size={20} className="mr-1" />
          Back to List
        </button>
        <h2 className="text-lg font-semibold text-gray-800 truncate hidden lg:block">
          {email.subject}
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleReply}
            className="p-2 text-gray-500 rounded-full hover:bg-orange-50 hover:text-orange-600 transition duration-150"
            title="Reply"
          >
            <CornerDownLeft size={20} />
          </button>
          <button
            onClick={() => handleArchive(email.id)}
            className="p-2 text-gray-500 rounded-full hover:bg-orange-50 hover:text-orange-600 transition duration-150"
            title="Archive"
          >
            <Tag size={20} />
          </button>
          <button
            onClick={() => handleDelete(email.id)}
            className="p-2 text-gray-500 rounded-full hover:bg-orange-50 hover:text-red-600 transition duration-150"
            title="Delete"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{email.subject}</h1>
        <div className="flex items-center text-sm text-gray-600 space-x-2">
          <User size={16} className="text-orange-500" />
          <span className="font-medium">{email.sender}</span>
          <ChevronRight size={12} className="text-gray-400" />
          <Mail size={16} className="text-orange-500" />
          <span>{email.recipient}</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">Received: {email.timestamp}</p>
        {email.priority === 'high' && (
          <span className="mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded bg-red-100 text-red-600">
            High Priority
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 text-gray-700 leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: email.body }} />
        <div className="mt-8 pt-4 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center">
            <Paperclip size={14} className="mr-1" /> Attachments (1)
          </p>
          <button
            type="button"
            className="text-blue-600 text-sm hover:text-blue-800 transition underline"
          >
            Q3_Report_Final.pdf (1.2 MB)
          </button>
        </div>
      </div>
    </Card>
  );
};

interface ComposeEmailProps {
  setIsComposing: (state: boolean) => void;
  addEmail: (email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'read'>) => void;
  saveDraft: (email: Omit<Email, 'id' | 'timestamp' | 'folder' | 'read'>) => void;
  handles: ExecHandle[];
  handlesLoading: boolean;
}

const ComposeEmail: React.FC<ComposeEmailProps> = ({
  setIsComposing,
  addEmail,
  saveDraft,
  handles,
  handlesLoading,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const normalizedRecipient = sanitizeHandle(recipient);

  const availableHandles = useMemo(
    () => handles.filter((entry) => entry.mention_handle && (entry.allow_direct_messages ?? true)),
    [handles],
  );

  const suggestions = useMemo(() => {
    if (!normalizedRecipient) {
      return availableHandles.slice(0, 6);
    }
    return availableHandles
      .filter((entry) =>
        entry.mention_handle &&
        sanitizeHandle(entry.mention_handle).includes(normalizedRecipient),
      )
      .slice(0, 6);
  }, [availableHandles, normalizedRecipient]);

  const resetForm = () => {
    setRecipient('');
    setSubject('');
    setBody('');
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject || !body) {
      return;
    }
    const matchedHandle = availableHandles.find(
      (entry) =>
        entry.mention_handle &&
        sanitizeHandle(entry.mention_handle) === normalizedRecipient,
    );

    if (!matchedHandle) {
      setValidationError('Select a valid executive @handle.');
      return;
    }

    const formattedRecipient = `@${sanitizeHandle(matchedHandle.mention_handle || '')}`;

    addEmail({ recipient: formattedRecipient, subject, body, sender: 'You' });
    resetForm();
  };

  const handleSaveDraft = () => {
    if (!recipient && !subject && !body) {
      setIsComposing(false);
      return;
    }
    saveDraft({ recipient, subject, body, sender: 'You' });
    resetForm();
  };

  const handleRecipientChange = (value: string) => {
    if (!value) {
      setRecipient('');
      setValidationError(null);
      return;
    }
    const sanitized = value.startsWith('@') ? value : `@${value}`;
    setRecipient(sanitized.replace(/\s+/g, ''));
    setValidationError(null);
  };

  return (
    <Card className="flex flex-col h-full">
      <header className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">New Message</h2>
        <button
          onClick={() => {
            handleSaveDraft();
            setIsComposing(false);
          }}
          className="p-2 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-600 transition duration-150"
          title="Discard"
        >
          <X size={20} />
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-4 space-y-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Recipient @handle"
            value={recipient}
            onChange={(e) => handleRecipientChange(e.target.value)}
            required
            className="w-full p-2 border-b text-sm focus:outline-none focus:border-orange-500"
          />
          {handlesLoading ? (
            <p className="text-xs text-gray-400">Loading executive directory…</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => {
                    if (!entry.mention_handle) return;
                    setRecipient(`@${entry.mention_handle}`);
                    setValidationError(null);
                  }}
                  className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition"
                >
                  @{entry.mention_handle}
                  <span className="ml-1 text-[10px] text-gray-500">
                    {entry.title || entry.role?.toUpperCase() || ''}
                  </span>
                </button>
              ))}
              {suggestions.length === 0 && !handlesLoading && (
                <span className="text-xs text-gray-400">
                  No matching executives. Check spelling or configure handles in settings.
                </span>
              )}
            </div>
          )}
          {validationError && (
            <p className="text-xs text-red-500">{validationError}</p>
          )}
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full p-2 border-b text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex-1 p-4">
          <textarea
            placeholder="Write your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            className="w-full h-full p-2 resize-none border-none focus:outline-none text-sm text-gray-700"
          />
        </div>

        <footer className="p-4 border-t border-gray-200 flex justify-end items-center space-x-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition duration-150"
          >
            Save Draft
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 transition duration-150 flex items-center space-x-2"
          >
            <Send size={18} />
            <span>Send</span>
          </button>
        </footer>
      </form>
    </Card>
  );
};

const BusinessEmailSystem: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<FolderId>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [execHandles, setExecHandles] = useState<ExecHandle[]>([]);
  const [handlesLoading, setHandlesLoading] = useState(false);
  const [workspaceSettingsOpen, setWorkspaceSettingsOpen] = useState(false);
  const [workspaceSettingsLoading, setWorkspaceSettingsLoading] = useState(false);
  const [workspaceSettingsSaving, setWorkspaceSettingsSaving] = useState(false);
  const [workspaceSettingId, setWorkspaceSettingId] = useState<string | null>(null);
  const [workspaceForm] = Form.useForm<WorkspaceFormValues>();
  const [isSyncing, setIsSyncing] = useState(false);
  const [emailsLoading, setEmailsLoading] = useState(false);

  const folderCounts = useMemo(() => {
    const counts: Record<FolderId, number> = {
      inbox: 0,
      sent: 0,
      drafts: 0,
      trash: 0,
      archive: 0,
    };
    emails.forEach((email) => {
      counts[email.folder] += 1;
    });
    return counts;
  }, [emails]);

  const folders: FolderWithCount[] = useMemo(
    () => BASE_FOLDERS.map((folder) => ({ ...folder, count: folderCounts[folder.id] })),
    [folderCounts],
  );

  const selectedEmail = useMemo(
    () => emails.find((email) => email.id === selectedEmailId) || null,
    [emails, selectedEmailId],
  );

  // Fetch emails from database
  const fetchEmails = useCallback(async () => {
    setEmailsLoading(true);
    try {
      const { data, error } = await supabase
        .from('gmail_messages')
        .select('*')
        .order('received_at', { ascending: false });

      if (error) throw error;

      const mappedEmails: Email[] = (data || []).map((msg: any) => ({
        id: msg.id,
        gmail_message_id: msg.gmail_message_id,
        gmail_thread_id: msg.gmail_thread_id,
        subject: msg.subject || '(No Subject)',
        sender: msg.from_address || 'Unknown',
        recipient: msg.to_address || 'Unknown',
        body: msg.body_html || msg.body_text || '',
        timestamp: new Date(msg.received_at).toLocaleString(),
        folder: msg.folder as FolderId,
        read: msg.is_read,
        priority: undefined,
      }));

      setEmails(mappedEmails);
    } catch (err: any) {
      console.error('Failed to fetch emails:', err);
      message.error('Failed to load emails');
    } finally {
      setEmailsLoading(false);
    }
  }, []);

  // Sync emails from Gmail
  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('gmail-sync', {
        body: { maxResults: 50, forceFull: false },
      });

      if (error) throw error;

      message.success(`Synced ${data?.synced || 0} messages`);
      await fetchEmails();
    } catch (err: any) {
      console.error('Sync failed:', err);
      message.error(err.message || 'Failed to sync emails');
    } finally {
      setIsSyncing(false);
    }
  }, [fetchEmails]);

  const addEmail = useCallback(
    (newEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'read'>) => {
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const emailToAdd: Email = {
        ...newEmail,
        id: crypto.randomUUID(),
        timestamp,
        folder: 'sent',
        read: true,
      };
      setEmails((prev) => [...prev, emailToAdd]);
      setActiveFolder('sent');
      setSelectedEmailId(emailToAdd.id);
      setIsComposing(false);
    },
    [],
  );

  const saveDraft = useCallback(
    (draftEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'read'>) => {
      if (!draftEmail.subject && !draftEmail.body && !draftEmail.recipient) {
        setIsComposing(false);
        return;
      }
      const timestamp = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const emailToAdd: Email = {
        ...draftEmail,
        id: crypto.randomUUID(),
        timestamp,
        folder: 'drafts',
        read: true,
      };
      setEmails((prev) => [...prev, emailToAdd]);
      setActiveFolder('drafts');
      setSelectedEmailId(emailToAdd.id);
      setIsComposing(false);
    },
    [],
  );

  const fetchWorkspaceSettings = useCallback(async () => {
    setWorkspaceSettingsLoading(true);
    try {
      const emptyValues: WorkspaceFormValues = {
        serviceAccountEmail: '',
        privateKey: '',
        delegatedUser: '',
        defaultFrom: '',
        executiveFrom: '',
        treasuryFrom: '',
        scope: DEFAULT_GMAIL_SCOPE,
      };

      workspaceForm.setFieldsValue(emptyValues);
      setWorkspaceSettingId(null);

      const { data, error } = await supabase
        .from('ceo_system_settings')
        .select('id, setting_value')
        .eq('setting_key', 'google_workspace_email')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setWorkspaceSettingId(data.id);
        const value = (data.setting_value as Partial<WorkspaceFormValues>) ?? {};
        workspaceForm.setFieldsValue({
          serviceAccountEmail: value.serviceAccountEmail ?? '',
          privateKey: value.privateKey ?? '',
          delegatedUser: value.delegatedUser ?? '',
          defaultFrom: value.defaultFrom ?? '',
          executiveFrom: value.executiveFrom ?? '',
          treasuryFrom: value.treasuryFrom ?? '',
          scope: value.scope ?? DEFAULT_GMAIL_SCOPE,
        });
      }
    } catch (err: any) {
      console.error('Failed to load Google Workspace settings', err);
      message.error(err?.message ?? 'Failed to load Google Workspace settings');
      workspaceForm.setFieldsValue({
        serviceAccountEmail: '',
        privateKey: '',
        delegatedUser: '',
        defaultFrom: '',
        executiveFrom: '',
        treasuryFrom: '',
        scope: DEFAULT_GMAIL_SCOPE,
      });
      setWorkspaceSettingId(null);
    } finally {
      setWorkspaceSettingsLoading(false);
    }
  }, [workspaceForm]);

  const handleSaveWorkspaceSettings = useCallback(async () => {
    try {
      const values = await workspaceForm.validateFields();

      setWorkspaceSettingsSaving(true);

      const payload = {
        serviceAccountEmail: values.serviceAccountEmail.trim(),
        privateKey: values.privateKey.trim(),
        delegatedUser: values.delegatedUser.trim(),
        defaultFrom: values.defaultFrom.trim(),
        executiveFrom: values.executiveFrom?.trim() || null,
        treasuryFrom: values.treasuryFrom?.trim() || null,
        scope: values.scope?.trim() || DEFAULT_GMAIL_SCOPE,
      };

      const { data: authData } = await supabase.auth.getUser();

      const updatePayload = {
        setting_value: payload,
        category: 'operations',
        description: 'Google Workspace email configuration',
        is_critical: true,
        requires_confirmation: false,
        last_changed_by: authData.user?.id ?? null,
        last_changed_at: new Date().toISOString(),
      };

      let settingId = workspaceSettingId;

      if (workspaceSettingId) {
        const { error } = await supabase
          .from('ceo_system_settings')
          .update(updatePayload)
          .eq('id', workspaceSettingId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await supabase
          .from('ceo_system_settings')
          .insert([{ setting_key: 'google_workspace_email', ...updatePayload }])
          .select('id')
          .single();

        if (error) {
          throw error;
        }

        settingId = data?.id ?? null;
        setWorkspaceSettingId(settingId);
      }

      if (settingId) {
        const { error: logError } = await supabase.rpc('log_ceo_action', {
          p_action_type: 'update_google_workspace_email',
          p_action_category: 'system',
          p_target_type: 'system_setting',
          p_target_id: settingId,
          p_target_name: 'google_workspace_email',
          p_description: 'Updated Google Workspace email configuration',
          p_severity: 'high',
        });
        if (logError) {
          console.warn('Failed to log CEO action', logError);
        }
      }

      message.success('Google Workspace email settings saved');
      setWorkspaceSettingsOpen(false);
    } catch (err: any) {
      if (Array.isArray(err?.errorFields)) {
        return;
      }
      console.error('Failed to save Google Workspace settings', err);
      message.error(err?.message ?? 'Unable to save Google Workspace email settings');
    } finally {
      setWorkspaceSettingsSaving(false);
    }
  }, [workspaceForm, workspaceSettingId]);

  const handleOpenWorkspaceSettings = useCallback(() => {
    setWorkspaceSettingsOpen(true);
  }, []);

  const handleCloseWorkspaceSettings = useCallback(() => {
    if (!workspaceSettingsSaving) {
      setWorkspaceSettingsOpen(false);
    }
  }, [workspaceSettingsSaving]);

  const handleFolderChange = useCallback((folderId: FolderId) => {
    setActiveFolder(folderId);
    setSelectedEmailId(null);
    setIsComposing(false);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setEmails((prev) => {
      const target = prev.find((email) => email.id === id);
      if (!target) {
        return prev;
      }
      if (target.folder === 'trash') {
        return prev.filter((email) => email.id !== id);
      }
      return prev.map((email) =>
        email.id === id ? { ...email, folder: 'trash', read: true } : email,
      );
    });
    setSelectedEmailId(null);
    setIsComposing(false);
  }, []);

  const handleArchive = useCallback((id: string) => {
    setEmails((prev) =>
      prev.map((email) =>
        email.id === id ? { ...email, folder: 'archive', read: true } : email,
      ),
    );
    setSelectedEmailId(null);
    setIsComposing(false);
    setActiveFolder('archive');
  }, []);

  useEffect(() => {
    if (selectedEmailId === null) {
      return;
    }
    setEmails((prev) => {
      const index = prev.findIndex(
        (email) => email.id === selectedEmailId && !email.read,
      );
      if (index === -1) {
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...updated[index], read: true };
      return updated;
    });
  }, [selectedEmailId]);

  const viewerVisible = !!selectedEmail && !isComposing;
  const listVisible = !isComposing;

  // Load emails on mount
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  useEffect(() => {
    const fetchHandles = async () => {
      setHandlesLoading(true);
      try {
        let data: any[] | null = null;

        const metadataQuery = await supabase
          .from('exec_users')
          .select<any>('id, title, role, metadata')
          .order('title', { ascending: true, nullsFirst: false });

        if (metadataQuery.error) {
          if (metadataQuery.error.code === '42703') {
            const fallback = await supabase
              .from('exec_users')
              .select<any>('id, title, role')
              .order('title', { ascending: true, nullsFirst: false });

            if (fallback.error) throw fallback.error;
            data = fallback.data || [];
          } else {
            throw metadataQuery.error;
          }
        } else {
          data = metadataQuery.data || [];
        }

        const handleCounts = new Map<string, number>();
        const processed: ExecHandle[] = data
          .map((entry) => {
            const communications = entry?.metadata?.communications || {};
            const baseHandle =
              communications?.mention_handle ||
              sanitizeHandle(entry?.title || entry?.role || entry?.id || '');
            const count = handleCounts.get(baseHandle) || 0;
            handleCounts.set(baseHandle, count + 1);
            const uniqueHandle =
              count === 0 ? baseHandle : `${baseHandle}${count + 1}`;

            return {
              id: entry.id,
              title: entry.title ?? null,
              role: entry.role ?? null,
              mention_handle: uniqueHandle || sanitizeHandle(entry.id),
              allow_direct_messages:
                communications?.allow_direct_messages ?? true,
            };
          })
          .filter((entry) => !!entry.mention_handle);

        setExecHandles(processed);
      } catch (err) {
        console.error('Unable to load executive handles', err);
        message.error('Unable to load executive handles');
        setExecHandles([]);
      } finally {
        setHandlesLoading(false);
      }
    };

    fetchHandles();
  }, []);

  useEffect(() => {
    if (!workspaceSettingsOpen) {
      return;
    }
    fetchWorkspaceSettings();
  }, [workspaceSettingsOpen, fetchWorkspaceSettings]);

  return (
    <div className="relative bg-gray-50 border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex flex-col lg:flex-row h-full min-h-[640px]">
        <Sidebar
          folders={folders}
          activeFolder={activeFolder}
          onFolderChange={handleFolderChange}
          onCompose={() => {
            setIsComposing(true);
            setSelectedEmailId(null);
          }}
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 flex flex-col lg:flex-row min-w-0 p-4 lg:p-6 gap-4 lg:gap-6">
          {/* Mobile menu trigger */}
          <div className="lg:hidden flex items-center justify-between mb-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-white rounded-lg shadow-md border border-gray-200"
            >
              <Menu size={24} />
            </button>
            <span className="text-sm font-medium text-gray-600">
              {activeFolder.charAt(0).toUpperCase() + activeFolder.slice(1)}
            </span>
          </div>

          <div className="flex justify-end gap-2 mb-3">
            <Button 
              icon={isSyncing ? <SyncOutlined spin /> : <RefreshCw size={16} />} 
              onClick={handleSync}
              loading={isSyncing}
            >
              Sync Gmail
            </Button>
            <Button icon={<SettingOutlined />} onClick={handleOpenWorkspaceSettings}>
              Google Workspace Settings
            </Button>
          </div>

          {listVisible && (
            <div className="flex-1 lg:flex-[0.45] flex flex-col min-h-[320px]">
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId}
                setSelectedEmailId={setSelectedEmailId}
                activeFolder={activeFolder}
                isLoading={emailsLoading}
              />
            </div>
          )}

          <div className="flex-1 lg:flex-[0.55] flex flex-col min-h-[320px]">
            {viewerVisible && selectedEmail && (
              <EmailViewer
                email={selectedEmail}
                setIsComposing={setIsComposing}
                setSelectedEmailId={setSelectedEmailId}
                handleDelete={handleDelete}
                handleArchive={handleArchive}
              />
            )}

            {isComposing && (
              <ComposeEmail
                setIsComposing={setIsComposing}
                addEmail={addEmail}
                saveDraft={saveDraft}
                handles={execHandles}
                handlesLoading={handlesLoading}
              />
            )}

            {!viewerVisible && !isComposing && (
              <Card className="flex items-center justify-center h-full text-gray-400 text-lg">
                Select a message to view its content.
              </Card>
            )}
          </div>
        </main>
      </div>

      <Modal
        title={
          <span className="flex items-center gap-2">
            <SettingOutlined />
            <span>Google Workspace Email Settings</span>
          </span>
        }
        open={workspaceSettingsOpen}
        onCancel={handleCloseWorkspaceSettings}
        footer={[
          <Button key="cancel" onClick={handleCloseWorkspaceSettings} disabled={workspaceSettingsSaving}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={workspaceSettingsSaving}
            onClick={handleSaveWorkspaceSettings}
          >
            Save Settings
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        <Spin spinning={workspaceSettingsLoading}>
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message="Service account credentials are stored in Supabase and used by automated email flows."
          />
          <Typography.Paragraph type="secondary" className="mb-4">
            Provide the Google Cloud service account and Workspace sender addresses that should deliver Crave'N emails.
          </Typography.Paragraph>
          <Form
            layout="vertical"
            form={workspaceForm}
            initialValues={{ scope: DEFAULT_GMAIL_SCOPE }}
            disabled={workspaceSettingsSaving}
          >
            <Form.Item
              name="serviceAccountEmail"
              label="Service Account Email"
              rules={[{ required: true, message: 'Enter the service account email address' }]}
            >
              <Input placeholder="service-account@project-id.iam.gserviceaccount.com" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="privateKey"
              label="Service Account Private Key"
              rules={[{ required: true, message: 'Paste the service account private key' }]}
            >
              <TextArea
                autoSize={{ minRows: 4, maxRows: 8 }}
                placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
              />
            </Form.Item>
            <Form.Item
              name="delegatedUser"
              label="Delegated Workspace User"
              rules={[{ required: true, message: 'Enter the Workspace user to impersonate' }]}
              extra="This Workspace mailbox must have send-as access for each From address below."
            >
              <Input placeholder="hr@craven.com" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="defaultFrom"
              label="Default From Address"
              rules={[{ required: true, message: 'Provide the default From address' }]}
            >
              <Input placeholder="Crave'N HR <hr@craven.com>" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="executiveFrom"
              label="Executive Emails From (optional)"
              extra="Overrides the default sender for executive onboarding flows."
            >
              <Input placeholder="Crave'N Executive Services <executive@craven.com>" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="treasuryFrom"
              label="Treasury Emails From (optional)"
              extra="Overrides the default sender for treasury and IBOE notifications."
            >
              <Input placeholder="Crave'N Treasury <treasury@cravenusa.com>" autoComplete="off" />
            </Form.Item>
            <Form.Item
              name="scope"
              label="Gmail API Scope"
              extra="Defaults to https://www.googleapis.com/auth/gmail.send"
            >
              <Input placeholder={DEFAULT_GMAIL_SCOPE} autoComplete="off" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default BusinessEmailSystem;

