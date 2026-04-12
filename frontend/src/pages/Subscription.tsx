import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Crown, Users, MessageSquare, Sparkles, Check, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

const plans: { id: SubscriptionPlan; name: string; price: string; maxStudents: number; maxMessages: number; ai: boolean; features: string[] }[] = [
  {
    id: 'free', name: 'Free', price: '₹0/mo', maxStudents: 50, maxMessages: 100, ai: false,
    features: ['Up to 50 students', '100 messages/month', 'Basic reports', 'CSV upload', 'Leave management'],
  },
  {
    id: 'pro', name: 'Pro', price: '₹999/mo', maxStudents: 500, maxMessages: 2000, ai: true,
    features: ['Up to 500 students', '2,000 messages/month', 'AI insights enabled', 'Bulk reports', 'Priority support', 'Advanced analytics'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '₹4,999/mo', maxStudents: 99999, maxMessages: 99999, ai: true,
    features: ['Unlimited students', 'Unlimited messages', 'AI insights + custom models', 'Dedicated support', 'Custom integrations', 'White-label option'],
  },
];

const Subscription = () => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/subscription');
      setSubscription(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to connect to subscription service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: SubscriptionPlan) => {
    try {
      await api.post('/subscription/upgrade', { planId });
      toast({ title: `Upgraded successfully! 🎉` });
      fetchSubscription();
    } catch (err) {
      toast({ title: 'Upgrade failed', variant: 'destructive' });
    }
  };

  if (error) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive mb-2">
        <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <h2 className="text-xl font-bold font-display">Subscription Sync Failed</h2>
        <p className="text-sm opacity-80 max-w-md mx-auto mt-1">{error}</p>
      </div>
      <Button onClick={fetchSubscription} className="rounded-xl gradient-primary glow">
        <Loader2 className="w-4 h-4 mr-2" /> Retry Connection
      </Button>
    </div>
  );

  if (!subscription) return <div className="p-12 text-center text-muted-foreground">Initializing subscription...</div>;

  const studentUsagePercent = Math.min(100, (subscription.studentCount / subscription.maxStudents) * 100 || 0); // Note: backend should probably return studentCount too
  const messageUsagePercent = Math.min(100, (subscription.messagesUsedThisMonth / subscription.maxMessagesPerMonth) * 100);

  const currentPlan = plans.find(p => p.id === subscription.plan) || plans[0];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold font-display">Subscription</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your plan and usage in production</p>
      </motion.div>

      {/* Current Plan */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 neon-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl gradient-primary">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display uppercase tracking-tight">{subscription.plan} Plan</h3>
              <p className="text-sm text-muted-foreground">Valid till: {subscription.validTill}</p>
            </div>
          </div>
          <Badge className="gradient-primary text-primary-foreground text-sm px-3 py-1">{plans.find(p => p.id === subscription.plan)?.price}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" />Students</span>
              <span className={`font-medium ${studentUsagePercent > 90 ? 'text-destructive' : ''}`}>
                {subscription.maxStudents >= 99999 ? 'Unlimited' : `${subscription.maxStudents} limit`}
              </span>
            </div>
            {/* Usage indicators */}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="w-4 h-4" />Messages this month</span>
              <span className={`font-medium ${messageUsagePercent > 90 ? 'text-destructive' : ''}`}>
                {subscription.messagesUsedThisMonth} / {subscription.maxMessagesPerMonth >= 99999 ? '∞' : subscription.maxMessagesPerMonth}
              </span>
            </div>
            <Progress value={messageUsagePercent} className="h-2" />
            {messageUsagePercent >= 90 && <p className="text-xs text-destructive">⚠️ Message quota almost exceeded</p>}
          </div>
        </div>
      </motion.div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, i) => {
          const isCurrent = plan.id === subscription.plan;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className={`glass border-border h-full ${isCurrent ? 'neon-border' : ''} ${plan.id === 'pro' ? 'relative overflow-hidden' : ''}`}>
                {plan.id === 'pro' && (
                  <div className="absolute top-0 right-0 gradient-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    POPULAR
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {plan.id === 'enterprise' ? <Zap className="w-5 h-5 text-warning" /> : plan.id === 'pro' ? <Sparkles className="w-5 h-5 text-accent" /> : <Crown className="w-5 h-5 text-muted-foreground" />}
                    {plan.name}
                  </CardTitle>
                  <p className="text-2xl font-bold font-display">{plan.price}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-success shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full rounded-xl ${isCurrent ? '' : 'gradient-primary glow'}`}
                    variant={isCurrent ? 'outline' : 'default'}
                    disabled={isCurrent}
                    onClick={() => handleUpgrade(plan.id)}>
                    {isCurrent ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Subscription;
