import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface BackgroundCheckReport {
  id: string;
  application_id: string;
  user_id: string;
  checkr_candidate_id: string | null;
  checkr_report_id: string | null;
  checkr_status: string | null;
  status: string;
  initiated_at: string;
  completed_at: string | null;
  criminal_search_status: string | null;
  criminal_records: any;
  mvr_status: string | null;
  mvr_records: any;
  ssn_trace_status: string | null;
  admin_review_required: boolean;
  admin_reviewed_by: string | null;
  admin_review_notes: string | null;
  admin_decision: string | null;
  admin_reviewed_at: string | null;
  craver_applications?: {
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string;
  };
}

export default function BackgroundCheckDashboard() {
  const [reports, setReports] = useState<BackgroundCheckReport[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch existing reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('background_check_reports')
        .select(`
          *,
          craver_applications (
            first_name,
            last_name,
            email,
            date_of_birth
          )
        `)
        .order('initiated_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);

      // Fetch applications without background checks
      const { data: appsData, error: appsError } = await supabase
        .from('craver_applications')
        .select('*')
        .eq('status', 'approved')
        .is('background_check_report_id', null);

      if (appsError) throw appsError;
      setApplications(appsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load background check data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initiateBackgroundCheck = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('initiate-background-check', {
        body: { application_id: applicationId },
      });

      if (error) throw error;

      toast({
        title: 'Background Check Initiated',
        description: data.message || 'Check will be completed in 1-3 business days',
      });

      fetchData();
    } catch (error) {
      console.error('Error initiating check:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate background check',
        variant: 'destructive',
      });
    }
  };

  const reviewReport = async (reportId: string, decision: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('background_check_reports')
        .update({
          admin_decision: decision,
          admin_review_notes: reviewNotes[reportId] || '',
          admin_reviewed_by: user?.id,
          admin_reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId);

      if (error) throw error;

      // Update application
      const report = reports.find(r => r.id === reportId);
      if (report) {
        await supabase
          .from('craver_applications')
          .update({ 
            background_check: decision === 'approved',
            status: decision === 'rejected' ? 'rejected' : 'approved'
          })
          .eq('id', report.application_id);
      }

      toast({
        title: `Application ${decision}`,
        description: `Background check has been ${decision}`,
      });

      fetchData();
    } catch (error) {
      console.error('Error reviewing report:', error);
      toast({
        title: 'Error',
        description: 'Failed to review background check',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; icon: any; label: string }> = {
      clear: { variant: 'default', icon: CheckCircle, label: 'Clear' },
      consider: { variant: 'secondary', icon: AlertTriangle, label: 'Review' },
      suspended: { variant: 'destructive', icon: XCircle, label: 'Suspended' },
      pending: { variant: 'outline', icon: Clock, label: 'Pending' },
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <Badge variant={badge.variant as any}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'in_progress');
  const reviewRequiredReports = reports.filter(r => r.admin_review_required && !r.admin_decision);
  const completedReports = reports.filter(r => r.admin_decision);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Background Check Dashboard</h2>
        <p className="text-muted-foreground">Manage driver background checks via Checkr</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReports.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviewRequiredReports.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">Pending ({applications.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({pendingReports.length})</TabsTrigger>
          <TabsTrigger value="review">Review ({reviewRequiredReports.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardHeader>
                <CardTitle>{app.first_name} {app.last_name}</CardTitle>
                <CardDescription>{app.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">DOB:</span> {app.date_of_birth}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {app.phone}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span> {app.street_address}, {app.city}, {app.state}
                  </div>
                </div>
                <Button onClick={() => initiateBackgroundCheck(app.id)}>
                  Run Background Check ($25-35)
                </Button>
              </CardContent>
            </Card>
          ))}
          {applications.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No pending applications</p>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {pendingReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {report.craver_applications?.first_name} {report.craver_applications?.last_name}
                </CardTitle>
                <CardDescription>
                  Initiated: {new Date(report.initiated_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    {getStatusBadge(report.checkr_status || 'pending')}
                  </div>
                  {report.checkr_report_id && (
                    <p className="text-sm text-muted-foreground">
                      Report ID: {report.checkr_report_id}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {pendingReports.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No checks in progress</p>
          )}
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          {reviewRequiredReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {report.craver_applications?.first_name} {report.craver_applications?.last_name}
                </CardTitle>
                <CardDescription>
                  Completed: {report.completed_at && new Date(report.completed_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Criminal:</span> {getStatusBadge(report.criminal_search_status || 'pending')}
                  </div>
                  <div>
                    <span className="font-medium">MVR:</span> {getStatusBadge(report.mvr_status || 'pending')}
                  </div>
                  <div>
                    <span className="font-medium">SSN Trace:</span> {getStatusBadge(report.ssn_trace_status || 'pending')}
                  </div>
                  <div>
                    <span className="font-medium">Overall:</span> {getStatusBadge(report.checkr_status || 'pending')}
                  </div>
                </div>

                {report.criminal_records && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium mb-2">Criminal Records Found:</p>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(report.criminal_records, null, 2)}
                    </pre>
                  </div>
                )}

                {report.mvr_records && (
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium mb-2">MVR Violations:</p>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(report.mvr_records, null, 2)}
                    </pre>
                  </div>
                )}

                <Textarea
                  placeholder="Review notes..."
                  value={reviewNotes[report.id] || ''}
                  onChange={(e) => setReviewNotes({ ...reviewNotes, [report.id]: e.target.value })}
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={() => reviewReport(report.id, 'approved')}
                    variant="default"
                  >
                    Approve Application
                  </Button>
                  <Button 
                    onClick={() => reviewReport(report.id, 'rejected')}
                    variant="destructive"
                  >
                    Reject Application
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {reviewRequiredReports.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No reports need review</p>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedReports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle>
                  {report.craver_applications?.first_name} {report.craver_applications?.last_name}
                </CardTitle>
                <CardDescription>
                  Reviewed: {report.admin_reviewed_at && new Date(report.admin_reviewed_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Decision:</span>
                    <Badge variant={report.admin_decision === 'approved' ? 'default' : 'destructive'}>
                      {report.admin_decision}
                    </Badge>
                  </div>
                  {report.admin_review_notes && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {report.admin_review_notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {completedReports.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No completed reviews</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
