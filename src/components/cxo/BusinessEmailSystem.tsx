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
} from 'lucide-react';

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
  id: number;
  subject: string;
  sender: string;
  recipient: string;
  body: string;
  timestamp: string;
  folder: FolderId;
  read: boolean;
  priority?: 'high' | 'low';
}

const BASE_FOLDERS: Folder[] = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'drafts', name: 'Drafts', icon: FileText },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'trash', name: 'Trash', icon: Trash2 },
  { id: 'archive', name: 'Archive', icon: Tag },
];

const INITIAL_EMAILS: Email[] = [
  {
    id: 1,
    subject: 'Project Status Update',
    sender: 'Alice Johnson',
    recipient: 'You',
    body: 'The Q3 report is finalized and ready for your review. Please check the attached document for detailed metrics and next steps.',
    timestamp: '10:30 AM',
    folder: 'inbox',
    read: false,
    priority: 'high',
  },
  {
    id: 2,
    subject: 'Meeting Confirmation',
    sender: 'Calendar Bot',
    recipient: 'You',
    body: 'Your meeting with the marketing team on Nov 10th is confirmed.',
    timestamp: '9:15 AM',
    folder: 'inbox',
    read: true,
  },
  {
    id: 3,
    subject: 'Draft: Quarterly Goals',
    sender: 'You',
    recipient: 'Bob Smith',
    body: 'Just a draft outlining the core Q4 goals for the team...',
    timestamp: 'Yesterday',
    folder: 'drafts',
    read: true,
  },
  {
    id: 4,
    subject: 'Follow-up on Customer CX',
    sender: 'Charlie Doe',
    recipient: 'You',
    body: 'We received excellent feedback from the latest customer survey! Great work team.',
    timestamp: '3 days ago',
    folder: 'inbox',
    read: false,
  },
  {
    id: 5,
    subject: 'Re: Team Lunch',
    sender: 'You',
    recipient: 'Team',
    body: 'Yes, pizza sounds perfect for Friday!',
    timestamp: '5:00 PM',
    folder: 'sent',
    read: true,
  },
];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div className={`bg-white shadow-lg rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

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
                <Icon size={20} />
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
  selectedEmailId: number | null;
  setSelectedEmailId: (id: number | null) => void;
  activeFolder: FolderId;
}

const EmailList: React.FC<EmailListProps> = ({
  emails,
  selectedEmailId,
  setSelectedEmailId,
  activeFolder,
}) => {
  const filteredEmails = useMemo(
    () =>
      emails
        .filter((email) => email.folder === activeFolder)
        .sort((a, b) => b.id - a.id),
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
        {filteredEmails.length === 0 ? (
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
  setSelectedEmailId: (id: number | null) => void;
  handleDelete: (id: number) => void;
  handleArchive: (id: number) => void;
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
        <p>{email.body}</p>
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
}

const ComposeEmail: React.FC<ComposeEmailProps> = ({
  setIsComposing,
  addEmail,
  saveDraft,
}) => {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const resetForm = () => {
    setRecipient('');
    setSubject('');
    setBody('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !subject || !body) {
      return;
    }
    addEmail({ recipient, subject, body, sender: 'You' });
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
            type="email"
            placeholder="Recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
            className="w-full p-2 border-b text-sm focus:outline-none focus:border-orange-500"
          />
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
  const [emails, setEmails] = useState<Email[]>(INITIAL_EMAILS);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const currentMaxId = useMemo(
    () => emails.reduce((max, email) => Math.max(max, email.id), 0),
    [emails],
  );

  const addEmail = useCallback(
    (newEmail: Omit<Email, 'id' | 'timestamp' | 'folder' | 'read'>) => {
      const timestamp = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const emailToAdd: Email = {
        ...newEmail,
        id: currentMaxId + 1,
        timestamp,
        folder: 'sent',
        read: true,
      };
      setEmails((prev) => [...prev, emailToAdd]);
      setActiveFolder('sent');
      setSelectedEmailId(emailToAdd.id);
      setIsComposing(false);
    },
    [currentMaxId],
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
        id: currentMaxId + 1,
        timestamp,
        folder: 'drafts',
        read: true,
      };
      setEmails((prev) => [...prev, emailToAdd]);
      setActiveFolder('drafts');
      setSelectedEmailId(emailToAdd.id);
      setIsComposing(false);
    },
    [currentMaxId],
  );

  const handleFolderChange = useCallback((folderId: FolderId) => {
    setActiveFolder(folderId);
    setSelectedEmailId(null);
    setIsComposing(false);
  }, []);

  const handleDelete = useCallback((id: number) => {
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

  const handleArchive = useCallback((id: number) => {
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

          {listVisible && (
            <div className="flex-1 lg:flex-[0.45] flex flex-col min-h-[320px]">
              <EmailList
                emails={emails}
                selectedEmailId={selectedEmailId}
                setSelectedEmailId={setSelectedEmailId}
                activeFolder={activeFolder}
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
    </div>
  );
};

export default BusinessEmailSystem;

