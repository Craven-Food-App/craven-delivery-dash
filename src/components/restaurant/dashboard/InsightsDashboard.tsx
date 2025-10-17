import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SalesDashboard from "./insights/SalesDashboard";
import ProductMixDashboard from "./insights/ProductMixDashboard";
import OperationsQualityDashboard from "./insights/OperationsQualityDashboard";
import MostLovedDashboard from "./insights/MostLovedDashboard";

const InsightsDashboard = () => {
  return (
    <div className="w-full h-full bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Insights</h1>
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="bg-muted">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="product-mix">Product Mix</TabsTrigger>
              <TabsTrigger value="operations">Operations Quality</TabsTrigger>
              <TabsTrigger value="most-loved">Most Loved</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              <SalesDashboard />
            </TabsContent>

            <TabsContent value="product-mix" className="mt-6">
              <ProductMixDashboard />
            </TabsContent>

            <TabsContent value="operations" className="mt-6">
              <OperationsQualityDashboard />
            </TabsContent>

            <TabsContent value="most-loved" className="mt-6">
              <MostLovedDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
