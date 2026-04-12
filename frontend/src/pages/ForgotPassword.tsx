import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast({ title: 'Error', description: 'Enter your email', variant: 'destructive' }); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setLoading(false);
    toast({ title: 'Email sent! 📧', description: 'Check your inbox for reset instructions' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'hsl(222 47% 6%)' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-primary" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md relative z-10">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-2xl gradient-primary glow">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display gradient-text">EduAuto Pro</h1>
          </div>

          {sent ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Check your email</h2>
              <p className="text-muted-foreground mb-6">We've sent password reset instructions to {email}</p>
              <Link to="/login"><Button variant="outline" className="rounded-xl border-glass-border"><ArrowLeft className="w-4 h-4 mr-2" /> Back to login</Button></Link>
            </motion.div>
          ) : (
            <>
              <p className="text-center text-muted-foreground mb-6">Enter your email to reset your password</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <Input type="email" placeholder="you@school.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-12" />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 text-base font-semibold glow">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                <Link to="/login" className="text-accent hover:underline font-medium"><ArrowLeft className="w-4 h-4 inline mr-1" />Back to login</Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
