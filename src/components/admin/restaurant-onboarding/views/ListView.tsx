import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  LayoutList
} from 'lucide-react';
import type { RestaurantOnboardingData, OnboardingStage } from '../types';
import { RestaurantCard } from '../components/RestaurantCard';
import { QuickFilters } from '../components/QuickFilters';
import { sortRestaurants, filterRestaurants } from '../utils/helpers';

interface ListViewProps {
  restaurants: RestaurantOnboardingData[];
  onView?: (restaurant: RestaurantOnboardingData) => void;
  onApprove?: (restaurant: RestaurantOnboardingData) => void;
  onReject?: (restaurant: RestaurantOnboardingData) => void;
  onChat?: (restaurant: RestaurantOnboardingData) => void;
  onVerifyDocuments?: (restaurant: RestaurantOnboardingData) => void;
}

export function ListView({
  restaurants,
  onView,
  onApprove,
  onReject,
  onChat,
  onVerifyDocuments,
}: ListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<OnboardingStage[]>([]);
  const [hasAllDocsFilter, setHasAllDocsFilter] = useState<boolean | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<'high' | 'medium' | 'low' | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'stage' | 'name' | 'readiness'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Apply filters
  const filteredRestaurants = filterRestaurants(restaurants, {
    search: searchQuery,
    stages: selectedStages.length > 0 ? selectedStages : undefined,
    hasAllDocs: hasAllDocsFilter,
    priority: priorityFilter,
  });

  // Apply sorting
  const sortedRestaurants = sortRestaurants(filteredRestaurants, sortBy, sortOrder);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <QuickFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStages={selectedStages}
        onStagesChange={setSelectedStages}
        hasAllDocsFilter={hasAllDocsFilter}
        onHasAllDocsChange={setHasAllDocsFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{sortedRestaurants.length}</span> of {restaurants.length} restaurants
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort By */}
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="date">Date Applied</SelectItem>
              <SelectItem value="stage">Stage</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="readiness">Readiness Score</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Restaurant List/Grid */}
      {sortedRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg font-medium">No restaurants found</p>
            <p className="text-sm">Try adjusting your filters or search query</p>
          </div>
          {(searchQuery || selectedStages.length > 0 || hasAllDocsFilter !== undefined || priorityFilter) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedStages([]);
                setHasAllDocsFilter(undefined);
                setPriorityFilter(undefined);
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>
      ) : (
        <div 
          className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4' 
              : 'space-y-4'
          }
        >
          {sortedRestaurants.map(restaurant => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onView={onView}
              onApprove={onApprove}
              onReject={onReject}
              onChat={onChat}
              onVerifyDocuments={onVerifyDocuments}
            />
          ))}
        </div>
      )}
    </div>
  );
}

