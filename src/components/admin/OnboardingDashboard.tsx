import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingProgress {
  id: string;
  user_id: string;
  application_id: string;
  current_step: string;
  profile_creation_completed: boolean;
  orientation_video_watched: boolean;
  safety_quiz_passed: boolean;
  payment_method_added: boolean;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
  user_profiles?: {
    full_name: string;
    phone: string;
  };
}

const OnboardingDashboard: React.FC = () => {
  const [onboardingData, setOnboardingData] = useState<OnboardingProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOnboardingData();

    // Set up realtime subscription
    const channel = supabase
      .channel('onboarding-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_onboarding_progress'
        },
        () => {
          fetchOnboardingData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOnboardingData = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_onboarding_progress')
        .select(`
          *,
          user_profiles (
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOnboardingData((data || []) as any);
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (progress: OnboardingProgress): number => {
    let completed = 0;
    const total = 5;

    if (progress.profile_creation_completed) completed++;
    if (progress.orientation_video_watched) completed++;
    if (progress.safety_quiz_passed) completed++;
    if (progress.payment_method_added) completed++;
    if (progress.onboarding_completed_at) completed++;

    return Math.round((completed / total) * 100);
  };

  const getStatusBadge = (progress: OnboardingProgress) => {
    if (progress.onboarding_completed_at) {
      return <Badge className="bg-green-600">Completed</Badge>;
    }

    const progressPercent = calculateProgress(progress);
    
    if (progressPercent === 0) {
      return <Badge variant="secondary">Not Started</Badge>;
    }
    
    if (progressPercent < 100) {
      return <Badge className="bg-orange-600">In Progress</Badge>;
    }
    
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const sendReminder = async (userId: string) => {
    try {
      // Here you would call an edge function to send email
      toast({
        title: "Reminder Sent",
        description: "Driver has been reminded to complete onboarding.",
      });
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder.",
        variant: "destructive",
      });
    }
  };

  const incompleteOnboarding = onboardingData.filter(d => !d.onboarding_completed_at);
  const completedOnboarding = onboardingData.filter(d => d.onboarding_completed_at);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Driver Onboarding</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{incompleteOnboarding.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOnboarding.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onboardingData.length > 0 
                ? Math.round((completedOnboarding.length / onboardingData.length) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Onboarding Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {onboardingData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No drivers in onboarding yet
                </div>
              ) : (
                onboardingData.map((progress) => {
                  const progressPercent = calculateProgress(progress);
                  const userProfile = Array.isArray(progress.user_profiles) 
                    ? progress.user_profiles[0] 
                    : progress.user_profiles;

                  return (
                    <Card key={progress.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">
                            {userProfile?.full_name || 'Driver'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {userProfile?.phone || 'No phone'}
                          </p>
                        </div>
                        {getStatusBadge(progress)}
                      </div>

                      <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="flex items-center gap-1">
                          {progress.profile_creation_completed ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>Profile Created</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {progress.orientation_video_watched ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>Orientation</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {progress.payment_method_added ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>Payment Method</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {progress.safety_quiz_passed ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span>Safety Quiz</span>
                        </div>
                      </div>

                      {!progress.onboarding_completed_at && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendReminder(progress.user_id)}
                          className="w-full"
                        >
                          <Mail className="h-3 w-3 mr-2" />
                          Send Reminder
                        </Button>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Started: {new Date(progress.created_at).toLocaleDateString()}
                      </p>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingDashboard;