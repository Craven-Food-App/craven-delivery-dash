/**
 * Tools & Integrations
 * Connect external services for marketing operations
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plug, Check, ExternalLink, Settings } from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: string;
}

const ToolsIntegrations: React.FC = () => {
  const [integrations] = useState<Integration[]>([
    {
      id: 'google_analytics',
      name: 'Google Analytics',
      category: 'Analytics',
      description: 'Track website traffic and user behavior',
      icon: '📊',
      status: 'disconnected'
    },
    {
      id: 'meta_ads',
      name: 'Meta Ads Manager',
      category: 'Advertising',
      description: 'Manage Facebook and Instagram ad campaigns',
      icon: '📱',
      status: 'disconnected'
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      category: 'Email',
      description: 'Email marketing platform integration',
      icon: '✉️',
      status: 'disconnected'
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      category: 'Email',
      description: 'Transactional and marketing emails',
      icon: '📧',
      status: 'connected',
      lastSync: new Date().toISOString()
    },
    {
      id: 'twilio',
      name: 'Twilio',
      category: 'SMS',
      description: 'SMS messaging and notifications',
      icon: '💬',
      status: 'disconnected'
    },
    {
      id: 'firebase',
      name: 'Firebase Cloud Messaging',
      category: 'Push Notifications',
      description: 'Push notification delivery',
      icon: '🔔',
      status: 'connected',
      lastSync: new Date().toISOString()
    },
    {
      id: 'hubspot',
      name: 'HubSpot CRM',
      category: 'CRM',
      description: 'Customer relationship management',
      icon: '👥',
      status: 'disconnected'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      category: 'Payments',
      description: 'Promotional credit management',
      icon: '💳',
      status: 'connected',
      lastSync: new Date().toISOString()
    }
  ]);

  const handleConnect = (integrationId: string) => {
    // TODO: Implement OAuth flow or API key setup
    console.log('Connecting:', integrationId);
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tools & Integrations</h2>
        <p className="text-gray-600 mt-1">Connect external services to enhance marketing capabilities</p>
      </div>

      {/* Connected Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Connected</p>
              <p className="text-2xl font-bold text-green-600">
                {integrations.filter(i => i.status === 'connected').length}
              </p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold">{integrations.length}</p>
            </div>
            <Plug className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disconnected</p>
              <p className="text-2xl font-bold text-gray-600">
                {integrations.filter(i => i.status === 'disconnected').length}
              </p>
            </div>
            <Plug className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Integrations by Category */}
      {Object.entries(groupedIntegrations).map(([category, items]) => (
        <Card key={category} className="p-6">
          <h3 className="text-lg font-semibold mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((integration) => (
              <div
                key={integration.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{integration.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                      <p className="text-xs text-gray-500">{integration.description}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    integration.status === 'connected' ? 'bg-green-100 text-green-700' :
                    integration.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {integration.status}
                  </span>
                </div>
                {integration.status === 'connected' && integration.lastSync && (
                  <p className="text-xs text-gray-500 mb-2">
                    Last synced: {new Date(integration.lastSync).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2">
                  {integration.status === 'connected' ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={() => handleConnect(integration.id)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default ToolsIntegrations;

