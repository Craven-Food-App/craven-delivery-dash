import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LogIn, User, Lock, Loader2 } from 'lucide-react';
// Import the background image
import hubBackgroundImage from '@/assets/hub_background.png';

const BusinessAuth: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  // Get redirect parameter from URL
  const getRedirectPath = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    return redirect || '/hub';
  };

  // Check if user is already signed in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
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
          const redirectPath = getRedirectPath();
          setTimeout(() => {
            window.location.href = redirectPath;
          }, 1000);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);


  // --- Login Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
        throw authError;
      }

      if (data.user) {
        toast({
          title: "Success!",
          description: "Signing you in...",
        });
        const redirectPath = getRedirectPath();
        // Use relative path to stay on current domain (important for hq.cravenusa.com)
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      setError(error.message || 'An error occurred during sign in');
      toast({
        title: "Sign In Failed",
        description: error.message || 'An error occurred during sign in',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="text-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-4 text-[#ff7a45]" />
          <p className="text-sm sm:text-base text-gray-400">Redirecting to portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-gray-900 overflow-hidden">
      {/* Background Container - Using static image */}
      <div className="absolute inset-0 w-full h-full">
        <div
          className="w-full h-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${hubBackgroundImage})`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
        />
      </div>

      {/* Login Form Container (Overlay) */}
      <div className="relative z-10 w-full max-w-md mx-auto px-3 sm:px-4 lg:ml-[200px] xl:ml-[300px] lg:mr-auto">
        <div 
          className="p-5 sm:p-6 md:p-8 lg:p-10 rounded-xl shadow-2xl border-t-4 border-[#ff7a45]"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 122, 69, 0.3)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <div className="inline-block p-2 sm:p-3 rounded-full bg-[#ff7a45] shadow-lg mb-2 sm:mb-3 md:mb-4">
              <LogIn className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
              CRAVE'N BUSINESS
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Partner Portal Access
            </p>
          </div>

          {error && (
            <div 
              className="mb-4 p-2.5 sm:p-3 rounded-lg border"
              style={{
                background: 'rgba(220, 38, 38, 0.2)',
                borderColor: 'rgba(220, 38, 38, 0.4)',
              }}
            >
              <p className="text-xs sm:text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 sm:pl-3 pointer-events-none">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border rounded-lg focus:ring-[#ff7a45] focus:border-[#ff7a45] transition duration-150 text-white placeholder:text-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 sm:pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-8 sm:pl-9 md:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border rounded-lg focus:ring-[#ff7a45] focus:border-[#ff7a45] transition duration-150 text-white placeholder:text-gray-400"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  }}
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loading || !!error}
              className={`w-full flex justify-center items-center py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 border border-transparent rounded-lg text-white text-sm sm:text-base font-semibold shadow-lg transition duration-200 ease-in-out
                ${isSubmitting || loading || !!error
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#ff7a45] hover:bg-[#ff5a1f] focus:outline-none focus:ring-4 focus:ring-[#ff7a45] focus:ring-opacity-50 transform hover:scale-[1.01] active:scale-[0.98]'
                }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-3 sm:mt-4 md:mt-6 text-center text-xs sm:text-sm">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                toast({
                  title: "Password Reset",
                  description: "Please contact your HR department for password reset assistance.",
                });
              }}
              className="font-medium text-[#ff7a45] hover:text-[#ff9c6e] transition duration-150 block sm:inline"
            >
              Forgot Password?
            </a>
            <span className="mx-2 text-gray-400 hidden sm:inline">|</span>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                toast({
                  title: "Support",
                  description: "Contact IT support at support@cravenusa.com",
                });
              }}
              className="font-medium text-gray-300 hover:text-[#ff7a45] transition duration-150 block sm:inline mt-2 sm:mt-0"
            >
              Need Support?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessAuth;
