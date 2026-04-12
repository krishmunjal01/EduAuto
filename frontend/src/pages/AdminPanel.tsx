import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import EmptyState from '@/components/EmptyState';
import { Plus, Trash2, Eye, EyeOff, Copy, UserPlus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const generatePassword = () => {
  return `Edu${Math.random().toString(36).slice(2, 8)}!${Math.floor(Math.random() * 100)}`;
};

const AdminPanel = () => {
  const { addNotification, addAuditLog } = useAppData();
  const { toast } = useToast();
  
  const [teacherAccounts, setTeacherAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState(''); // Kept for UI compat, might not be saved unless passed
  const [section, setSection] = useState(''); // Kept for UI compat
  const [password, setPassword] = useState(generatePassword());
  const [showPassword, setShowPassword] = useState(false);

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeacherAccounts(res.data.teachers);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleAdd = async () => {
    if (!name || !email || !password) {
      toast({ title: 'Error', description: 'Please fill name, email and password', variant: 'destructive' });
      return;
    }

    try {
      await api.post('/admin/teachers', {
        name,
        email,
        password,
        subject,
        sectionName: section
      });

      await fetchTeachers();
      addNotification(`Teacher "${name}" added successfully`, 'success', 'admin');
      addAuditLog('teacher_added', 'Admin', 'admin', `Added teacher "${name}" (${email})`);
      toast({ title: 'Teacher account created! 👨‍🏫', description: 'They can now login.' });

      setShowAddModal(false);
      setName(''); setEmail(''); setSubject(''); setSection('');
      setPassword(generatePassword());
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to add teacher', variant: 'destructive' });
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this teacher?')) return;
    
    try {
      await api.delete(`/admin/teachers/${id}`);
      await fetchTeachers();
      addNotification(`Teacher removed`, 'error', 'admin');
      toast({ title: 'Teacher removed', variant: 'destructive' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to delete teacher', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied! 📋' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Teacher Management</h1>
          <p className="text-sm text-muted-foreground">Add, manage, and configure teacher accounts</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="rounded-xl gradient-primary glow">
          <Plus className="w-4 h-4 mr-2" />Add Teacher
        </Button>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold font-display text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />Add New Teacher
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Full Name *</Label>
                <Input placeholder="Dr. Meera Iyer" value={name} onChange={e => setName(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email / Username *</Label>
                <Input placeholder="meera@school.com" value={email} onChange={e => setEmail(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Subject *</Label>
                <Input placeholder="Mathematics" value={subject} onChange={e => setSubject(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Section (optional)</Label>
                <Input placeholder="10-A" value={section} onChange={e => setSection(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground">Password</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      className="bg-secondary/50 border-glass-border rounded-xl pr-20 font-mono" />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <button onClick={() => setShowPassword(!showPassword)} className="p-1 hover:text-foreground text-muted-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => copyToClipboard(password)} className="p-1 hover:text-foreground text-muted-foreground">
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setPassword(generatePassword())} className="rounded-xl border-glass-border">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAdd} className="rounded-xl gradient-primary glow">Create Account</Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl border-glass-border">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {teacherAccounts.length === 0 ? (
        <EmptyState icon={UserPlus} title="No teachers added yet"
          description="Add your first teacher to give them access to the platform. They'll receive an access code to sign up."
          actionLabel="Add First Teacher" onAction={() => setShowAddModal(true)} />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Access Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherAccounts.map((t, i) => (
                <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{t.subject || '—'}</TableCell>
                  <TableCell>{t.sectionName || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground italic">Use Email & Pass</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={t.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => handleRemove(t.id)}
                      className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
