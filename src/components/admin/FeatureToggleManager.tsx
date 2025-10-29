// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, Save } from 'lucide-react';

export const FeatureToggleManager: React.FC = () => {
  const [restaurantsVisible, setRestaurantsVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'feature_restaurants_visible')
        .single();

      if (error) throw error;

      if (data?.setting_value) {
        setRestaurantsVisible(data.setting_value.enabled === true);
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load feature settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: {
            enabled: restaurantsVisible
          },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('setting_key', 'feature_restaurants_visible');

      if (error) throw error;

      toast.success('Feature toggle updated successfully');
    } catch (error) {
      console.error('Error saving feature toggle:', error);
      toast.error('Failed to save feature toggle');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading feature toggles...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Feature Toggles
        </CardTitle>
        <CardDescription>
          Control which features are visible to users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Restaurants Page Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="restaurants-toggle" className="text-base font-medium">
              Restaurants Page
            </Label>
            <p className="text-sm text-muted-foreground">
              Show or hide the restaurants page from navigation menus
            </p>
          </div>
          <Switch
            id="restaurants-toggle"
            checked={restaurantsVisible}
            onCheckedChange={setRestaurantsVisible}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
          {restaurantsVisible ? (
            <>
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm">Restaurants page is <strong>visible</strong> to users</span>
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Restaurants page is <strong>hidden</strong> from users</span>
            </>
          )}
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

