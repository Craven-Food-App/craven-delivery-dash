import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Store, 
  Truck, 
  Building, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Star,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail
} from 'lucide-react';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PartnerWithUs = () => {
  const [selectedTab, setSelectedTab] = useState('restaurant');
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    partnershipType: '',
    businessType: '',
    location: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Create a partnership inquiry conversation
      const conversationData = {
        type: 'customer_support' as const,
        status: 'active' as const,
        priority: 'high' as const,
        subject: `Partnership Inquiry - ${formData.partnershipType}`,
        metadata: {
          source: 'partnership_form',
          partnership_type: formData.partnershipType,
          business_name: formData.businessName,
          contact_name: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          business_type: formData.businessType,
          location: formData.location,
        }
      };

      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert(conversationData)
        .select()
        .single();

      if (convError) throw convError;

      // Add the initial message
      const messageContent = `
Partnership Inquiry

Business Name: ${formData.businessName}
Contact Person: ${formData.contactName}
Email: ${formData.email}
Phone: ${formData.phone}
Partnership Type: ${formData.partnershipType}
Business Type: ${formData.businessType}
Location: ${formData.location}

Message:
${formData.message}
      `.trim();

      const messageData = {
        conversation_id: conversation.id,
        sender_type: 'customer' as const,
        content: messageContent,
        message_type: 'text' as const,
      };

      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert(messageData);

      if (msgError) throw msgError;

      toast({
        title: "Partnership Inquiry Submitted!",
        description: "We've received your partnership request and will contact you within 2 business days.",
      });

      // Reset form
      setFormData({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        partnershipType: '',
        businessType: '',
        location: '',
        message: '',
      });

    } catch (error) {
      console.error('Error submitting partnership form:', error);
      toast({
        title: "Error",
        description: "Failed to submit partnership inquiry. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <Building className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Partner With Crave'n</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Join our growing network of restaurants, drivers, and businesses. 
            Together, we're revolutionizing food delivery and creating opportunities for everyone.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Partnership Types */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="restaurant" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Restaurants
            </TabsTrigger>
            <TabsTrigger value="driver" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="enterprise" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Enterprise
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurant" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Restaurant Partnership</h2>
              <p className="text-xl text-muted-foreground">
                Expand your reach and grow your business with Crave'n
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <TrendingUp className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Increase Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Reach new customers and increase order volume with our growing user base
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Easy Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Streamlined dashboard to manage orders, menu, and customer feedback
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Competitive Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Industry-leading commission rates and transparent pricing structure
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Restaurant Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>No setup fees or monthly charges</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Real-time order management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Professional photography support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Marketing and promotional tools</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Analytics and insights dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Customer review management</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Dedicated account manager</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Fast and reliable payments</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="driver" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Become a Driver</h2>
              <p className="text-xl text-muted-foreground">
                Earn money on your schedule with flexible delivery opportunities
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Flexible Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Work when you want, where you want. Complete control over your schedule
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <DollarSign className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Competitive Pay</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Earn competitive rates plus tips. Weekly payments directly to your account
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Star className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Driver Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    24/7 driver support and comprehensive safety features for peace of mind
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Driver Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Basic Requirements</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>18+ years old</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Valid driver's license</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Auto insurance</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Reliable vehicle</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">What We Provide</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Delivery bag and equipment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Background check processing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Training and onboarding</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>24/7 support and safety features</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enterprise" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Enterprise Solutions</h2>
              <p className="text-xl text-muted-foreground">
                Custom delivery solutions for businesses, events, and organizations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Corporate Catering</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Large-scale catering solutions for corporate events, meetings, and office dining
                  </p>
                  <Badge variant="secondary">Custom Pricing</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>White Label Solutions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Custom-branded delivery platform for your business with full integration support
                  </p>
                  <Badge variant="secondary">Enterprise Only</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Integrate our delivery network into your existing systems and applications
                  </p>
                  <Badge variant="secondary">Developer Friendly</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Event Partnerships</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Partner with us for festivals, conferences, and large-scale events
                  </p>
                  <Badge variant="secondary">Event Specific</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Partnership Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Start Your Partnership Journey</CardTitle>
            <p className="text-muted-foreground">
              Tell us about your business and we'll get back to you within 2 business days
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Name *</label>
                  <Input
                    value={formData.businessName}
                    onChange={(e) => handleInputChange('businessName', e.target.value)}
                    placeholder="Your business name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contact Name *</label>
                  <Input
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="business@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone *</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Partnership Type *</label>
                  <Select value={formData.partnershipType} onValueChange={(value) => handleInputChange('partnershipType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select partnership type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant Partner</SelectItem>
                      <SelectItem value="driver">Delivery Driver</SelectItem>
                      <SelectItem value="corporate-catering">Corporate Catering</SelectItem>
                      <SelectItem value="white-label">White Label Solution</SelectItem>
                      <SelectItem value="api-integration">API Integration</SelectItem>
                      <SelectItem value="event-partnership">Event Partnership</SelectItem>
                      <SelectItem value="franchise">Franchise Opportunity</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Business Type</label>
                  <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="food-truck">Food Truck</SelectItem>
                      <SelectItem value="catering">Catering Company</SelectItem>
                      <SelectItem value="ghost-kitchen">Ghost Kitchen</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, State"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tell us about your business *</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Describe your business, goals, and what you're looking for in a partnership..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <>
                    Submit Partnership Request
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Have Questions?</h3>
          <p className="text-muted-foreground mb-6">
            Our partnership team is here to help you get started
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call Partnership Team
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              partners@craven.com
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PartnerWithUs;