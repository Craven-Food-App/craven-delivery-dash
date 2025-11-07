import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

type IconComponent = React.ComponentType<{ size?: number; className?: string }>;

export interface ExecutiveNavItem {
  id: string;
  label: string;
  icon: IconComponent;
}

interface ExecutivePortalLayoutProps {
  title: string;
  subtitle?: string;
  navItems: ExecutiveNavItem[];
  activeItemId: string;
  onSelect: (id: string) => void;
  children: React.ReactNode;
  onBack?: () => void;
  onSignOut?: () => void;
  actionButtons?: React.ReactNode;
  userInfo?: {
    initials: string;
    name: string;
    role: string;
  };
  sidebarFooter?: React.ReactNode;
}

const ExecutivePortalLayout: React.FC<ExecutivePortalLayoutProps> = ({
  title,
  subtitle,
  navItems,
  activeItemId,
  onSelect,
  children,
  onBack,
  onSignOut,
  actionButtons,
  userInfo,
  sidebarFooter,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-20';

  const renderNavigation = (onNavigate?: () => void) => (
    <nav className="flex-1 p-3 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeItemId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              onSelect(item.id);
              if (onNavigate) {
                onNavigate();
              }
            }}
            className={`flex items-center w-full py-3 px-3 rounded-lg text-sm font-medium transition duration-150 ${
              isActive
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Icon size={20} className={isSidebarOpen ? 'mr-3' : 'mx-auto'} />
            {isSidebarOpen && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col ${sidebarWidth} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-xl`}
      >
        <div className="p-4 flex items-center justify-between h-16 border-b border-gray-200">
          {isSidebarOpen ? (
            <span className="text-xl font-extrabold text-orange-600 truncate">
              {title}
            </span>
          ) : (
            <div className="text-orange-600 font-extrabold text-xl mx-auto">{title.charAt(0)}</div>
          )}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className={`text-gray-500 hover:text-gray-700 transition ${isSidebarOpen ? '' : 'rotate-180'}`}
          >
            <ChevronRightIcon />
          </button>
        </div>
        {renderNavigation()}
        <div className="border-t border-gray-200 p-4">
          {sidebarFooter ? (
            sidebarFooter
          ) : userInfo ? (
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {userInfo.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userInfo.name}</p>
                <p className="text-xs text-gray-500 truncate">{userInfo.role}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4">
          <span className="text-lg font-bold text-orange-600 truncate">{title}</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={22} />
          </button>
        </div>
        {renderNavigation(() => setIsMobileMenuOpen(false))}
        <div className="border-t border-gray-200 p-4">
          {sidebarFooter ? (
            sidebarFooter
          ) : userInfo ? (
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {userInfo.initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{userInfo.name}</p>
                <p className="text-xs text-gray-500 truncate">{userInfo.role}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 sm:px-6 py-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-600"
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                  {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {actionButtons}
                {onBack && (
                  <button
                    onClick={onBack}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50"
                  >
                    Back to Hub
                  </button>
                )}
                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg shadow-md hover:bg-orange-700"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={`h-5 w-5 ${className ?? ''}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default ExecutivePortalLayout;

