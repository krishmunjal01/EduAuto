import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useAppData, SchoolInfo } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2, Lock, Shield, Mail, Building, MapPin, Phone } from 'lucide-react';

const roles: { value: UserRole; label: string; icon: string; desc: string }[] = [
  { value: 'admin', label: 'School Admin', icon: '🏫', desc: 'Register your school and get started' },
  { value: 'teacher', label: 'Teacher', icon: '👨‍🏫', desc: 'Requires access code from admin' },
  { value: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: 'Link with your child\'s Student ID' },
];

const Signup = () => {
  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('admin');
  
  // Role-specific fields
  const [accessCode, setAccessCode] = useState('');
  const [studentId, setStudentId] = useState('');
  
  // Admin / School specific fields
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [board, setBoard] = useState('');
  const [affiliationId, setAffiliationId] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  
  const { signup } = useAuth();
  const { setSchoolInfo } = useAppData();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-generate school code based on school name
  useEffect(() => {
    if (role === 'admin' && schoolName && !schoolCode) {
      const parts = schoolName.trim().split(/\s+/);
      let code = '';
      if (parts.length === 1) {
        code = parts[0].substring(0, 3).toUpperCase();
      } else {
        code = parts.map(p => p[0]).join('').substring(0, 4).toUpperCase();
      }
      setSchoolCode(code);
    }
  }, [schoolName]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast({ title: 'Error', description: 'Please fill out your personal details', variant: 'destructive' });
      return;
    }

    if (role === 'admin') {
      if (!schoolName || !schoolCode || !city || !state || !contactNumber) {
        toast({ title: 'Error', description: 'Please fill out all required school details', variant: 'destructive' });
        return;
      }
    } else if (role === 'teacher' && !accessCode) {
      toast({ title: 'Error', description: 'Access code is required for teachers', variant: 'destructive' });
      return;
    } else if (role === 'parent' && !studentId) {
      toast({ title: 'Error', description: 'Student ID is required for parents', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const extraFields = {
        accessCode, studentId, schoolCode,
        schoolName, board, affiliationId, address, city, state, contactNumber, schoolEmail
      };
      await signup(name, email, password, role, extraFields);
      
      if (role === 'admin') {
        const newSchool: SchoolInfo = {
          schoolName,
          schoolCode,
          board,
          affiliationId,
          address,
          city,
          state,
          contactNumber,
          schoolEmail: schoolEmail || email,
          setupComplete: false,
          attendanceMode: 'daily'
        };
        setSchoolInfo(newSchool);
        toast({ title: 'School Registered! 🏫', description: 'Welcome to EduAuto. Let\'s set up your school.' });
        navigate('/dashboard');
      } else if (role === 'teacher') {
        toast({ title: 'Account created! 🎉', description: 'Welcome to your Teacher Dashboard' });
        navigate('/teacher-dashboard');
      } else {
        toast({ title: 'Account created! 🎉', description: 'Welcome to the Parent Portal' });
        navigate('/parent-portal');
      }
    } catch {
      if (role === 'teacher') {
        toast({ title: 'Invalid Access Code', description: 'Please contact your school administrator for a valid access code.', variant: 'destructive' });
      } else {
        toast({ title: 'Error', description: 'Signup failed. Please try again.', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'hsl(222 47% 6%)' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl gradient-primary" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full opacity-15 blur-3xl" style={{ background: 'hsl(192 95% 55%)' }} />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-2xl relative z-10 py-10">
        <div className="glass rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-2xl gradient-primary glow">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-display gradient-text">EduAuto</h1>
          </motion.div>

          <p className="text-center text-muted-foreground mb-6">Create your account to get started</p>

          {/* Role Selection */}
          <div className="flex flex-col sm:flex-row gap-2 mb-6">
            {roles.map(r => (
              <button key={r.value} onClick={() => setRole(r.value)} type="button"
                className={`flex-1 p-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  role === r.value ? 'gradient-primary text-primary-foreground glow scale-105' : 'glass hover:bg-secondary/50'
                }`}>
                <span className="block text-lg mb-1">{r.icon}</span>{r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            
            {/* Split Form into 2 columns if Admin */}
            <div className={`grid grid-cols-1 ${role === 'admin' ? 'md:grid-cols-2 gap-6' : 'gap-4 max-w-md mx-auto'}`}>
              
              {/* Left Column (Personal Details) */}
              <div className="space-y-4">
                {role === 'admin' && <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4">Admin Profile</h3>}
                <div>
                  <Label className="text-muted-foreground">Full Name *</Label>
                  <Input placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                </div>
                <div>
                  <Label className="text-muted-foreground">Email *</Label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                </div>
                <div>
                  <Label className="text-muted-foreground">Password *</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                </div>

                {/* Teacher: Access Code */}
                <AnimatePresence>
                  {role === 'teacher' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Label className="text-muted-foreground flex items-center gap-1.5 mt-2">
                        <Shield className="w-3.5 h-3.5" />Access Code *
                      </Label>
                      <Input placeholder="Enter access code" value={accessCode} onChange={e => setAccessCode(e.target.value)}
                        className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11 font-mono tracking-wider" required />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Parent: Student ID */}
                <AnimatePresence>
                  {role === 'parent' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <Label className="text-muted-foreground mt-2">Student ID *</Label>
                      <Input placeholder="e.g., SCH_0001" value={studentId} onChange={e => setStudentId(e.target.value)}
                        className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Column (School Details) - Only for Admin */}
              <AnimatePresence>
                {role === 'admin' && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                    <h3 className="text-lg font-semibold border-b border-border pb-2 mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4 text-primary" /> School Details
                    </h3>
                    
                    <div>
                      <Label className="text-muted-foreground">School Name *</Label>
                      <Input placeholder="Delhi Public School" value={schoolName} onChange={e => setSchoolName(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-muted-foreground">School Code *</Label>
                        <Input placeholder="DPS" value={schoolCode} onChange={e => setSchoolCode(e.target.value.toUpperCase())} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11 font-mono uppercase" required />
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Board</Label>
                        <Input placeholder="CBSE, ICSE, etc." value={board} onChange={e => setBoard(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" />
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Affiliation ID</Label>
                      <Input placeholder="Optional" value={affiliationId} onChange={e => setAffiliationId(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3"/> City *</Label>
                        <Input placeholder="New Delhi" value={city} onChange={e => setCity(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                      </div>
                      <div>
                        <Label className="text-muted-foreground">State *</Label>
                        <Input placeholder="Delhi" value={state} onChange={e => setState(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3"/> Contact Number *</Label>
                      <Input placeholder="+91 9876543210" value={contactNumber} onChange={e => setContactNumber(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl h-11" required />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            <div className={role === 'admin' ? 'mt-8 pt-4 border-t border-border/50' : 'max-w-md mx-auto pt-4'}>
              <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary hover:opacity-90 text-base font-semibold glow">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </Button>
            </div>
          </form>

          {/* Request Access for teachers */}
          {role === 'teacher' && (
            <div className="mt-4 max-w-md mx-auto">
              <button onClick={() => setShowRequestAccess(true)} className="text-sm text-accent hover:underline w-full text-center">
                <Mail className="w-3.5 h-3.5 inline mr-1" />Don't have an access code? Request access
              </button>
            </div>
          )}

          {/* Request Access Form */}
          <AnimatePresence>
            {showRequestAccess && role === 'teacher' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 glass rounded-xl space-y-3 max-w-md mx-auto">
                <h4 className="text-sm font-semibold">Request Access</h4>
                <Input placeholder="Your name" className="bg-secondary/50 border-glass-border rounded-xl h-10 text-sm" />
                <Input placeholder="School name" className="bg-secondary/50 border-glass-border rounded-xl h-10 text-sm" />
                <Input type="email" placeholder="Your email" className="bg-secondary/50 border-glass-border rounded-xl h-10 text-sm" />
                <Button onClick={() => setShowRequestAccess(false)} size="sm" className="w-full rounded-xl gradient-primary text-sm">
                  Submit Request
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
