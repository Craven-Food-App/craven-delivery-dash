import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Users, Code, Megaphone, BarChart, Mail } from 'lucide-react';
import Footer from '@/components/Footer';

const Careers = () => {
  // Currently no open positions - update this when hiring
  const jobs = [];
  
  const benefits = [
    {
      title: 'Competitive Compensation',
      description: 'Market-leading salaries and equity packages',
      icon: DollarSign
    },
    {
      title: 'Flexible Work',
      description: 'Remote-first culture with flexible hours',
      icon: Clock
    },
    {
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision coverage',
      icon: Users
    },
    {
      title: 'Growth Opportunities',
      description: 'Professional development and learning budget',
      icon: BarChart
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-16 text-center">
          <Users className="h-16 w-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Help us revolutionize food delivery. Build your career with a fast-growing company that values innovation and teamwork.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Why Work at Crave'N?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <Icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Job Listings or No Positions Message */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Open Positions</h2>
          
          {jobs.length > 0 ? (
            <div className="grid gap-6">{jobs.map((job, index) => {
              const Icon = job.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className="h-6 w-6 text-primary" />
                        <div>
                          <CardTitle>{job.title}</CardTitle>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{job.department}</Badge>
                            <Badge variant="outline">{job.type}</Badge>
                          </div>
                        </div>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {job.salary}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {job.type}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}</div>
          ) : (
            <Card className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-2xl font-bold mb-3">No Open Positions at This Time</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  We're not currently hiring, but we're always interested in connecting with talented individuals. 
                  Send us your resume and we'll keep you in mind for future opportunities.
                </p>
                <Button size="lg" onClick={() => window.location.href = 'mailto:customerservice@cravenusa.com'}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Your Resume
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;