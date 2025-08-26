import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Car, Shield, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MobileDriverDashboard } from './MobileDriverDashboard';

interface AuthUser {
  id: string;
  email: string;
}

export const MobileAuthFlow: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [showCraverInfo, setShowCraverInfo] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || ''
          });
          checkCraverStatus(session.user.id);
        } else {
          setUser(null);
          setIsApproved(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || ''
      });
      checkCraverStatus(session.user.id);
    } else {
      setLoading(false);
    }
  };

  const checkCraverStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('craver_applications')
      .select('status')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .single();

    setIsApproved(!error && data?.status === 'approved');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/craver/mobile`
          }
        });
        
        if (error) throw error;
        
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsApproved(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and approved - show dashboard
  if (user && isApproved) {
    return <MobileDriverDashboard />;
  }

  // User is authenticated but not approved - show application status
  if (user && isApproved === false) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col justify-center">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center">
            <Car className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Application Pending</h1>
            <p className="text-muted-foreground mb-6">
              Your Craver application is being reviewed. You'll receive an email when approved.
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowCraverInfo(true)}
            >
              Learn More About Being a Craver
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show Craver information screen
  if (showCraverInfo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background border-b p-4 flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowCraverInfo(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Become a Craver</h1>
        </div>
        
        <div className="p-4 space-y-6">
          <div className="text-center">
            <Car className="h-16 w-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Join the Craver Community</h2>
            <p className="text-muted-foreground">
              Deliver food, earn money, and make a difference in your community.
            </p>
          </div>
          
          <div className="grid gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Earn on Your Schedule</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Make $15-25/hour during peak times. Work when you want.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Flexible Hours</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full-time or part-time. You control when and where you deliver.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Insurance Coverage</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stay protected with comprehensive coverage while delivering.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full h-12"
              onClick={() => window.location.href = '/craver'}
            >
              Apply to Become a Craver
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Application takes less than 5 minutes
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - show login/signup
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="text-center pt-16 pb-8">
          <Car className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Craver Mobile</h1>
          <p className="text-muted-foreground px-4">
            Sign in to start earning or apply to become a Craver
          </p>
        </div>
        
        {/* Auth Form */}
        <div className="flex-1 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <Tabs value={isSignUp ? "signup" : "signin"} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger 
                    value="signin" 
                    onClick={() => setIsSignUp(false)}
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    onClick={() => setIsSignUp(true)}
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="mt-4">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to access your Craver dashboard
                  </CardDescription>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-4">
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    Create an account to apply as a Craver
                  </CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12"
                  disabled={authLoading}
                >
                  {authLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        
        {/* CTA Section */}
        <div className="p-4 pb-8">
          <div className="max-w-md mx-auto text-center space-y-4">
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-2">New to Craver?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Join thousands earning money delivering food on their schedule
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowCraverInfo(true)}
              >
                Learn About Becoming a Craver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};