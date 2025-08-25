import React from 'react';
import AdminAccessGuard from '@/components/AdminAccessGuard';
import ApplicationReview from '@/components/admin/ApplicationReview';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

const Admin: React.FC = () => {
  return (
    <AdminAccessGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-primary text-primary-foreground shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6" />
                <div>
                  <h1 className="text-xl font-bold">Crave'n Admin Portal</h1>
                  <p className="text-sm opacity-90">Corporate Administration Dashboard</p>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/'}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <ApplicationReview />
        </main>
      </div>
    </AdminAccessGuard>
  );
};

export default Admin;