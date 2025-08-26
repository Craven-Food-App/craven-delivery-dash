import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import Header from "@/components/Header";

const restaurantSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  cuisine_type: z.string().min(1, "Please select a cuisine type"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  zip_code: z.string().min(5, "ZIP code must be at least 5 characters"),
  delivery_fee_cents: z.number().min(0).max(999).default(299),
  min_delivery_time: z.number().min(10).max(60).default(20),
  max_delivery_time: z.number().min(20).max(120).default(40),
  image_url: z.string().url().optional().or(z.literal(""))
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

const cuisineTypes = [
  "American", "Italian", "Mexican", "Chinese", "Japanese", "Indian", "Thai", 
  "Mediterranean", "French", "Greek", "Korean", "Vietnamese", "Lebanese", 
  "Pizza", "Burgers", "Seafood", "Vegetarian", "Healthy", "Fast Food", "Other"
];

const RestaurantRegister = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      cuisine_type: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      delivery_fee_cents: 299,
      min_delivery_time: 20,
      max_delivery_time: 40,
      image_url: ""
    }
  });

  const onSubmit = async (data: RestaurantFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to register your restaurant",
        variant: "destructive"
      });
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("restaurants")
        .insert({
          owner_id: user.id,
          name: data.name,
          description: data.description,
          cuisine_type: data.cuisine_type,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zip_code,
          delivery_fee_cents: data.delivery_fee_cents,
          min_delivery_time: data.min_delivery_time,
          max_delivery_time: data.max_delivery_time,
          image_url: data.image_url || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Restaurant registered successfully!",
        description: "Your restaurant has been submitted for review. You can now manage your restaurant from the dashboard."
      });

      navigate("/restaurant/dashboard");
    } catch (error) {
      console.error("Error registering restaurant:", error);
      toast({
        title: "Error registering restaurant",
        description: "There was a problem registering your restaurant. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Register Your Restaurant
            </h1>
            <p className="text-xl text-muted-foreground">
              Join our platform and start serving customers in your area
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Restaurant Information</CardTitle>
              <CardDescription>
                Please fill out all the required information about your restaurant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your restaurant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cuisine_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select cuisine type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {cuisineTypes.map((cuisine) => (
                                <SelectItem key={cuisine} value={cuisine}>
                                  {cuisine}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your restaurant, specialties, and what makes it unique..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="restaurant@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="94102" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurant Photo URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/restaurant-photo.jpg" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional: Add a photo URL to showcase your restaurant
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="delivery_fee_cents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Fee (cents)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="299" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            $2.99 = 299 cents
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="min_delivery_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Delivery Time (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="20" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_delivery_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Delivery Time (minutes)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="40" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 40)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Register Restaurant
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRegister;