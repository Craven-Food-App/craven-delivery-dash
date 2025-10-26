import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Check, Clock, AlertCircle, MapPin, DollarSign, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  created_at: string;
  order_id?: string;
}

interface NotificationsPageProps {
  userId: string;
}

const NotificationsPage = ({ userId }: NotificationsPageProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await supabase
        .from('order_notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_assigned':
        return <Truck className="h-5 w-5 text-orange-500" />;
      case 'order_completed':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'location_update':
        return <MapPin className="h-5 w-5 text-orange-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'urgent':
      case 'admin_message':
      case 'support_message':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_assigned':
        return 'border-orange-200 bg-orange-50';
      case 'order_completed':
        return 'border-green-200 bg-green-50';
      case 'payment_received':
        return 'border-green-200 bg-green-50';
      case 'location_update':
        return 'border-orange-200 bg-orange-50';
      case 'reminder':
        return 'border-orange-200 bg-orange-50';
      case 'urgent':
      case 'admin_message':
      case 'support_message':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-orange-200 bg-orange-50';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4 space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-600">Stay updated with your deliveries</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            onClick={markAllAsRead}
            variant="outline" 
            size="sm"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="mb-4">
          <Badge variant="destructive" className="text-sm px-3 py-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">No notifications yet</h3>
            <p className="text-sm text-gray-400 text-center">
              You'll receive notifications about new orders, payments, and updates here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                !notification.is_read 
                  ? `${getNotificationColor(notification.notification_type)} border-l-4 ${
                      notification.notification_type === 'urgent' || 
                      notification.notification_type === 'admin_message' || 
                      notification.notification_type === 'support_message'
                        ? 'border-l-red-500' 
                        : 'border-l-orange-500'
                    }` 
                  : 'bg-white'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold text-sm ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <div className={`w-2 h-2 rounded-full ${
                              notification.notification_type === 'urgent' || 
                              notification.notification_type === 'admin_message' || 
                              notification.notification_type === 'support_message'
                                ? 'bg-red-500' 
                                : 'bg-orange-500'
                            }`}></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-gray-400">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
