/**
 * Campaign Automation
 * Create automated campaigns with triggers and schedules
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Zap, Calendar, Clock, Target, Mail } from 'lucide-react';
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

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  status: 'active' | 'paused';
  runsCount: number;
  createdAt: string;
}

const CampaignAutomation: React.FC = () => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    trigger: '',
    action: '',
    segmentId: ''
  });

  const triggers = [
    { value: 'new_signup', label: 'New User Signup' },
    { value: 'first_order', label: 'First Order Placed' },
    { value: 'inactive_30', label: 'Inactive for 30 Days' },
    { value: 'abandoned_cart', label: 'Abandoned Cart' },
    { value: 'order_completed', label: 'Order Completed' },
    { value: 'birthday', label: 'Customer Birthday' },
    { value: 'holiday', label: 'Holiday' },
  ];

  const actions = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'send_push', label: 'Send Push Notification' },
    { value: 'send_sms', label: 'Send SMS' },
    { value: 'apply_promo', label: 'Apply Promo Code' },
    { value: 'add_loyalty_points', label: 'Add Loyalty Points' },
  ];

  const handleCreateAutomation = () => {
    if (!newAutomation.name || !newAutomation.trigger || !newAutomation.action) return;

    const automation: Automation = {
      id: `auto_${Date.now()}`,
      name: newAutomation.name,
      trigger: newAutomation.trigger,
      action: newAutomation.action,
      status: 'active',
      runsCount: 0,
      createdAt: new Date().toISOString()
    };

    setAutomations([...automations, automation]);
    setNewAutomation({ name: '', trigger: '', action: '', segmentId: '' });
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Campaign Automation</h2>
          <p className="text-gray-600 mt-1">Create automated marketing campaigns with triggers</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Automations</p>
              <p className="text-2xl font-bold">
                {automations.filter(a => a.status === 'active').length}
              </p>
            </div>
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold">
                {automations.reduce((sum, a) => sum + a.runsCount, 0).toLocaleString()}
              </p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Triggers</p>
              <p className="text-2xl font-bold">{triggers.length}</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actions</p>
              <p className="text-2xl font-bold">{actions.length}</p>
            </div>
            <Mail className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Automations List */}
      {automations.length === 0 ? (
        <Card className="p-12 text-center">
          <Zap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No automations yet</h3>
          <p className="text-gray-600 mb-4">Create automated campaigns that trigger based on customer actions</p>
          <Button onClick={() => setShowCreateModal(true)} className="bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Automation
          </Button>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="space-y-4">
            {automations.map((automation) => (
              <div key={automation.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{automation.name}</h4>
                    <p className="text-sm text-gray-600">
                      When: {triggers.find(t => t.value === automation.trigger)?.label || automation.trigger} → 
                      Action: {actions.find(a => a.value === automation.action)?.label || automation.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Runs: {automation.runsCount} | Created: {new Date(automation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    automation.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {automation.status}
                  </span>
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Create Automation Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="autoName">Automation Name *</Label>
              <Input
                id="autoName"
                value={newAutomation.name}
                onChange={(e) => setNewAutomation(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Welcome New Users"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="trigger">Trigger *</Label>
              <Select
                value={newAutomation.trigger}
                onValueChange={(value) => setNewAutomation(prev => ({ ...prev, trigger: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {triggers.map(trigger => (
                    <SelectItem key={trigger.value} value={trigger.value}>{trigger.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="action">Action *</Label>
              <Select
                value={newAutomation.action}
                onValueChange={(value) => setNewAutomation(prev => ({ ...prev, action: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  {actions.map(action => (
                    <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="segment">Target Segment (Optional)</Label>
              <Select
                value={newAutomation.segmentId}
                onValueChange={(value) => setNewAutomation(prev => ({ ...prev, segmentId: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="new">New Customers</SelectItem>
                  <SelectItem value="active">Active Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateAutomation} className="bg-orange-600 hover:bg-orange-700">
                Create Automation
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

export default CampaignAutomation;

