import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const CommercePlatformDashboard = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      brand: "Tomato Grill",
      title: "How Tomato Grill increased digital orders by 47% from loyalty members",
      description: "Overtown has always been a great partner helping us evolve our technology to support our growth and development. The mobile app has boosted order volume and achieved an estimated 9% of Tomato Grill's revenue efficiently.",
      author: "Rya Hiatt",
      role: "CEO",
      image: "/placeholder.svg"
    },
    {
      brand: "Taqueria Arandas",
      title: "How Taqueria Arandas increased its total Online Ordering sales by 150%",
      description: "Adding the ability to see and edit their Online Ordering sales in one place allows our team to offer better service and access to the latest online ordering and sales technology. In fact, customers now prefer to order from Online Ordering and sales technology rather than calling the store.",
      author: "Saul Corona",
      role: "Director of Operations",
      image: "/placeholder.svg"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="w-full h-full bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Commerce Platform</h1>
          
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="packages">Growth packages</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-12">
              {/* Banner */}
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-4 flex items-center justify-between">
                <p className="text-sm text-foreground">
                  📋 We are reviewing your menu submission and will get back to you within 2 business days.
                </p>
                <Button variant="link" className="text-primary">
                  View Submission Status
                </Button>
              </div>

              {/* Hero Section */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    Get listed on Marketplace, and get commission-free* orders on your own channels
                  </h2>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Get new customers without the commission fees</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Get free commission-free Online Ordering on your own channels</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Turn RSVP into a pre-order, through your social media</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Connect with advanced features network</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm">Get a marketing budget to reach new customers with ads, unlimited marketing credits</p>
                    </div>
                  </div>

                  <Button className="bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white">
                    Request Online Ordering demo
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    *Pricing info: $0/mo per store commission-free via online; $0/mo per store commission via offline
                  </p>
                </div>

                <div className="relative">
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-8 h-96 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-64 h-64 bg-white rounded-lg shadow-lg mx-auto flex items-center justify-center">
                        <div className="space-y-2">
                          <div className="w-48 h-32 bg-gray-200 rounded mx-auto"></div>
                          <div className="space-y-1">
                            <div className="w-40 h-3 bg-gray-300 rounded mx-auto"></div>
                            <div className="w-32 h-3 bg-gray-200 rounded mx-auto"></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">Platform Preview</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Proof Section */}
              <div className="space-y-8 pt-8 border-t">
                <h2 className="text-3xl font-bold text-center">
                  Join the thousands of businesses that<br />grow with Commerce Platform
                </h2>

                {/* Brand Logos */}
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-8">
                  <div className="text-2xl font-bold text-muted-foreground">MAGNOLIA BAKERY</div>
                  <div className="text-2xl font-bold text-muted-foreground">goodwin</div>
                  <div className="text-2xl font-bold text-muted-foreground">HeyJoe</div>
                  <div className="text-2xl font-bold text-muted-foreground">BAN BAN DYNASTY</div>
                  <div className="text-2xl font-bold text-muted-foreground italic">Levain BAKERY</div>
                </div>

                {/* Testimonials Carousel */}
                <div className="relative">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevTestimonial}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div className="max-w-4xl mx-auto px-12">
                      <Card className="bg-gradient-to-br from-green-50 to-green-100">
                        <CardContent className="p-8">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4">
                              <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
                                <p className="text-muted-foreground">Success Story Image</p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-xl font-bold text-primary">
                                {testimonials[currentTestimonial].title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {testimonials[currentTestimonial].description}
                              </p>
                              <div>
                                <div className="font-semibold">{testimonials[currentTestimonial].author}</div>
                                <div className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                              </div>
                              <Button variant="link" className="p-0 h-auto text-primary">
                                Read success story →
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextTestimonial}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentTestimonial ? "bg-primary w-8" : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Features Section */}
              <div className="space-y-8 pt-8 border-t">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold">Features that help your business thrive</h2>
                  <p className="text-muted-foreground">
                    Commerce Platform brings together a power set of tools to get more out of new and repeat orders from loyal customers and new fans
                  </p>
                </div>

                {/* Feature 1: Grow direct sales */}
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg h-64"></div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Grow direct sales with Online Ordering</h3>
                    <p className="text-muted-foreground">
                      A beautiful and easy-to-use online ordering platform built for restaurants. Offer customers the convenience they want with a fully integrated online ordering system that streamlines your operation. <a href="#" className="text-primary underline">Learn more</a>
                    </p>
                  </div>
                </div>

                {/* Feature 2: Mobile app */}
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1 space-y-4">
                    <h3 className="text-2xl font-bold">Get your own mobile app and meet customers where they are - on their phones</h3>
                    <p className="text-muted-foreground">
                      Customers in the US order from mobile phones 60% of the time and increasingly want to order from their phone. When you choose to build a mobile app alongside your online ordering website, you're meeting consumers' preference for the mobile experience.
                    </p>
                    <Button variant="link" className="p-0 text-primary">Learn more →</Button>
                  </div>
                  <div className="order-1 md:order-2 bg-gradient-to-br from-orange-400 via-orange-300 to-purple-400 rounded-lg h-64"></div>
                </div>

                {/* Feature 3: Direct marketing */}
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-lg h-48"></div>
                    <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg h-48"></div>
                    <div className="bg-gradient-to-br from-purple-300 to-purple-400 rounded-lg h-48"></div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Increase customer engagement and drive reorders with direct marketing</h3>
                    <p className="text-muted-foreground">
                      Keep customers coming back with email marketing campaigns and automated triggered emails with our built-in marketing, celebrating and incentivizing loyalty with email and push notification capabilities. Our marketing team will help you customize your email marketing.
                    </p>
                    <Button variant="link" className="p-0 text-primary">Learn more →</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="packages" className="space-y-12 mt-6">
              {/* Pricing Section */}
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold">Select the package that powers your growth</h2>
                <p className="text-muted-foreground">
                  Commerce Platform packages drive more orders, more loyalty, and higher average tickets, all commission-free*
                </p>
              </div>

              {/* Pricing Cards */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Starter Plan */}
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Starter</h3>
                      <p className="text-sm text-muted-foreground">
                        Get customers to re-order with your ready-built Online Ordering page.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-2xl font-bold">Included</div>
                      <p className="text-sm text-muted-foreground">with your Marketplace plan</p>
                      <Button variant="outline" className="w-full">Start for free</Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Features</h4>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Online Ordering with live tracking</div>
                            <div className="text-muted-foreground">Your customers can order through an Online Ordering link that's embedded in Crave'N</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Social channel ordering</div>
                            <div className="text-muted-foreground">Don't leave orders on the table! Let your fans order when they discover you on Facebook, Instagram, or Google</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">POS and Order with Google integration</div>
                            <div className="text-muted-foreground">Integrate with your POS, or enable Order with Google to let customers order from Search and Maps</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Promotions tools</div>
                            <div className="text-muted-foreground">Your promotions will be visible on both Online Ordering and Marketplace</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Built-in delivery and customer support</div>
                            <div className="text-muted-foreground">Work with Feeders to fulfill online orders, backed by customer support from ordering to delivery</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Boost Plan */}
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Boost</h3>
                      <p className="text-sm text-muted-foreground">
                        Maximize online orders and sales with proven marketing tools.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-2xl font-bold">$54 <span className="text-base font-normal text-muted-foreground">monthly, per store</span></div>
                      <Button className="w-full bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white">Schedule a demo</Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">All Starter features, plus:</h4>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Automated email marketing</div>
                            <div className="text-muted-foreground">Keep first-time orderers coming back by sending them timely email campaigns via our built-in marketing automation. Access expert help with strategy, if needed.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Online Ordering merchandising</div>
                            <div className="text-muted-foreground">Fully customize your Online Ordering page using layouts and themes to build your brand and showcase your most popular items.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Loyalty & gift card integration</div>
                            <div className="text-muted-foreground">Integrate with Square Loyalty or your existing loyalty and gift card programs, or enable Order with Google to let customers order from Search and Maps</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Website optimizations</div>
                            <div className="text-muted-foreground">Automatically capture clicks to optimize your ordering</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="border-2 border-primary relative">
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-green-600 text-white">Recommended</Badge>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-2">Pro</h3>
                      <p className="text-sm text-muted-foreground">
                        Get it all and elevate your restaurant's online ordering app and more.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="text-2xl font-bold">$249 <span className="text-base font-normal text-muted-foreground">monthly, per store</span></div>
                      <Button className="w-full bg-[#FF4D00] hover:bg-[#FF4D00]/90 text-white">Schedule a demo</Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">All Boost features, plus:</h4>
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Branded mobile app</div>
                            <div className="text-muted-foreground">Get a custom mobile app that lets you directly connect with loyal fans. Plus, you can double your orders when you make this app available on CraveMore and Crave'N for both iOS and Android.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">All-in-one loyalty</div>
                            <div className="text-muted-foreground">Reward loyalty with your new free, in-depth loyalty program that combines your acquisition channels and rewards your customers for every online purchase.</div>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <div className="font-medium">Custom marketing</div>
                            <div className="text-muted-foreground">Take sales to the next level by using personalized and advanced automation and tools to increase customer engagement, powered by our best-in-class team.</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Fine Print */}
              <div className="text-xs text-muted-foreground">
                *You only pay a 3% + $0.30 processing and service fee.
                **Subscriptions for Online Ordering orders that are placed from 2025 and 2025.
              </div>

              {/* Social Proof Section */}
              <div className="space-y-8 pt-8 border-t">
                <h2 className="text-3xl font-bold text-center">
                  Join the thousands of businesses that<br />grow with Commerce Platform
                </h2>

                {/* Brand Logos */}
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 py-8">
                  <div className="text-2xl font-bold text-muted-foreground">MAGNOLIA BAKERY</div>
                  <div className="text-2xl font-bold text-muted-foreground">goodwin</div>
                  <div className="text-2xl font-bold text-muted-foreground">HeyJoe</div>
                  <div className="text-2xl font-bold text-muted-foreground">BAN BAN DYNASTY</div>
                  <div className="text-2xl font-bold text-muted-foreground italic">Levain BAKERY</div>
                </div>

                {/* Testimonials Carousel */}
                <div className="relative">
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevTestimonial}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </Button>

                    <div className="max-w-4xl mx-auto px-12">
                      <Card className="bg-gradient-to-br from-green-50 to-green-100">
                        <CardContent className="p-8">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-lg p-4">
                              <img 
                                src={testimonials[currentTestimonial].image} 
                                alt={testimonials[currentTestimonial].brand}
                                className="w-full h-64 object-cover rounded"
                              />
                            </div>
                            <div className="space-y-4">
                              <h3 className="text-xl font-bold text-primary">
                                {testimonials[currentTestimonial].title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {testimonials[currentTestimonial].description}
                              </p>
                              <div>
                                <div className="font-semibold">{testimonials[currentTestimonial].author}</div>
                                <div className="text-sm text-muted-foreground">{testimonials[currentTestimonial].role}</div>
                              </div>
                              <Button variant="link" className="p-0 h-auto text-primary">
                                Read success story →
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextTestimonial}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </Button>
                  </div>

                  {/* Carousel Indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTestimonial(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentTestimonial ? "bg-primary w-8" : "bg-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default CommercePlatformDashboard;
