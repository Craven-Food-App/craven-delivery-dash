/**
 * Settings & Configurations
 * System preferences and brand settings
 */

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings as SettingsIcon, Save, Palette, Mail, Bell, Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const MarketingSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    // Branding
    logoUrl: '',
    primaryColor: '#ff7a45',
    secondaryColor: '#ff9c6e',
    brandName: 'Crave\'N Delivery',
    
    // Email Settings
    senderName: 'Crave\'N Delivery',
    senderEmail: 'noreply@cravenusa.com',
    replyToEmail: 'support@cravenusa.com',
    
    // SMS Settings
    smsSenderName: 'Craven',
    smsProvider: 'twilio',
    
    // Notification Settings
    pushIconUrl: '/logo.png',
    pushSoundEnabled: true,
    
    // API Keys
    googleAnalyticsId: '',
    metaPixelId: '',
    
    // Regional
    timezone: 'America/New_York',
    currency: 'USD',
    defaultLanguage: 'en'
  });

  const handleSave = () => {
    // TODO: Save to database
    console.log('Saving settings:', settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings & Configurations</h2>
        <p className="text-gray-600 mt-1">Configure system preferences and brand settings</p>
      </div>

      {/* Branding */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Branding</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              value={settings.brandName}
              onChange={(e) => setSettings(prev => ({ ...prev, brandName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primary Color</Label>
              <Input
                id="primaryColor"
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <Input
                id="secondaryColor"
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="mt-1 h-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              value={settings.logoUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Email Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Email Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="senderName">Sender Name</Label>
            <Input
              id="senderName"
              value={settings.senderName}
              onChange={(e) => setSettings(prev => ({ ...prev, senderName: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="senderEmail">Sender Email</Label>
            <Input
              id="senderEmail"
              type="email"
              value={settings.senderEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="replyToEmail">Reply-To Email</Label>
            <Input
              id="replyToEmail"
              type="email"
              value={settings.replyToEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, replyToEmail: e.target.value }))}
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* SMS Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">SMS Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="smsSenderName">Sender Name</Label>
            <Input
              id="smsSenderName"
              value={settings.smsSenderName}
              onChange={(e) => setSettings(prev => ({ ...prev, smsSenderName: e.target.value }))}
              className="mt-1"
              maxLength={11}
            />
            <p className="text-xs text-gray-500 mt-1">Max 11 characters</p>
          </div>
          <div>
            <Label htmlFor="smsProvider">SMS Provider</Label>
            <Select
              value={settings.smsProvider}
              onValueChange={(value) => setSettings(prev => ({ ...prev, smsProvider: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twilio">Twilio</SelectItem>
                <SelectItem value="aws">AWS SNS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* API Keys */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">API Keys & Integrations</h3>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
            <Input
              id="googleAnalyticsId"
              value={settings.googleAnalyticsId}
              onChange={(e) => setSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
              placeholder="G-XXXXXXXXXX"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
            <Input
              id="metaPixelId"
              value={settings.metaPixelId}
              onChange={(e) => setSettings(prev => ({ ...prev, metaPixelId: e.target.value }))}
              placeholder="123456789012345"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Regional Settings */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold">Regional Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time</SelectItem>
                <SelectItem value="America/Chicago">Central Time</SelectItem>
                <SelectItem value="America/Denver">Mountain Time</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(value) => setSettings(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="defaultLanguage">Default Language</Label>
            <Select
              value={settings.defaultLanguage}
              onValueChange={(value) => setSettings(prev => ({ ...prev, defaultLanguage: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default MarketingSettings;

