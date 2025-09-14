import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Eye, Phone, MessageCircle, UserCheck, Truck, Star } from 'lucide-react';
import ChatButton from '@/components/chat/ChatButton';
import Footer from '@/components/Footer';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Safety = () => {
  const [userType, setUserType] = useState<'customer' | 'driver' | 'admin'>('customer');

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (profile?.role === 'driver') {
          setUserType('driver');
        }
      }
    };
    
    checkUserRole();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Your Safety is Our Priority</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            We're committed to providing a safe and secure experience for all our customers and drivers. 
            Learn about our safety measures and how to stay safe while using Crave'n.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Emergency Contact */}
        <Card className="mb-12 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              Emergency Situations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              If you're in immediate danger or experiencing an emergency, call 911 first. 
              Then contact our 24/7 safety line for additional support.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="destructive" size="lg">
                <Phone className="h-4 w-4 mr-2" />
                Emergency: 911
              </Button>
              <Button variant="outline" size="lg" className="border-red-300 text-red-700 hover:bg-red-50">
                <Phone className="h-4 w-4 mr-2" />
                Safety Line: 1-800-SAFE-NOW
              </Button>
              <ChatButton
                type="customer_support"
                userType={userType}
                variant="outline"
                size="lg"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Report Safety Issue
              </ChatButton>
            </div>
          </CardContent>
        </Card>

        {/* Safety Features */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Our Safety Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Eye className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Real-Time Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Track your order and driver in real-time. Share your live location with trusted contacts during delivery.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>GPS tracking for all deliveries</li>
                  <li>Share trip details with family/friends</li>
                  <li>Estimated arrival notifications</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <UserCheck className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Driver Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  All drivers undergo comprehensive background checks and vehicle inspections before joining our platform.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Background check required</li>
                  <li>Valid driver's license verification</li>
                  <li>Vehicle registration and insurance</li>
                  <li>Photo ID verification</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Star className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Rating System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Rate your experience after each delivery. We monitor ratings to ensure quality service and safety.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Two-way rating system</li>
                  <li>Quality monitoring</li>
                  <li>Safety-focused feedback</li>
                  <li>Driver performance tracking</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Safety Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Customer Safety */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Customer Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Before Ordering</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Verify your delivery address is correct</li>
                    <li>Ensure your phone number is up to date</li>
                    <li>Order from reputable restaurants</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">During Delivery</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Track your order in real-time</li>
                    <li>Verify driver details match the app</li>
                    <li>Meet the driver in a well-lit area</li>
                    <li>Don't share personal information</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">After Delivery</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Check your order immediately</li>
                    <li>Rate your experience honestly</li>
                    <li>Report any issues through the app</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Driver Safety */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-primary" />
                Driver Safety Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Before Starting</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Ensure your vehicle is in good condition</li>
                    <li>Keep your phone charged</li>
                    <li>Inform someone of your work schedule</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">During Deliveries</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Follow traffic laws and drive safely</li>
                    <li>Use contactless delivery when possible</li>
                    <li>Trust your instincts about situations</li>
                    <li>Keep car doors locked while driving</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Red Flags</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Customers asking for personal information</li>
                    <li>Unsafe delivery locations</li>
                    <li>Requests to deviate from app instructions</li>
                    <li>Suspicious behavior or threats</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reporting and Support */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-center">Report Safety Concerns</CardTitle>
            <p className="text-center text-muted-foreground">
              We take all safety concerns seriously. Multiple ways to report issues and get help.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <MessageCircle className="h-6 w-6" />
                <span className="text-sm">In-App Reporting</span>
              </Button>
              <ChatButton
                type="customer_support"
                userType={userType}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="text-sm">Live Chat</span>
              </ChatButton>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Phone className="h-6 w-6" />
                <span className="text-sm">24/7 Hotline</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Emergency Line</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Community Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Community Guidelines</CardTitle>
            <p className="text-muted-foreground">
              Help us maintain a safe and respectful community for everyone.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 text-green-700">Do</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Treat everyone with respect and kindness</li>
                  <li>Follow local traffic laws and regulations</li>
                  <li>Communicate clearly and professionally</li>
                  <li>Report suspicious or unsafe behavior</li>
                  <li>Maintain cleanliness and hygiene standards</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-red-700">Don't</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Share personal contact information</li>
                  <li>Use discriminatory or offensive language</li>
                  <li>Drive under the influence of substances</li>
                  <li>Make unauthorized stops or detours</li>
                  <li>Ignore safety protocols and guidelines</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Safety;