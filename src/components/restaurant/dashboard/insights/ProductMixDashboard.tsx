import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown, Package } from "lucide-react";
import { generateProductMixData } from "@/utils/restaurantDataGenerator";

const ProductMixDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const productData = generateProductMixData();

  const filteredData = productData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select defaultValue="last7">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last7">Last 7 days</SelectItem>
            <SelectItem value="last30">Last 30 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">vs</span>
        <Select defaultValue="7days-prior">
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days-prior">7 days prior</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search for an item"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Data Table */}
      {filteredData.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-sm">Items</th>
                    <th className="text-right p-4 font-medium text-sm">Total sold</th>
                    <th className="text-right p-4 font-medium text-sm">Change</th>
                    <th className="text-right p-4 font-medium text-sm">Gross sales</th>
                    <th className="text-right p-4 font-medium text-sm">Change</th>
                    <th className="text-right p-4 font-medium text-sm">Net price</th>
                    <th className="text-right p-4 font-medium text-sm">Price changes</th>
                    <th className="text-right p-4 font-medium text-sm">Customer discounts</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="p-4">{item.name}</td>
                      <td className="text-right p-4">{item.totalSold}</td>
                      <td className="text-right p-4">
                        <div className={`flex items-center justify-end gap-1 ${item.totalSoldChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.totalSoldChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{Math.abs(item.totalSoldChange)}%</span>
                        </div>
                      </td>
                      <td className="text-right p-4">${item.grossSales.toFixed(2)}</td>
                      <td className="text-right p-4">
                        <div className={`flex items-center justify-end gap-1 ${item.grossSalesChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.grossSalesChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span>{Math.abs(item.grossSalesChange)}%</span>
                        </div>
                      </td>
                      <td className="text-right p-4">${item.netPrice.toFixed(2)}</td>
                      <td className="text-right p-4">{item.priceChanges}</td>
                      <td className="text-right p-4">${item.customerDiscounts.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-sm text-muted-foreground">Try adjusting your search</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductMixDashboard;
