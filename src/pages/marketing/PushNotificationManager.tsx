/**
 * Push Notification Campaign Manager
 * Create, schedule, and track push notification campaigns
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Bell, Send, TrendingUp, Smartphone, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PushCampaign {
  id: string;
  title: string;
  body: string;
  segmentId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  scheduledAt: string | null;
  sentCount: number;
  deliveryRate: number;
  clickRate: number;
  createdAt: string;
  data?: Record<string, any>;
}

const PushNotificationManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<PushCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    body: '',
    segmentId: 'all',
    scheduledAt: '',
    actionUrl: ''
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // TODO: Create push_campaigns table
      // Mock data for now
      setCampaigns([
        {
          id: '1',
          title: 'New Restaurant Added!',
          body: 'Check out our newest restaurant partner',
          segmentId: 'all',
          status: 'sent',
          scheduledAt: null,
          sentCount: 8450,
          deliveryRate: 98.5,
          clickRate: 15.2,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaign.title || !newCampaign.body) return;

    const campaign: PushCampaign = {
      id: `push_${Date.now()}`,
      title: newCampaign.title,
      body: newCampaign.body,
      segmentId: newCampaign.segmentId,
      status: newCampaign.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: newCampaign.scheduledAt || null,
      sentCount: 0,
      deliveryRate: 0,
      clickRate: 0,
      createdAt: new Date().toISOString(),
      data: {
        url: newCampaign.actionUrl || '/'
      }
    };

    // TODO: Save to database
    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ title: '', body: '', segmentId: 'all', scheduledAt: '', actionUrl: '' });
    setShowCreateModal(false);
  };

  const handleSendCampaign = async (campaign: PushCampaign) => {
    try {
      // Get all users in the segment
      let userIds: string[] = [];
      
      if (campaign.segmentId === 'all') {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('role', 'customer');
        
        userIds = profiles?.map(p => p.user_id) || [];
      } else {
        // TODO: Get users from segment
        userIds = [];
      }

      // Send to each user via edge function
      const sendPromises = userIds.map(async (userId) => {
        const { error } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId,
            type: 'marketing_campaign',
            notification: {
              title: campaign.title,
              body: campaign.body,
              icon: '/logo.png',
              data: campaign.data || {}
            }
          }
        });
        
        if (error) {
          console.error(`Failed to send to user ${userId}:`, error);
        }
      });

      await Promise.all(sendPromises);
      
      // Update campaign status
      setCampaigns(prev => prev.map(c => 
        c.id === campaign.id 
          ? { ...c, status: 'sent' as const, sentCount: userIds.length }
          : c
      ));
    } catch (error) {
      console.error('Error sending campaign:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Push Notifications</h2>
          <p className="text-gray-600 mt-1">Create and send push notification campaigns</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <Bell className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold">
                {campaigns.reduce((sum, c) => sum + c.sentCount, 0).toLocaleString()}
              </p>
            </div>
            <Send className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Delivery Rate</p>
              <p className="text-2xl font-bold">
                {campaigns.length > 0
                  ? (campaigns.reduce((sum, c) => sum + c.deliveryRate, 0) / campaigns.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <Smartphone className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Click Rate</p>
              <p className="text-2xl font-bold">
                {campaigns.length > 0
                  ? (campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Campaign</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Sent</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Delivery</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Click Rate</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{campaign.title}</div>
                    <div className="text-sm text-gray-500">{campaign.body}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                      campaign.status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{campaign.sentCount.toLocaleString()}</td>
                  <td className="py-3 px-4">{campaign.deliveryRate.toFixed(1)}%</td>
                  <td className="py-3 px-4">{campaign.clickRate.toFixed(1)}%</td>
                  <td className="py-3 px-4">
                    {campaign.status === 'draft' && (
                      <Button size="sm" onClick={() => handleSendCampaign(campaign)}>
                        Send
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Push Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newCampaign.title}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Notification title"
                className="mt-1"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">{newCampaign.title.length}/50</p>
            </div>
            <div>
              <Label htmlFor="body">Message *</Label>
              <Textarea
                id="body"
                value={newCampaign.body}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Notification message"
                className="mt-1"
                rows={3}
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">{newCampaign.body.length}/150</p>
            </div>
            <div>
              <Label htmlFor="segment">Target Segment</Label>
              <Select
                value={newCampaign.segmentId}
                onValueChange={(value) => setNewCampaign(prev => ({ ...prev, segmentId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="new_users">New Users</SelectItem>
                  <SelectItem value="active">Active Customers</SelectItem>
                  <SelectItem value="inactive">Inactive Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="actionUrl">Action URL (when clicked)</Label>
              <Input
                id="actionUrl"
                value={newCampaign.actionUrl}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, actionUrl: e.target.value }))}
                placeholder="/restaurants or specific page"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={newCampaign.scheduledAt}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateCampaign} className="bg-orange-600 hover:bg-orange-700">
                Create Campaign
              </Button>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PushNotificationManager;

