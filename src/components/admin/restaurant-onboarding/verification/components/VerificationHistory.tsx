import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  CheckCircle,
  XCircle,
  User,
  FileText,
  AlertCircle,
  History as HistoryIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VerificationHistoryProps {
  restaurantId: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  admin_email: string;
  notes: string;
  created_at: string;
  action_type: 'approved' | 'rejected' | 'updated' | 'reviewed';
}

export function VerificationHistory({ restaurantId }: VerificationHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [restaurantId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // Fetch from activity log
      const { data, error } = await supabase
        .from('restaurant_onboarding_activity_log')
        .select(`
          id,
          action_type,
          action_description,
          created_at,
          profiles!admin_id (
            email
          )
        `)
        .eq('restaurant_id', restaurantId)
        .in('action_type', ['approved', 'rejected', 'document_verified', 'updated'])
        .order('created_at', { ascending: false })
        .limit(20) as any;

      if (error) {
        console.error('Error fetching history:', error);
        setHistory([]);
        return;
      }

      const transformed: HistoryEntry[] = (data || []).map((item: any) => ({
        id: item.id,
        action: item.action_description,
        admin_email: item.profiles?.email || 'Unknown Admin',
        notes: item.action_description,
        created_at: item.created_at,
        action_type: item.action_type as any,
      }));

      setHistory(transformed);
    } catch (error) {
      console.error('Error in fetchHistory:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'document_verified':
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'document_verified':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Loading verification history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12">
          <div className="text-center">
            <HistoryIcon className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Verification History
            </h3>
            <p className="text-sm text-muted-foreground">
              This restaurant hasn't been reviewed yet. You'll be the first!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Verification Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {/* Timeline Line */}
                  {index < history.length - 1 && (
                    <div className="absolute left-[22px] top-12 w-0.5 h-full bg-gray-200" />
                  )}

                  {/* History Entry */}
                  <div className={`flex gap-3 p-4 rounded-lg border ${getActionColor(entry.action_type)}`}>
                    {/* Icon */}
                    <div className="flex-shrink-0 w-11 h-11 rounded-full bg-white border-2 flex items-center justify-center">
                      {getActionIcon(entry.action_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1">{entry.action}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.admin_email}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-xs mb-1">
                            {entry.action_type}
                          </Badge>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(entry.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

