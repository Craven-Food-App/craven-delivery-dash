import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Users, Code, Megaphone, BarChart } from 'lucide-react';
import Footer from '@/components/Footer';

const Careers = () => {
  const jobs = [
    {
      title: 'Senior Software Engineer',
      department: 'Engineering',
      location: 'Remote / San Francisco',
      type: 'Full-time',
      salary: '$120k - $180k',
      icon: Code,
    },
    {
      title: 'Product Marketing Manager',
      department: 'Marketing',
      location: 'New York',
      type: 'Full-time',
      salary: '$90k - $130k',
      icon: Megaphone,
    },
    {
      title: 'Data Analyst',
      department: 'Analytics',
      location: 'Remote',
      type: 'Full-time',
      salary: '$80k - $120k',
      icon: BarChart,
    },
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
        <div className="grid gap-6 mb-12">
          {jobs.map((job, index) => {
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
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;