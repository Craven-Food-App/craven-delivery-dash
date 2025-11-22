import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, DollarSign, Clock, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import becomeDriverHero from "@/assets/20251002_2239_Animated-Logo-Driver_remix_01k6kyy1m7f108g2r5qjd0a8x8.png";


const FeederHub = () => {
  const navigate = useNavigate();
  const benefits = [
    {
      icon: DollarSign,
      title: "Earn on Your Schedule",
      description: "Make money when you want, how you want. Average $15-25/hour during peak times."
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Work full-time or part-time. You're in control of when and where you deliver."
    },
    {
      icon: CheckCircle,
      title: "Easy Sign-Up",
      description: "Get started in minutes. Most Feeders are approved and earning within days."
    }
  ];

  const requirements = [
    "Be at least 18 years old",
    "Have a valid driver's license",
    "Own a car, bike, or scooter",
    "Pass a background check",
    "Have a smartphone"
  ];

  const earnings = [
    { time: "Lunch Rush", hours: "11:30 AM - 1:30 PM", rate: "$18-25/hour" },
    { time: "Dinner Rush", hours: "5:30 PM - 8:30 PM", rate: "$20-28/hour" },
    { time: "Weekend Peak", hours: "Fri-Sun Evenings", rate: "$22-30/hour" }
  ];


  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left side - Text content */}
            <div className="space-y-8">
              <div className="flex items-center mb-6">
                <Car className="h-12 w-12 text-primary mr-4" />
                <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                  Become a <span className="text-primary">Feeder</span>
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Deliver delicious food and earn great money on your own schedule. 
                Join thousands of Feeders making a difference in their communities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/driver-onboarding/apply')}
                >
                  Start Earning Today
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={() => navigate('/driver/auth')}
                >
                  Login
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span>4.8/5 Feeder Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>50,000+ Active Feeders</span>
                </div>
              </div>
            </div>
            
            {/* Right side - Hero image */}
            <div className="lg:pl-8 flex justify-center">
              <div className="relative max-w-2xl">
                <img 
                  src={becomeDriverHero} 
                  alt="Become a Feeder Driver" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Feeders Love What They Do</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the benefits that make being a Feeder more than just a job.
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-hover transition-all duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{benefit.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* Earnings Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Earning Potential</h2>
              <p className="text-muted-foreground">
                See how much you could earn during peak delivery times in your area.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {earnings.map((earning, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-2">
                      {earning.time}
                    </Badge>
                    <CardTitle className="text-2xl text-primary">
                      {earning.rate}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{earning.hours}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      *Earnings may vary based on location, time, and demand
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Simple Requirements</h2>
              <p className="text-muted-foreground">
                Getting started as a Feeder is easier than you think.
              </p>
            </div>
            
            <Card className="p-8">
              <ul className="space-y-4">
                {requirements.map((requirement, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Feeding Success?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our community of Feeders and start earning money delivering the food people love.
          </p>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/driver-onboarding/apply')}
          >
            Apply to Become a Feeder
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Application takes less than 5 minutes
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeederHub;