import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Settings, DollarSign, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ReferralSettingsManager() {
  const [selectedType, setSelectedType] = useState<'customer' | 'driver' | 'restaurant'>('driver');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [selectedType]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('referral_type', selectedType)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data);
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          referral_type: selectedType,
          referrer_bonus_amount: selectedType === 'driver' ? 40000 : 1000,
          referred_bonus_amount: selectedType === 'driver' ? 0 : 1000,
          requirements: selectedType === 'driver' 
            ? { min_deliveries: 20 }
            : { min_orders: 1, min_amount: 1500 },
          is_active: true,
          milestone_1_amount_cents: selectedType === 'driver' ? 10000 : null,
          milestone_2_amount_cents: selectedType === 'driver' ? 30000 : null,
          milestone_1_delivery_count: selectedType === 'driver' ? 1 : null,
          milestone_2_delivery_count: selectedType === 'driver' ? 20 : null,
          require_background_check: selectedType === 'driver' ? true : false,
          require_documents: selectedType === 'driver' ? true : false,
          required_min_rating: selectedType === 'driver' ? 4.5 : null,
          required_days_active: selectedType === 'driver' ? 7 : null,
        };

        const { data: newSettings, error: insertError } = await supabase
          .from('referral_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('referral_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('referral_type', selectedType);

      if (error) throw error;
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Referral Program Settings
              </CardTitle>
              <CardDescription className="mt-1">
                Configure referral bonuses and requirements for each user type
              </CardDescription>
            </div>
            <Select value={selectedType} onValueChange={(v: any) => setSelectedType(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Referrer Bonus Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(settings.referrer_bonus_amount / 100).toFixed(2)}
                  onChange={(e) => setSettings({
                    ...settings,
                    referrer_bonus_amount: Math.round(parseFloat(e.target.value) * 100)
                  })}
                />
              </div>

              <div>
                <Label>Referred Bonus Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={(settings.referred_bonus_amount / 100).toFixed(2)}
                  onChange={(e) => setSettings({
                    ...settings,
                    referred_bonus_amount: Math.round(parseFloat(e.target.value) * 100)
                  })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Program Active</Label>
                <p className="text-sm text-gray-500">Enable or disable this referral program</p>
              </div>
              <Switch
                checked={settings.is_active}
                onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
              />
            </div>
          </div>

          {/* Driver-Specific Milestone Settings */}
          {selectedType === 'driver' && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Milestone Settings
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Milestone 1 Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={((settings.milestone_1_amount_cents || 10000) / 100).toFixed(2)}
                    onChange={(e) => setSettings({
                      ...settings,
                      milestone_1_amount_cents: Math.round(parseFloat(e.target.value) * 100)
                    })}
                  />
                </div>

                <div>
                  <Label>Milestone 1 Delivery Count</Label>
                  <Input
                    type="number"
                    value={settings.milestone_1_delivery_count || 1}
                    onChange={(e) => setSettings({
                      ...settings,
                      milestone_1_delivery_count: parseInt(e.target.value) || 1
                    })}
                  />
                </div>

                <div>
                  <Label>Milestone 2 Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={((settings.milestone_2_amount_cents || 30000) / 100).toFixed(2)}
                    onChange={(e) => setSettings({
                      ...settings,
                      milestone_2_amount_cents: Math.round(parseFloat(e.target.value) * 100)
                    })}
                  />
                </div>

                <div>
                  <Label>Milestone 2 Delivery Count</Label>
                  <Input
                    type="number"
                    value={settings.milestone_2_delivery_count || 20}
                    onChange={(e) => setSettings({
                      ...settings,
                      milestone_2_delivery_count: parseInt(e.target.value) || 20
                    })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Driver-Specific Requirements */}
          {selectedType === 'driver' && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Requirements
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Required Minimum Rating</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={settings.required_min_rating || 4.5}
                    onChange={(e) => setSettings({
                      ...settings,
                      required_min_rating: parseFloat(e.target.value) || 4.5
                    })}
                  />
                </div>

                <div>
                  <Label>Required Days Active</Label>
                  <Input
                    type="number"
                    value={settings.required_days_active || 7}
                    onChange={(e) => setSettings({
                      ...settings,
                      required_days_active: parseInt(e.target.value) || 7
                    })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Background Check</Label>
                    <p className="text-sm text-gray-500">Referred driver must pass background check</p>
                  </div>
                  <Switch
                    checked={settings.require_background_check || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, require_background_check: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Documents</Label>
                    <p className="text-sm text-gray-500">Referred driver must upload all required documents</p>
                  </div>
                  <Switch
                    checked={settings.require_documents || false}
                    onCheckedChange={(checked) => setSettings({ ...settings, require_documents: checked })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer/Restaurant Requirements */}
          {(selectedType === 'customer' || selectedType === 'restaurant') && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Requirements</h3>
              <div className="text-sm text-gray-600">
                <p>Requirements are stored in the requirements JSONB field.</p>
                <p className="mt-2">For customers: min_orders, min_amount</p>
                <p>For restaurants: min_orders, min_revenue</p>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Referrer Bonus:</span>
              <span className="font-semibold">${(settings.referrer_bonus_amount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Referred Bonus:</span>
              <span className="font-semibold">${(settings.referred_bonus_amount / 100).toFixed(2)}</span>
            </div>
            {selectedType === 'driver' && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Milestone 1 ({settings.milestone_1_delivery_count || 1} delivery):</span>
                  <span className="font-semibold">${((settings.milestone_1_amount_cents || 10000) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Milestone 2 ({settings.milestone_2_delivery_count || 20} deliveries):</span>
                  <span className="font-semibold">${((settings.milestone_2_amount_cents || 30000) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600 font-semibold">Total Per Driver:</span>
                  <span className="font-bold text-lg text-green-600">
                    ${(((settings.milestone_1_amount_cents || 10000) + (settings.milestone_2_amount_cents || 30000)) / 100).toFixed(2)}
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-600">Status:</span>
              <Badge variant={settings.is_active ? 'default' : 'secondary'}>
                {settings.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

