/**
 * SMS Campaign Manager
 * Create and manage SMS marketing campaigns
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MessageSquare, Send, TrendingUp, Phone } from 'lucide-react';
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

interface SMSCampaign {
  id: string;
  name: string;
  message: string;
  segmentId: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent';
  scheduledAt: string | null;
  sentCount: number;
  deliveryRate: number;
  createdAt: string;
}

const SMSCampaignManager: React.FC = () => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    message: '',
    segmentId: 'all',
    scheduledAt: ''
  });

  const handleCreateCampaign = () => {
    if (!newCampaign.name || !newCampaign.message) return;

    const campaign: SMSCampaign = {
      id: `sms_${Date.now()}`,
      name: newCampaign.name,
      message: newCampaign.message,
      segmentId: newCampaign.segmentId,
      status: newCampaign.scheduledAt ? 'scheduled' : 'draft',
      scheduledAt: newCampaign.scheduledAt || null,
      sentCount: 0,
      deliveryRate: 0,
      createdAt: new Date().toISOString()
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({ name: '', message: '', segmentId: 'all', scheduledAt: '' });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">SMS Campaigns</h2>
          <p className="text-gray-600 mt-1">Create and send SMS marketing messages</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold">{campaigns.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-orange-500" />
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
            <Phone className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {campaigns.length === 0 && (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No SMS campaigns yet</h3>
          <p className="text-gray-600 mb-4">Create your first SMS campaign to reach customers directly</p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </Card>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create SMS Campaign</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="smsName">Campaign Name *</Label>
              <Input
                id="smsName"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="smsMessage">Message * (160 chars max)</Label>
              <Textarea
                id="smsMessage"
                value={newCampaign.message}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                className="mt-1"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">{newCampaign.message.length}/160</p>
            </div>
            <div>
              <Label htmlFor="smsSegment">Target Segment</Label>
              <Select
                value={newCampaign.segmentId}
                onValueChange={(value) => setNewCampaign(prev => ({ ...prev, segmentId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active Customers</SelectItem>
                </SelectContent>
              </Select>
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

export default SMSCampaignManager;

