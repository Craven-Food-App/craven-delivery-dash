import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const MenuManagerDashboard = () => {
  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 mb-6">
            <div className="w-full h-full rounded-lg bg-muted flex items-center justify-center">
              <FileText className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4">We're preparing your menu</h2>
          
          <div className="max-w-md text-center space-y-2">
            <p className="text-sm">
              You'll <span className="text-primary underline">receive an email</span> when your menu is ready to review.
            </p>
            <p className="text-sm">
              Your menu will <span className="text-primary underline">appear here</span> when it's ready.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuManagerDashboard;
