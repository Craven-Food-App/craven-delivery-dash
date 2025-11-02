import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Building2 } from 'lucide-react';
import cravenLogo from "@/assets/craven-logo.png";

const BusinessAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get redirect parameter from URL
    const getRedirectPath = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      return redirect || '/hub';
    };

    // Check if user is already signed in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Redirect to hub or specified redirect path
        const redirectPath = getRedirectPath();
        window.location.href = redirectPath;
      }
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          toast({
            title: "Welcome!",
            description: "You've been signed in successfully.",
          });
          // Redirect to hub or specified redirect path
          const redirectPath = getRedirectPath();
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 1000);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
        throw error;
      }

      if (data.user) {
        toast({
          title: "Success!",
          description: "Signing you in...",
        });
        // Get redirect parameter and redirect
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '/hub';
        setTimeout(() => {
          window.location.href = redirect;
        }, 1000);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign In Failed",
        description: error.message || 'An error occurred during sign in',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#ff7a45]" />
          <p className="text-gray-600">Redirecting to portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <img src={cravenLogo} alt="Crave'N" className="h-12" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-[#ff7a45]" />
            <CardTitle className="text-2xl font-bold text-gray-900">Company Portal Access</CardTitle>
          </div>
          <CardDescription className="text-gray-600">
            Authorized employees only. Sign in with your company credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="employee@cravenusa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="h-11 border-gray-300 focus:border-[#ff7a45] focus:ring-[#ff7a45]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="h-11 border-gray-300 focus:border-[#ff7a45] focus:ring-[#ff7a45]"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#ff7a45] hover:bg-[#ff5a1f] text-white font-semibold" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In to Portal'
              )}
            </Button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This portal is restricted to authorized employees only.<br />
              If you need access, please contact your HR department.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessAuth;

