import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from "@/integrations/supabase/client";

const CustomerInsightsDashboard = () => {
  const [dateRange, setDateRange] = useState("this-month");
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };

    fetchMapboxToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  const MetricCard = ({ title, value, subValue }: any) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-2">{title}</div>
        <div className="flex items-baseline gap-2 mb-2">
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">- - -</div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{subValue}</span>
          <span className="text-primary">CraveMore customers</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Description */}
      <p className="text-muted-foreground">
        Understand your customers and discover opportunities to grow and retain your customer base.
      </p>

      {/* Date Range Selector */}
      <div className="flex gap-4 items-center">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This month</SelectItem>
            <SelectItem value="last-month">Last month</SelectItem>
            <SelectItem value="last-3-months">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Overview</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Oct 1 - 15, 2025 compared to Sep 3 - 17, 2025
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard 
            title="Total customers" 
            value="0" 
            subValue="0"
          />
          <MetricCard 
            title="New" 
            value="- - -" 
            subValue="0"
          />
          <MetricCard 
            title="Occasional" 
            value="- - -" 
            subValue="0"
          />
          <MetricCard 
            title="Frequent" 
            value="- - -" 
            subValue="0"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          CraveMore is a loyalty subscription service for customers. CraveMore customers frequently place high-value orders.
        </p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span>Last updated on Oct 15, 2025</span>
        </div>
      </div>

      {/* Customer Locations */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Customer locations</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full">
              All
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              New
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              Occasional
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              Frequent
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Top delivery destinations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This map shows customer locations where at least 2 customers place orders from the same zip code.
            </p>
            <div ref={mapContainer} className="w-full h-96 rounded-lg border" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomerInsightsDashboard;
