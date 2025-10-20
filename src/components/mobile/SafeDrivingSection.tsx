import React, { useState } from 'react';
import { ArrowLeft, Shield, Phone, AlertTriangle, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SafeDrivingSectionProps {
  onBack: () => void;
}

export const SafeDrivingSection: React.FC<SafeDrivingSectionProps> = ({ onBack }) => {
  const [safetySettings, setSafetySettings] = useState({
    drivingModeEnabled: true,
    speedAlerts: true,
    breakReminders: false,
    emergencyContacts: true,
    crashDetection: true,
    nightModeAlerts: true
  });
  const { toast } = useToast();

  const handleSettingChange = (key: keyof typeof safetySettings, value: boolean) => {
    setSafetySettings(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Safety setting updated",
      description: "Your driving safety preference has been saved."
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 overflow-y-auto">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-background border-b border-border/50 px-4 py-3 sticky top-0 z-10 safe-area-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Safe Driving Features</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Safety Overview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-green-500" />
                <div>
                  <h3 className="font-semibold text-foreground">Your Safety Score</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-500">94</span>
                    <span className="text-sm text-muted-foreground">Excellent Driver</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driving Mode */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Driving Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Auto-Enable Driving Mode</div>
                  <div className="text-sm text-muted-foreground">Silences calls and notifications while driving</div>
                </div>
                <Switch
                  checked={safetySettings.drivingModeEnabled}
                  onCheckedChange={(checked) => handleSettingChange('drivingModeEnabled', checked)}
                />
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                Emergency calls will still come through when driving mode is active.
              </div>
            </CardContent>
          </Card>

          {/* Speed & Alerts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Speed & Safety Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Speed Limit Alerts</div>
                  <div className="text-sm text-muted-foreground">Get notified when exceeding speed limits</div>
                </div>
                <Switch
                  checked={safetySettings.speedAlerts}
                  onCheckedChange={(checked) => handleSettingChange('speedAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Night Driving Alerts</div>
                  <div className="text-sm text-muted-foreground">Extra caution reminders for night deliveries</div>
                </div>
                <Switch
                  checked={safetySettings.nightModeAlerts}
                  onCheckedChange={(checked) => handleSettingChange('nightModeAlerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Break Reminders</div>
                  <div className="text-sm text-muted-foreground">Suggests breaks after long driving periods</div>
                </div>
                <Switch
                  checked={safetySettings.breakReminders}
                  onCheckedChange={(checked) => handleSettingChange('breakReminders', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Features */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Emergency Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Crash Detection</div>
                  <div className="text-sm text-muted-foreground">Auto-alerts emergency contacts if crash detected</div>
                </div>
                <Switch
                  checked={safetySettings.crashDetection}
                  onCheckedChange={(checked) => handleSettingChange('crashDetection', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Emergency Contacts</div>
                  <div className="text-sm text-muted-foreground">Share location with trusted contacts while driving</div>
                </div>
                <Switch
                  checked={safetySettings.emergencyContacts}
                  onCheckedChange={(checked) => handleSettingChange('emergencyContacts', checked)}
                />
              </div>

              <Button variant="outline" className="w-full">
                Manage Emergency Contacts
              </Button>
            </CardContent>
          </Card>

          {/* Safety Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Safety Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Take regular breaks every 2 hours during long delivery sessions</span>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Never use your phone while driving - pull over safely if needed</span>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Always wear a seatbelt and ensure your vehicle is properly maintained</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Check weather conditions and adjust driving accordingly</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Button */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <Button 
                variant="destructive" 
                className="w-full bg-red-600 hover:bg-red-700"
                size="lg"
              >
                🚨 Emergency - Call 911
              </Button>
              <p className="text-xs text-center mt-2 text-red-600 dark:text-red-400">
                Only use in real emergencies
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};