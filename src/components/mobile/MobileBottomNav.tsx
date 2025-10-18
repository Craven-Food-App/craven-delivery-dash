import React from 'react';
import { Home, Search, User, ShoppingCart, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import ChatButton from '@/components/chat/ChatButton';
interface MobileBottomNavProps {
  cartCount?: number;
  user?: any;
}
const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount = 0,
  user
}) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  const tabs = [{
    id: 'home',
    label: 'Home',
    icon: Home,
    path: '/'
  }, {
    id: 'restaurants',
    label: 'Search',
    icon: Search,
    path: '/restaurants'
  }, {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingCart,
    path: user ? '/customer-dashboard?tab=orders' : '/auth'
  }, {
    id: 'profile',
    label: 'Account',
    icon: User,
    path: user ? '/customer-dashboard?tab=account' : '/auth'
  }];
  return <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-20 right-4 z-50 my-[340px] px-0 mx-0 py-0">
        <ChatButton type="customer_support" userType="customer" variant="default" size="lg" className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90 border-2 border-background">
          <span className="sr-only">Chat Support</span>
        </ChatButton>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 h-16 safe-area-padding-bottom">
        <div className="flex h-full">
          {tabs.map(tab => {
          const Icon = tab.icon;
          // Check if current path matches, considering query parameters for customer-dashboard
          const isActive = tab.id === 'home' 
            ? location.pathname === '/' 
            : tab.id === 'restaurants' 
              ? location.pathname === '/restaurants'
              : tab.id === 'orders'
                ? location.pathname === '/customer-dashboard' && location.search.includes('tab=orders')
                : tab.id === 'profile'
                  ? location.pathname === '/customer-dashboard' && location.search.includes('tab=account')
                  : location.pathname === tab.path;
          
          return <Link key={tab.id} to={tab.path} className={cn("flex-1 flex flex-col items-center justify-center py-1 px-1 h-full transition-smooth relative", isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground")}>
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-[10px] font-medium leading-tight">{tab.label}</span>
                
                {/* Cart Badge */}
                {tab.id === 'orders' && cartCount > 0 && <div className="absolute -top-1 right-1/4 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </div>}
              </Link>;
        })}
        </div>
      </div>

      {/* Bottom padding for content */}
      <div className="h-16 md:hidden" />
    </>;
};
export default MobileBottomNav;