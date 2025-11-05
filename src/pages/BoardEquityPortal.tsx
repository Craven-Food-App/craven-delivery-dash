import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquityGrantForm } from '@/components/board/EquityGrantForm';
import { EquityGrantReview } from '@/components/board/EquityGrantReview';
import { CapTableView } from '@/components/board/CapTableView';
import { useExecAuth } from '@/hooks/useExecAuth';
import { Loader2 } from 'lucide-react';

export default function BoardEquityPortal() {
  const { loading, isAuthorized } = useExecAuth('ceo');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Unauthorized</h1>
          <p className="text-muted-foreground">
            Only board members and CEO can access equity management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Board Equity Portal</h1>
        <p className="text-muted-foreground">
          Manage equity grants, review cap table, and maintain governance over company ownership
        </p>
      </div>

      <Tabs defaultValue="grants" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="grants">Grant Equity</TabsTrigger>
          <TabsTrigger value="review">Review Grants</TabsTrigger>
          <TabsTrigger value="captable">Cap Table</TabsTrigger>
        </TabsList>

        <TabsContent value="grants">
          <EquityGrantForm onGrantCreated={() => setRefreshTrigger(prev => prev + 1)} />
        </TabsContent>

        <TabsContent value="review">
          <EquityGrantReview refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="captable">
          <CapTableView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
