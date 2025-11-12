import React, { useState } from 'react';
import { TrendingUp, Clock, ChevronRight, Menu, Bell } from 'lucide-react';
import { toast } from 'sonner';

 type CorporateEarningsDashboardProps = {
  onOpenMenu?: () => void;
  onOpenNotifications?: () => void;
};

const periods = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' }
] as const;

type PeriodId = typeof periods[number]['id'];

type PeriodData = {
  total: string;
  deliveries: number;
  hours: string;
  avg: string;
};

type EarningsData = Record<PeriodId, PeriodData>;

const earningsData: EarningsData = {
  today: { total: '$145.50', deliveries: 12, hours: '6.5h', avg: '$12.08' },
  week: { total: '$892.25', deliveries: 68, hours: '38h', avg: '$23.48' },
  month: { total: '$3,456.80', deliveries: 247, hours: '142h', avg: '$24.35' }
};

const recentDeliveries = [
  { id: 1, restaurant: 'Burger Haven', time: '2:45 PM', amount: '$18.50', distance: '2.3 mi', tip: '$5.00' },
  { id: 2, restaurant: 'Sushi Express', time: '1:30 PM', amount: '$24.75', distance: '3.1 mi', tip: '$8.00' },
  { id: 3, restaurant: 'Pizza Palace', time: '12:15 PM', amount: '$15.25', distance: '1.8 mi', tip: '$4.00' },
  { id: 4, restaurant: 'Taco Street', time: '11:45 AM', amount: '$12.50', distance: '1.5 mi', tip: '$3.50' },
  { id: 5, restaurant: 'Thai Garden', time: '10:30 AM', amount: '$21.00', distance: '2.8 mi', tip: '$6.50' },
  { id: 6, restaurant: 'Sandwich Co.', time: '9:50 AM', amount: '$16.75', distance: '2.0 mi', tip: '$4.75' }
];

const CorporateEarningsDashboard: React.FC<CorporateEarningsDashboardProps> = ({
  onOpenMenu,
  onOpenNotifications
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodId>('week');
  const currentData = earningsData[selectedPeriod];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="bg-white flex-shrink-0">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => {
                if (onOpenMenu) {
                  onOpenMenu();
                } else {
                  toast.info('Menu coming soon.');
                }
              }}
              className="w-10 h-10 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (onOpenNotifications) {
                  onOpenNotifications();
                } else {
                  toast.info('Notifications coming soon.');
                }
              }}
              className="w-10 h-10 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition"
            >
              <Bell className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-5 py-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          .overflow-y-auto::-webkit-scrollbar {
            display: none;
          }
        `
          }}
        />

        <div className="flex space-x-2 mb-6">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                selectedPeriod === period.id
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 mb-6 shadow-xl">
          <p className="text-orange-100 text-sm font-medium mb-2">Total Earnings</p>
          <h2 className="text-5xl font-bold text-white mb-6">{currentData.total}</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-orange-100 text-xs mb-1">Deliveries</p>
              <p className="text-white text-lg font-bold">{currentData.deliveries}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">Hours</p>
              <p className="text-white text-lg font-bold">{currentData.hours}</p>
            </div>
            <div>
              <p className="text-orange-100 text-xs mb-1">Avg/Hour</p>
              <p className="text-white text-lg font-bold">{currentData.avg}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Tips</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">$284.50</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">38h 15m</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Deliveries</h3>
            <button className="text-sm text-orange-600 font-semibold">View All</button>
          </div>

          <div className="space-y-3">
            {recentDeliveries.map((delivery) => (
              <div key={delivery.id} className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{delivery.restaurant}</h4>
                    <p className="text-xs text-gray-500">
                      {delivery.time} • {delivery.distance}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{delivery.amount}</p>
                    <p className="text-xs text-green-600 font-medium">+{delivery.tip} tip</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="px-2 py-1 bg-green-50 rounded-lg">
                    <span className="text-xs font-semibold text-green-600">Completed</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateEarningsDashboard;
