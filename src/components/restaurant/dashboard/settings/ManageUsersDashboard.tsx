import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ChevronRight } from "lucide-react";

const ManageUsersDashboard = () => {
  const users = [
    {
      role: "Business admin",
      email: "tppandco@mail.com",
      firstName: "Kozman",
      lastName: "Stroman"
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Search and Add User */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search" 
            className="pl-10"
          />
        </div>
        <Button variant="destructive" className="gap-2">
          <Plus className="w-4 h-4" />
          Add user
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-sm">Role</th>
                  <th className="text-left p-4 font-medium text-sm">Email address</th>
                  <th className="text-left p-4 font-medium text-sm">First name</th>
                  <th className="text-left p-4 font-medium text-sm">Last name</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-muted/30">
                    <td className="p-4">{user.role}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">{user.firstName}</td>
                    <td className="p-4">{user.lastName}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageUsersDashboard;
