/**
 * Admin Roles & Permissions
 * Manage marketing team access control
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, UserPlus, Users, CheckCircle, XCircle } from 'lucide-react';
import { subDays } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';

interface Role {
  id: string;
  name: string;
  permissions: string[];
  memberCount: number;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActive: string;
}

const AdminRolesPermissions: React.FC = () => {
  const [roles] = useState<Role[]>([
    {
      id: 'marketing_manager',
      name: 'Marketing Manager',
      permissions: ['all'],
      memberCount: 2
    },
    {
      id: 'analyst',
      name: 'Marketing Analyst',
      permissions: ['view', 'analytics', 'export'],
      memberCount: 3
    },
    {
      id: 'content_creator',
      name: 'Content Creator',
      permissions: ['create', 'edit', 'view'],
      memberCount: 5
    },
    {
      id: 'campaign_manager',
      name: 'Campaign Manager',
      permissions: ['create', 'edit', 'publish', 'view'],
      memberCount: 4
    }
  ]);

  const [teamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@craven.com',
      role: 'Marketing Manager',
      lastActive: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@craven.com',
      role: 'Marketing Analyst',
      lastActive: subDays(new Date(), 2).toISOString()
    }
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: ''
  });

  const permissions = [
    { id: 'view', label: 'View' },
    { id: 'create', label: 'Create' },
    { id: 'edit', label: 'Edit' },
    { id: 'publish', label: 'Publish' },
    { id: 'delete', label: 'Delete' },
    { id: 'analytics', label: 'View Analytics' },
    { id: 'export', label: 'Export Data' },
    { id: 'manage_users', label: 'Manage Users' },
    { id: 'all', label: 'Full Access' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Roles & Permissions</h2>
          <p className="text-gray-600 mt-1">Manage marketing team access and permissions</p>
        </div>
        <Button onClick={() => setShowInviteModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Roles</p>
              <p className="text-2xl font-bold">{roles.length}</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {teamMembers.filter(m => new Date(m.lastActive) > subDays(new Date(), 7)).length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Roles */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Roles & Permissions</h3>
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{role.name}</h4>
                  <p className="text-sm text-gray-600">{role.memberCount} members</p>
                </div>
                <Button variant="outline" size="sm">Edit Role</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.includes('all') ? (
                  <Badge variant="default" className="bg-orange-600">Full Access</Badge>
                ) : (
                  role.permissions.map(perm => (
                    <Badge key={perm} variant="secondary">
                      {permissions.find(p => p.id === perm)?.label || perm}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Team Members</h3>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-600">{member.email}</div>
                  <div className="text-xs text-gray-500">{member.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Last active: {new Date(member.lastActive).toLocaleDateString()}
                </span>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">Email Address *</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="inviteRole">Role *</Label>
              <Select
                value={inviteData.role}
                onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Send Invitation
              </Button>
              <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRolesPermissions;

