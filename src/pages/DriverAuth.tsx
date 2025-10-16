import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, Car } from "lucide-react";

const DriverAuth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if they're an approved craver
        const { data: application } = await supabase
          .from('craver_applications')
          .select('status')
          .eq('user_id', session.user.id)
          .eq('status', 'approved')
          .single();
        
        if (application) {
          navigate('/mobile');
        } else {
          navigate('/craver-hub');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if they're an approved craver after login
      const { data: application } = await supabase
        .from('craver_applications')
        .select('status')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'approved')
        .single();
      
      if (application) {
        navigate('/mobile');
      } else {
        navigate('/craver-hub');
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your driver account.",
      });
    } catch (error: any) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRedirect = () => {
    navigate('/craver-hub');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Truck className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Craven Delivery</h1>
          </div>
          <p className="text-muted-foreground">Driver Portal</p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Driver Access
            </CardTitle>
            <CardDescription>
              Sign in to start earning or apply to become a driver
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    New to Crave'n?
                  </span>
                </div>
              </div>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full" 
                onClick={handleApplyRedirect}
              >
                Apply to Become a Driver
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Your account will be created when you submit your application
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Back to main */}
        <div className="text-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground"
          >
            ← Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriverAuth;