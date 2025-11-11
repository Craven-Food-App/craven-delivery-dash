import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  Clock, 
  Star, 
  Users, 
  MapPin, 
  Trophy,
  Gift,
  Share2,
  Target
} from 'lucide-react';

interface OnboardingTask {
  id: number;
  task_key: string;
  task_name: string;
  description: string;
  points_reward: number;
  completed: boolean;
  completed_at: string | null;
}

interface QueuePosition {
  queue_position: number;
  total_in_region: number;
  region_name: string;
}

interface DriverProgress {
  application: any;
  tasks: OnboardingTask[];
  queuePosition: QueuePosition | null;
}

export const EnhancedOnboardingDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<DriverProgress | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [completingTask, setCompletingTask] = useState<number | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    // Auto-complete tasks that were done during application
    if (progress?.application && progress.tasks.length > 0) {
      void autoCompleteApplicationTasks();
    }
  }, [progress]);

  const autoCompleteApplicationTasks = async () => {
    if (!progress) return;
    
    const { application, tasks } = progress;

    const tasksToComplete: OnboardingTask[] = [];

    const documentsTask = tasks.find((task) => task.task_key === 'upload_documents' && !task.completed);
    const hasAllDocuments =
      Boolean(application.drivers_license_front) &&
      Boolean(application.drivers_license_back) &&
      Boolean(application.insurance_document);
    if (documentsTask && hasAllDocuments) {
      tasksToComplete.push(documentsTask);
    }

    const payoutTask = tasks.find((task) => task.task_key === 'setup_cashapp_payouts' && !task.completed);
    const payoutMethod = (application.payout_method || '').toLowerCase();
    const hasCashAppDetails = payoutMethod === 'cash_app' && Boolean(application.cash_tag);
    const hasDirectDepositDetails =
      payoutMethod !== 'cash_app' &&
      Boolean(application.routing_number) &&
      Boolean(application.account_number_last_four);
    if (payoutTask && payoutMethod && (hasCashAppDetails || hasDirectDepositDetails)) {
      tasksToComplete.push(payoutTask);
    }

    const profileTask = tasks.find((task) => task.task_key === 'complete_profile' && !task.completed);
    const hasProfileBasics =
      Boolean(application.date_of_birth) &&
      Boolean(application.street_address) &&
      Boolean(application.drivers_license) &&
      Boolean(application.vehicle_make) &&
      Boolean(application.vehicle_model);
    if (profileTask && hasProfileBasics) {
      tasksToComplete.push(profileTask);
    }

    for (const task of tasksToComplete) {
      await completeTask(task.id, task.task_key);
    }
  };

  const loadProgress = async () => {
    try {
      // Get the current logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in');
        setProgress(null);
        return;
      }

      console.log('Loading progress for user:', user.id);

      // Get the user's application (get most recent one if multiple exist)
      const { data: applications, error: appError } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      
      const application = applications?.[0];
      
      console.log('Application query result:', { application, error: appError });

      if (appError) {
        console.error('Error loading application:', appError);
        toast({
          title: "Error",
          description: `Failed to load your application: ${appError.message}`,
          variant: "destructive",
        });
        setProgress(null);
        return;
      }

      if (!application) {
        console.log('No application found for user');
        toast({
          title: "Application Not Found",
          description: "Please complete your Feeder application first.",
          variant: "destructive",
        });
        setProgress(null);
        return;
      }

      // Check if driver is activated (approved + onboarding complete)
      if (application.status === 'approved' && application.onboarding_completed_at) {
        console.log('Driver is activated - redirecting to mobile dashboard');
        setIsActivated(true);
        setLoading(false);
        
        toast({
          title: "Welcome Back! 🎉",
          description: "You're activated! Redirecting to your driver dashboard...",
        });
        
        // Redirect to mobile dashboard after 2 seconds
        setTimeout(() => {
          navigate('/mobile', { replace: true });
        }, 2000);
        
        return;
      }

      // Get onboarding tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('driver_id', application.id)
        .order('created_at');

      console.log('Tasks query result:', { tasks, error: tasksError });

      // Get queue position
      const { data: queuePosition, error: queueError } = await supabase
        .rpc('get_driver_queue_position', { driver_uuid: application.id });

      console.log('Queue position query result:', { queuePosition, error: queueError });

      setProgress({
        application,
        tasks: tasks || [],
        queuePosition: queuePosition?.[0] || null
      });
    } catch (error) {
      console.error('Error loading progress:', error);
      toast({
        title: "Error",
        description: "Failed to load your progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const completeTask = async (taskId: number, taskKey: string) => {
    try {
      setCompletingTask(taskId);

      const { data, error } = await supabase.functions.invoke('complete-onboarding-task', {
        body: {
          task_id: taskId,
          driver_id: progress?.application.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Task Completed! 🎉",
        description: data.message,
      });

      // Reload progress
      await loadProgress();
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompletingTask(null);
    }
  };

  const getReferralLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or generate referral code (get most recent application)
      const { data: applications } = await supabase
        .from('craver_applications')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const application = applications?.[0];
      
      if (!application) return;

      const referralCode = `CRV${application.id.substring(0, 6).toUpperCase()}`;
      const referralLink = `${window.location.origin}/feeder?ref=${referralCode}`;
      
      await navigator.clipboard.writeText(referralLink);
      
      toast({
        title: "Referral Link Copied! 📋",
        description: "Share this link to earn bonus points when friends join!",
      });
    } catch (error) {
      console.error('Error getting referral link:', error);
      toast({
        title: "Error",
        description: "Failed to get referral link",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (isActivated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="bg-green-500 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              You're Activated! 🎉
            </h2>
            <p className="text-gray-600 mb-4">
              Congratulations! Your region is open and you're ready to deliver.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to your driver dashboard...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No application found. Please complete your driver application first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { application, tasks, queuePosition } = progress;
  const completedTasks = tasks.filter(task => task.completed).length;
  const totalTasks = tasks.length;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalPoints = application.points || 0;
  const isOnboardingComplete = !!application.onboarding_completed_at;

  const getTaskActionButton = (task: OnboardingTask) => {
    if (task.completed) return null;

    const isLoading = completingTask === task.id;

    switch (task.task_key) {
      case 'complete_profile':
        return (
          <Button
            size="sm"
            onClick={() => navigate('/enhanced-onboarding/profile')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Start Task
          </Button>
        );
      case 'upload_vehicle_photos':
        return (
          <Button
            size="sm"
            onClick={() => navigate('/enhanced-onboarding/vehicle-photos')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Upload Photos
          </Button>
        );
      case 'setup_cashapp_payouts':
        return (
          <Button
            size="sm"
            onClick={() => navigate('/enhanced-onboarding/payout')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Set Up Payout
          </Button>
        );
      case 'pass_safety_quiz':
        return (
          <Button
            size="sm"
            onClick={() => navigate('/enhanced-onboarding/safety-quiz')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Take Quiz
          </Button>
        );
      case 'upload_documents':
        // Auto-completed if documents were uploaded during application
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Auto-Checking...
          </Badge>
        );
      case 'refer_friend':
        return (
          <Button
            size="sm"
            onClick={getReferralLink}
            className="bg-purple-500 hover:bg-purple-600"
          >
            Get Referral Link
          </Button>
        );
      case 'download_mobile_app':
      case 'join_facebook_group':
      case 'complete_service_training':
        return (
          <Button
            size="sm"
            onClick={() => completeTask(task.id, task.task_key)}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600"
          >
            {isLoading ? 'Processing...' : "I've Done This"}
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => completeTask(task.id, task.task_key)}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? 'Processing...' : 'Start Task'}
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Crave'n, {application.first_name}! 🚗
          </h1>
          <p className="text-gray-600">
            Complete your onboarding to move up in the queue and start earning sooner!
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Queue Position */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Queue Position</p>
                  <p className="text-2xl font-bold text-orange-600">
                    #{queuePosition?.queue_position || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    of {queuePosition?.total_in_region || 0} in {queuePosition?.region_name || 'your region'}
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          {/* Points */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Points</p>
                  <p className="text-2xl font-bold text-green-600">{totalPoints}</p>
                  <p className="text-xs text-gray-500">Earn more to move up!</p>
                </div>
                <Star className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Onboarding Progress</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {completedTasks}/{totalTasks}
                  </p>
                  <p className="text-xs text-gray-500">Tasks completed</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Congratulations Message */}
        {isOnboardingComplete && application.status === 'approved' && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    🎉 You're Activated!
                  </h3>
                  <p className="text-green-800 mb-3">
                    Your region is open! You can now start accepting deliveries.
                  </p>
                  <Button 
                    onClick={() => navigate('/mobile')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Driver Dashboard →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {isOnboardingComplete && application.status !== 'approved' && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    🎉 Congratulations! Onboarding Complete!
                  </h3>
                  <p className="text-green-800 mb-3">
                    You've completed all onboarding tasks! You're now in position <span className="font-bold">#{queuePosition?.queue_position || 'N/A'}</span> in the waitlist for <span className="font-bold">{queuePosition?.region_name}</span>.
                  </p>
                  <p className="text-green-700 text-sm">
                    ✉️ We'll email you when your region opens up and you're activated as a driver. Stay tuned!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Onboarding Progress</h3>
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  {Math.round(progressPercentage)}% Complete
                </Badge>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-sm text-gray-600">
                {isOnboardingComplete 
                  ? 'All tasks complete! You\'re in the waitlist queue.'
                  : 'Complete all tasks to maximize your priority score and move up in the queue!'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Onboarding Tasks
            </CardTitle>
            <p className="text-sm text-gray-600">
              Complete these tasks to earn points and improve your queue position
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  task.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <h4 className="font-medium">{task.task_name}</h4>
                    <p className="text-sm text-gray-600">{task.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-orange-600">
                    +{task.points_reward} pts
                  </Badge>
                  {task.completed ? (
                    <Badge variant="default" className="bg-green-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Complete
                    </Badge>
                  ) : (
                    getTaskActionButton(task)
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Referral Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-purple-500" />
              Refer Friends & Earn Bonus Points
            </CardTitle>
            <p className="text-sm text-gray-600">
              Share your referral link to earn 50 bonus points for each friend who joins!
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={getReferralLink}
                className="bg-purple-500 hover:bg-purple-600"
                size="lg"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Get Referral Link
              </Button>
              <div className="text-sm text-gray-600">
                <p>• Earn 50 points per referral</p>
                <p>• Move up in the queue faster</p>
                <p>• Help friends join Crave'n!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Region Status */}
        {queuePosition && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Your Region Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">{queuePosition.region_name}</h4>
                  <p className="text-sm text-gray-600">
                    You're #{queuePosition.queue_position} of {queuePosition.total_in_region} drivers
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Priority Score</h4>
                  <p className="text-sm text-gray-600">
                    {application.priority_score || 0} points
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">1</span>
                </div>
                <p className="text-sm">Complete all onboarding tasks to maximize your points</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">2</span>
                </div>
                <p className="text-sm">Share your referral link to earn bonus points</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">3</span>
                </div>
                <p className="text-sm">Wait for activation when your region opens up</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-sm font-medium text-green-700">
                  You'll receive an email when it's time to activate your account!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};
