import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';

const roles: { value: UserRole; label: string; icon: string }[] = [
  { value: 'admin', label: 'School Admin', icon: '🏫' },
  { value: 'teacher', label: 'Teacher', icon: '👨‍🏫' },
  { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧' },
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await login(email, password, role);
      toast({ title: 'Welcome back! 🎉', description: 'Login successful' });
      if (role === 'admin') navigate('/dashboard');
      else if (role === 'teacher') navigate('/teacher-dashboard');
      else navigate('/parent-portal');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Wrong credentials, please check and try again';
      toast({ title: 'Login Failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'hsl(222 47% 6%)' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-primary" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'hsl(192 95% 55%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="w-full max-w-md relative z-10">
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-2xl gradient-primary glow">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display gradient-text">EduAuto</h1>
          </motion.div>

          <p className="text-center text-muted-foreground mb-6">Sign in to your account</p>

          <div className="flex gap-2 mb-6">
            {roles.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)}
                className={`flex-1 p-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  role === r.value ? 'gradient-primary text-primary-foreground glow scale-105' : 'glass hover:bg-secondary/50'
                }`}>
                <span className="block text-lg mb-1">{r.icon}</span>{r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-muted-foreground">Email</Label>
              <Input id="email" type="email" placeholder="you@school.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-12" />
            </div>
            <div className="relative">
              <Label htmlFor="password" className="text-muted-foreground">Password</Label>
              <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-12 pr-12" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-accent hover:underline">Forgot password?</Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 transition-all text-base font-semibold glow">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent hover:underline font-medium">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
