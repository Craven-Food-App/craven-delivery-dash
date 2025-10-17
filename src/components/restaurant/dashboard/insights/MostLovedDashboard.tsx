import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heart, AlertCircle, MapPin, UserCheck, Star, Smile, Award } from "lucide-react";

const MostLovedDashboard = () => {
  return (
    <div className="space-y-6 pb-8">
      {/* Header with Badge */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-muted-foreground mb-4">
            The Most Loved program recognizes top-performing stores on Crave'N that are rated and loved by customers
          </p>
        </div>
        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
          <Heart className="w-8 h-8 text-orange-500" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <Select defaultValue="rankings">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rankings">Download rankings</SelectItem>
            <SelectItem value="report">Download report</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="standing">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standing">Greater standing</SelectItem>
            <SelectItem value="regional">Regional standing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Earn Badge Section */}
      <Card>
        <CardHeader>
          <CardTitle>Earn Most Loved for this November</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Meet all the requirements below to earn the Most Loved badge for November.
          </p>
          
          <div className="flex gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm">
              You are not eligible for Most Loved for October because you didn't meet the minimum order requirements in the last 3 months.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Smile className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Extreme satisfaction</h3>
                <p className="text-2xl font-bold">No data</p>
              </div>
            </div>
            <Button variant="link" className="p-0 h-auto text-sm">
              View extreme satisfaction
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Elite customer experience</h3>
                <p className="text-2xl font-bold">No data</p>
              </div>
            </div>
            <Button variant="link" className="p-0 h-auto text-sm">
              View customer experience
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Strong ratings</h3>
                <p className="text-2xl font-bold">No data</p>
              </div>
            </div>
            <Button variant="link" className="p-0 h-auto text-sm">
              View ratings
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lifetime Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Lifetime requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded border-2 border-muted-foreground" />
            <span className="text-sm">At least 20 completed deliveries in the last 3 months (0 recipes)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded border-2 border-muted-foreground" />
            <span className="text-sm">At least 100 5-star ratings in the last 3 months (0 recipes)</span>
          </div>
        </CardContent>
      </Card>

      {/* Perks Section */}
      <div>
        <h2 className="text-xl font-bold mb-2">Perks for Most Loved merchants</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Join the ranks of our top-rated merchants and enjoy exclusive benefits
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Better visibility</h3>
              <p className="text-sm text-muted-foreground">
                Get featured prominently in search results and recommendations, attracting more customers to your store.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Operational excellence</h3>
              <p className="text-sm text-muted-foreground">
                Priority support from our merchant success team and early access to new features and tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently asked questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I achieve Most Loved?</AccordionTrigger>
              <AccordionContent>
                To achieve Most Loved status, you need to consistently meet high standards across customer satisfaction, order quality, and delivery performance. This includes maintaining high ratings, meeting minimum order volumes, and providing excellent customer experiences.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How are Most Loved results determined?</AccordionTrigger>
              <AccordionContent>
                Most Loved status is determined by a combination of factors including customer ratings, extreme satisfaction scores, order accuracy, and overall customer experience metrics over a 3-month rolling period.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How will I know if I win Most Loved?</AccordionTrigger>
              <AccordionContent>
                You'll receive an email notification when you achieve Most Loved status. The badge will also appear on your store profile and you'll see it reflected in your merchant dashboard.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How do I see which stores I can travel to?</AccordionTrigger>
              <AccordionContent>
                You can view all Most Loved stores in your area through the Crave'N app or website. Use the filters to see top-rated restaurants and those with the Most Loved badge.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default MostLovedDashboard;
