/**
 * Referral Program Component
 * Allows users to earn bonuses by referring friends, drivers, or restaurants
 * Competes with DoorDash referral programs
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Users, DollarSign, Share2, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_bonuses: number;
  total_earned: number;
}

export function ReferralProgram({ userType = 'customer' }: { userType?: 'customer' | 'driver' | 'restaurant' }) {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState<ReferralStats>({
    total_referrals: 0,
    completed_referrals: 0,
    pending_bonuses: 0,
    total_earned: 0
  });
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create referral code
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('user_id', user.id)
        .eq('user_type', userType)
        .single();

      if (existingCode) {
        setReferralCode(existingCode.code);
      } else {
        // Generate new code
        const { data: newCode, error } = await supabase
          .rpc('generate_referral_code', {
            p_user_id: user.id,
            p_user_type: userType
          });

        if (!error && newCode) {
          setReferralCode(newCode);
        }
      }

      // Get referral stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id, status')
        .eq('referrer_id', user.id);

      const { data: bonuses } = await supabase
        .from('referral_bonuses')
        .select('*')
        .eq('user_id', user.id);

      const totalEarned = bonuses?.reduce((sum, b) => sum + (b.status === 'paid' ? b.amount : 0), 0) || 0;
      const pendingBonuses = bonuses?.reduce((sum, b) => sum + (b.status === 'pending' ? b.amount : 0), 0) || 0;

      setStats({
        total_referrals: referrals?.length || 0,
        completed_referrals: referrals?.filter(r => r.status === 'completed').length || 0,
        pending_bonuses: pendingBonuses,
        total_earned: totalEarned
      });

      // Get settings
      const { data: settingsData } = await supabase
        .from('referral_settings')
        .select('*')
        .eq('referral_type', userType)
        .single();

      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    toast({
      title: 'Copied!',
      description: 'Referral code copied to clipboard',
    });
  };

  const handleShare = async () => {
    const shareText = `Join Crave'n Delivery using my code ${referralCode} and we both get rewards!`;
    const shareUrl = `${window.location.origin}/signup?ref=${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Crave\'n Delivery',
          text: shareText,
          url: shareUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: 'Link Copied!',
        description: 'Share link copied to clipboard',
      });
    }
  };

  const referralBonusAmount = (settings?.referrer_bonus_amount || 0) / 100;
  const referredBonusAmount = (settings?.referred_bonus_amount || 0) / 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Refer & Earn</h2>
        <p className="text-gray-600">
          Share the love and earn ${referralBonusAmount} for every friend you refer!
        </p>
      </div>

      {/* Referral Code Card */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
        <div className="text-center">
          <Gift className="w-16 h-16 mx-auto mb-4 text-orange-600" />
          <h3 className="text-xl font-bold mb-2">Your Referral Code</h3>
          <div className="flex gap-2 max-w-md mx-auto mb-4">
            <Input
              value={referralCode}
              readOnly
              className="text-center text-2xl font-bold tracking-wider bg-white"
            />
            <Button onClick={handleCopyCode} variant="outline">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button onClick={handleShare} className="bg-gradient-to-r from-orange-500 to-red-500">
            <Share2 className="w-4 h-4 mr-2" />
            Share Your Code
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Total Referrals</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">{stats.total_referrals}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{stats.completed_referrals}</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            ${(stats.pending_bonuses / 100).toFixed(2)}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Total Earned</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            ${(stats.total_earned / 100).toFixed(2)}
          </p>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-orange-600">1</span>
            </div>
            <h4 className="font-bold mb-2">Share Your Code</h4>
            <p className="text-sm text-gray-600">
              Send your unique code to friends via text, email, or social media
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-orange-600">2</span>
            </div>
            <h4 className="font-bold mb-2">They Sign Up</h4>
            <p className="text-sm text-gray-600">
              Your friend signs up using your code and gets ${referredBonusAmount} off their first order
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-orange-600">3</span>
            </div>
            <h4 className="font-bold mb-2">You Both Earn</h4>
            <p className="text-sm text-gray-600">
              After they complete their first order, you both receive ${referralBonusAmount} in credits!
            </p>
          </div>
        </div>
      </Card>

      {/* Requirements */}
      {settings?.requirements && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-bold mb-2">Requirements to Earn</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {settings.requirements.min_orders && (
              <li>Referred user must complete {settings.requirements.min_orders} order(s)</li>
            )}
            {settings.requirements.min_amount && (
              <li>Minimum order amount: ${(settings.requirements.min_amount / 100).toFixed(2)}</li>
            )}
            {settings.requirements.min_deliveries && (
              <li>Referred driver must complete {settings.requirements.min_deliveries} deliveries</li>
            )}
            {settings.requirements.min_revenue && (
              <li>Restaurant must generate ${(settings.requirements.min_revenue / 100).toFixed(2)} in revenue</li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}

