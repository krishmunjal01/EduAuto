import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import StatsCard from '@/components/StatsCard';
import EmptyState from '@/components/EmptyState';
import { Users, Send, Clock, UserPlus, Settings, BarChart3, FolderOpen, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { messagesSent, subscription } = useAppData();
  const navigate = useNavigate();

  const [sections, setSections] = useState<any[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [secRes, teachRes, leaveRes, infoRes] = await Promise.all([
        api.get('/admin/sections'),
        api.get('/admin/teachers'),
        api.get('/leaves'),
        api.get('/school/info')
      ]);
      setSections(secRes.data.sections);
      setTeacherAccounts(teachRes.data.teachers);
      setLeaveRequests(leaveRes.data.leaves);
      
      const setupCompleteMatch = infoRes.data.school.setup_complete;
      setSchoolInfo({ ...infoRes.data.school, schoolName: infoRes.data.school.school_name, setupComplete: setupCompleteMatch ?? false });
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const completeSetup = () => {
    // Need a real endpoint here. For now we just dismiss it from UI.
    setSchoolInfo(prev => prev ? { ...prev, setupComplete: true } : prev);
  };

  const totalStudents = sections.reduce((acc, s) => acc + (s.students?.length || 0), 0);
  const pendingLeaves = leaveRequests.filter((l: any) => l.status === 'pending').length;
  const hasData = totalStudents > 0 || teacherAccounts.length > 0;
  const studentUsagePercent = Math.min(100, (totalStudents / subscription.maxStudents) * 100);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold font-display">
          Welcome back, {user?.name} <span className="inline-block animate-float">👋</span>
        </h1>
        <p className="text-muted-foreground mt-1">{schoolInfo?.schoolName || 'School'} Administration Dashboard</p>
      </motion.div>

      {/* Onboarding Banner */}
      {schoolInfo && !schoolInfo.setupComplete && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-accent/20 bg-accent/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <FolderOpen className="w-32 h-32" />
          </div>
          <h2 className="text-xl font-bold mb-2">Welcome to your new workspace! 🚀</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
            You've successfully registered {schoolInfo.schoolName}. To get your school up and running, follow these quick steps:
          </p>
          <div className="flex gap-4">
            <button onClick={() => navigate('/sections')} className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity">
              1. Create a Section
            </button>
            <button onClick={() => navigate('/admin')} className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              2. Add Teachers
            </button>
            <button onClick={() => completeSetup()} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors ml-auto">
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Students" value={totalStudents} icon={<Users className="w-5 h-5 text-primary-foreground" />} delay={0} />
        <StatsCard title="Messages Sent" value={messagesSent} icon={<Send className="w-5 h-5 text-primary-foreground" />} delay={1} accent="bg-accent" />
        <StatsCard title="Active Teachers" value={teacherAccounts.length} icon={<UserPlus className="w-5 h-5 text-primary-foreground" />} delay={2} accent="bg-success" />
        <StatsCard title="Pending Leaves" value={pendingLeaves} icon={<Clock className="w-5 h-5 text-primary-foreground" />} delay={3} accent="bg-warning" />
      </div>

      {/* Plan usage banner */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="w-5 h-5 text-warning" />
          <div>
            <p className="text-sm font-medium">{subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan — {totalStudents}/{subscription.maxStudents >= 99999 ? '∞' : subscription.maxStudents} students</p>
            <Progress value={studentUsagePercent} className="h-1.5 w-48 mt-1" />
          </div>
        </div>
        {subscription.plan === 'free' && (
          <Badge className="bg-warning/20 text-warning cursor-pointer" onClick={() => navigate('/subscription')}>Upgrade</Badge>
        )}
      </motion.div>

      {!hasData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-8">
            <EmptyState icon={UserPlus} title="No teachers added yet"
              description="Start by adding teachers to your school. They'll be able to manage their sections and send reports."
              actionLabel="Add First Teacher" onAction={() => navigate('/admin')} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-8">
            <EmptyState icon={FolderOpen} title="Create sections"
              description="Create class sections and upload student CSV files. Teachers can then process report images."
              actionLabel="Create Section" onAction={() => navigate('/sections')} />
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display text-lg mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {[
                { icon: UserPlus, label: 'Add Teacher', path: '/admin', color: 'gradient-primary' },
                { icon: FolderOpen, label: 'Manage Sections', path: '/sections', color: 'bg-accent' },
                { icon: BarChart3, label: 'View Analytics', path: '/analytics', color: 'bg-success' },
                { icon: Clock, label: 'Manage Leaves', path: '/student-leave', color: 'bg-warning' },
              ].map((action, i) => (
                <motion.button key={i} whileHover={{ x: 4 }} onClick={() => navigate(action.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-all text-left group">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-foreground text-muted-foreground">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 glass rounded-2xl p-6">
            <h3 className="font-semibold font-display text-lg mb-4">Teachers ({teacherAccounts.length})</h3>
            {teacherAccounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teachers added yet.</p>
            ) : (
              <div className="space-y-2">
                {teacherAccounts.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {t.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.subject} · {t.section || 'No section'}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${t.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
