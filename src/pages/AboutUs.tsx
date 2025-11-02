import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Target, Users, Truck, Store, Globe, Award, TrendingUp, MapPin, Clock, Star, Zap } from "lucide-react";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const AboutUs = () => {
  const [team, setTeam] = useState<Array<{ name: string; role: string; bio: string }>>([]);

  useEffect(() => {
    fetchExecutives();
  }, []);

  const fetchExecutives = async () => {
    try {
      const { data, error } = await supabase
        .from("employees" as any)
        .select("id, first_name, last_name, position, department")
        .in("position", [
          "CEO",
          "CFO",
          "COO",
          "CTO",
          "CMO",
          "CRO",
          "CPO",
          "CDO",
          "CHRO",
          "CLO",
          "CSO",
          "CXO",
          "Board Member",
          "Advisor",
        ])
        .limit(8);

      if (error) throw error;

      const formattedTeam = (data || []).map((exec: any) => ({
        name: `${exec.first_name} ${exec.last_name}`,
        role: exec.position,
        bio: `Leadership team member in ${exec.department || exec.position}`,
      }));

      // Always ensure Torrance Stroman (Founder & CEO) is at the top
      const founder = formattedTeam.find(
        (t) => t.name.toLowerCase().includes("torrance") || t.role.toLowerCase().includes("ceo"),
      );
      if (!founder) {
        formattedTeam.unshift({
          name: "Torrance Stroman",
          role: "CEO & Founder",
          bio: "Visionary entrepreneur with a passion for revolutionizing food delivery and supporting local communities.",
        });
      }

      setTeam(formattedTeam);
    } catch (error) {
      console.error("Error fetching executives:", error);
      // Fallback to Torrance Stroman if database fetch fails
      setTeam([
        {
          name: "Torrance Stroman",
          role: "CEO & Founder",
          bio: "Visionary entrepreneur with a passion for revolutionizing food delivery and supporting local communities.",
        },
      ]);
    }
  };
  const stats = [
    {
      icon: Users,
      label: "Active Users",
      value: "20K",
    },
    {
      icon: Store,
      label: "Restaurant Partners",
      value: "5K+",
    },
    {
      icon: Truck,
      label: "Delivery Drivers",
      value: "1K+",
    },
    {
      icon: Globe,
      label: "Cities Served",
      value: "100+",
    },
  ];
  const values = [
    {
      icon: Heart,
      title: "Customer First",
      description: "Every decision we make is centered around creating the best possible experience for our customers.",
    },
    {
      icon: Zap,
      title: "Speed & Reliability",
      description: "We leverage technology to ensure fast, accurate deliveries that you can count on every time.",
    },
    {
      icon: Users,
      title: "Community Focus",
      description:
        "We believe in supporting local restaurants and creating opportunities for drivers in every community.",
    },
    {
      icon: Star,
      title: "Quality Excellence",
      description: "From our platform to our partnerships, we maintain the highest standards in everything we do.",
    },
  ];
  const timeline = [
    {
      year: "2025",
      title: "The Beginning",
      description:
        "Crave'n was founded with a simple mission: make food delivery faster, more reliable, and more affordable for everyone.",
    },
    {
      year: "2025",
      title: "Rapid Growth",
      description:
        "Quickly expanded to 100+ cities and onboarded over 5,000 restaurant partners, establishing our presence in major metropolitan areas.",
    },
    {
      year: "2025",
      title: "Platform Innovation",
      description:
        "Launched our AI-powered routing system, real-time tracking, and built a network of 1,000+ dedicated delivery drivers.",
    },
    {
      year: "2025",
      title: "Community Impact",
      description:
        "Reached 20K active users and introduced our driver benefits program, safety features, and award-winning customer support platform.",
    },
  ];

  const futureRoles = ["Chief Technology Officer", "VP of Operations", "Head of Marketing", "Director of Partnerships"];
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">About Crave'n</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            We're on a mission to connect people with their favorite food, support local restaurants, and create
            opportunities for drivers in communities everywhere.
          </p>
          <Badge variant="secondary" className="bg-white/20 text-white text-lg px-4 py-2">
            Founded in 2025 • 100+ Cities • 20K Active Users
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <h3 className="text-2xl font-bold text-primary">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To revolutionize food delivery by creating a platform that benefits everyone: customers get their
                favorite meals quickly and affordably, restaurants reach new customers and grow their business, and
                drivers earn good money with flexible schedules.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground leading-relaxed">
                To become the most trusted and beloved food delivery platform, known for exceptional service, innovative
                technology, and unwavering commitment to the communities we serve. We envision a world where great food
                is always within reach.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <Icon className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Company Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Journey</h2>
          <div className="max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <div key={index} className="flex gap-6 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {item.year.slice(-2)}
                  </div>
                  {index !== timeline.length - 1 && <div className="w-px h-16 bg-border mt-4"></div>}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">{item.title}</h3>
                    <Badge variant="outline">{item.year}</Badge>
                  </div>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leadership Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-4">Leadership Team</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Building the future of food delivery, one delivery at a time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/60 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary text-sm mb-3">{member.role}</p>
                  <p className="text-xs text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-3">We're Growing!</h3>
              <p className="text-muted-foreground mb-4">
                We're actively building our leadership team. Join us as we scale and shape the future of food delivery.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {futureRoles.map((role, i) => (
                  <Badge key={i} variant="outline">
                    {role} - Coming Soon
                  </Badge>
                ))}
              </div>
              <Button onClick={() => (window.location.href = "/careers")}>View Open Positions</Button>
            </CardContent>
          </Card>
        </div>

        {/* Awards & Recognition */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center">
              <Award className="h-6 w-6 text-primary" />
              Awards & Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Best Food Delivery App 2025</h4>
                <p className="text-sm text-muted-foreground">TechCrunch Awards</p>
              </div>
              <div>
                <Star className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Customer Choice Award</h4>
                <p className="text-sm text-muted-foreground">App Store Recognition</p>
              </div>
              <div>
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Fastest Growing Platform</h4>
                <p className="text-sm text-muted-foreground">Industry Report 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Culture */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Life at Crave'n</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We believe that great products come from great teams. Our culture is built on collaboration, innovation,
                and a shared passion for making food delivery better for everyone.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Flexible work arrangements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Comprehensive health benefits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Professional development opportunities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Equity participation for all employees</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sustainability Commitment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We're committed to reducing our environmental impact and supporting sustainable practices throughout our
                operations and partner network.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Carbon-neutral delivery options</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Eco-friendly packaging partnerships</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Local sourcing initiatives</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Food waste reduction programs</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-4">Join the Crave'n Family</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Whether you're looking for a career opportunity, want to partner with us, or simply want to stay updated
              on our journey, we'd love to connect.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg">View Open Positions</Button>
              <Button variant="outline" size="lg">
                Partner With Us
              </Button>
              <Button variant="outline" size="lg">
                Follow Our Story
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

// Add missing CheckCircle and Trophy imports
const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
    />
  </svg>
);
export default AboutUs;
