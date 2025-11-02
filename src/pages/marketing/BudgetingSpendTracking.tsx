/**
 * Budgeting & Spend Tracking
 * Track marketing budget allocation and ROI
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, PieChart, Calendar, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface BudgetData {
  totalBudget: number;
  spent: number;
  remaining: number;
  byChannel: {
    email: number;
    push: number;
    sms: number;
    social: number;
    inApp: number;
  };
}

const BudgetingSpendTracking: React.FC = () => {
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 50000,
    spent: 0,
    remaining: 50000,
    byChannel: {
      email: 0,
      push: 0,
      sms: 0,
      social: 0,
      inApp: 0
    }
  });
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchSpendData();
  }, [timeRange]);

  const fetchSpendData = async () => {
    try {
      const startDate = timeRange === 'month' 
        ? startOfMonth(new Date())
        : subDays(new Date(), 30);

      // Get campaign spend
      const { data: campaigns } = await supabase
        .from('marketing_campaigns')
        .select('spend_to_date, channel')
        .gte('start_date', format(startDate, 'yyyy-MM-dd'));

      const channelSpend = {
        email: 0,
        push: 0,
        sms: 0,
        social: 0,
        inApp: 0
      };

      let totalSpent = 0;
      (campaigns || []).forEach(campaign => {
        const spend = Number(campaign.spend_to_date || 0);
        totalSpent += spend;
        
        const channel = campaign.channel?.toLowerCase() || '';
        if (channel.includes('email')) channelSpend.email += spend;
        else if (channel.includes('push')) channelSpend.push += spend;
        else if (channel.includes('sms')) channelSpend.sms += spend;
        else if (channel.includes('social')) channelSpend.social += spend;
        else channelSpend.inApp += spend;
      });

      setBudgetData({
        totalBudget: 50000,
        spent: totalSpent,
        remaining: 50000 - totalSpent,
        byChannel: channelSpend
      });
    } catch (error) {
      console.error('Error fetching spend data:', error);
    }
  };

  const spendPercentage = budgetData.totalBudget > 0 
    ? (budgetData.spent / budgetData.totalBudget) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budgeting & Spend Tracking</h2>
          <p className="text-gray-600 mt-1">Monitor marketing budget allocation and ROI</p>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold">${budgetData.totalBudget.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Spent</p>
              <p className="text-2xl font-bold text-orange-600">${budgetData.spent.toLocaleString()}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(spendPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">{spendPercentage.toFixed(1)}% used</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className="text-2xl font-bold text-green-600">${budgetData.remaining.toLocaleString()}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Channel Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Spend by Channel</h3>
        <div className="space-y-4">
          {Object.entries(budgetData.byChannel).map(([channel, spend]) => {
            const percentage = budgetData.spent > 0 ? (spend / budgetData.spent) * 100 : 0;
            return (
              <div key={channel}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">{channel}</span>
                  <span className="text-sm text-gray-600">${spend.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ROI Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">ROI Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Cost per Acquisition</p>
            <p className="text-2xl font-bold mt-1">
              ${budgetData.spent > 0 ? (budgetData.spent / 100).toFixed(2) : '0.00'}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Revenue Generated</p>
            <p className="text-2xl font-bold text-green-600 mt-1">$0.00</p>
            <p className="text-xs text-gray-500">(Requires campaign attribution)</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">ROI</p>
            <p className="text-2xl font-bold mt-1">0%</p>
            <p className="text-xs text-gray-500">(Calculate from revenue/spend)</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BudgetingSpendTracking;

