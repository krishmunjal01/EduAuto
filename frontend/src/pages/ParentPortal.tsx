import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Download, Bell, Calendar as CalendarIcon, BookOpen, ClipboardList, Plus, User, Clock, CheckCircle2, XCircle, AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusColors = {
  pending: 'bg-warning/20 text-warning border-warning/20',
  approved: 'bg-success/20 text-success border-success/20',
  rejected: 'bg-destructive/20 text-destructive border-destructive/20',
};

const ParentPortal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'leaves' | 'notifications'>('overview');
  
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ total: 0, present: 0, absent: 0, late: 0, rate: 100 });
  const [childInfo, setChildInfo] = useState<any>(null);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Child & Section Info
      const studentsRes = await api.get('/school/students');
      const myChild = studentsRes.data.students.find((s: any) => s.studentId === user?.studentId);
      
      if (myChild) {
        setChildInfo(myChild);
        
        // Fetch specific data
        try {
          const ttRes = await api.get(`/timetable/section/${myChild.sectionId}`);
          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          const todaySlots = (ttRes.data.timetable || []).filter((s: any) => s.day === today);
          setTodaySchedule(todaySlots.sort((a: any, b: any) => a.period - b.period));
        } catch(e) { console.error(e) }
        
        try {
          const attRes = await api.get('/attendance/records');
          const records = (attRes.data.records || []).filter((r: any) => r.studentName === myChild.name);
          const present = records.filter((r: any) => r.status === 'present').length;
          const absent = records.filter((r: any) => r.status === 'absent').length;
          const late = records.filter((r: any) => r.status === 'late').length;
          const total = records.length;
          setAttendanceStats({
            total, present, absent, late,
            rate: total === 0 ? 100 : Math.round(((present + late) / total) * 100)
          });
        } catch(e) { console.error(e) }
      }

      // Other generic fetches
      try {
        const leavesRes = await api.get('/leaves');
        setMyLeaves(leavesRes.data.leaves || []);
      } catch(e) {}
      
      try {
        const analyticsRes = await api.get('/school/analytics');
        setPerformanceData(analyticsRes.data.performanceData || []);
      } catch(e) {}

      try {
        const notifRes = await api.get('/school/notifications');
        setNotifications(notifRes.data.notifications || []);
      } catch(e) {}

    } catch(err) { 
      console.error('Error fetching parent portal data:', err); 
    } finally {
      setLoading(false);
    }
  }, [user?.studentId]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const DAYS_MAP: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
  const todayName = DAYS_MAP[new Date().getDay()];
  
  const currentHour = new Date().getHours();
  const currentPeriod = Math.max(1, Math.min(12, currentHour - 7));

  const handleApplyLeave = async () => {
    if (!leaveFrom || !leaveTo || !leaveReason) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    try {
      const res = await api.post('/leaves/apply', {
        type: 'student',
        from_date: new Date(leaveFrom).toISOString(),
        to_date: new Date(leaveTo).toISOString(),
        reason: leaveReason
      });
      setMyLeaves(prev => [res.data.leave, ...prev]);
      toast({ title: 'Leave Applied ✅', description: 'Your leave request has been submitted for review.' });
      setShowLeaveForm(false); setLeaveFrom(''); setLeaveTo(''); setLeaveReason('');
    } catch(err: any) {
      toast({ title: 'Application failed', description: err.response?.data?.error || 'Server error', variant: 'destructive' });
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/school/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) { console.error(e); }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">Syncing child's data...</p>
    </div>
  );

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BookOpen },
    { id: 'leaves' as const, label: 'Leave Tracker', icon: CalendarIcon },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Parent Portal</h1>
          <p className="text-sm text-muted-foreground">Production secure access to {childInfo?.name || 'child'}'s details</p>
        </div>
        <div className="flex items-center gap-2">
           {notifications.some(n => !n.read) && <Badge className="bg-destructive animate-pulse h-2 w-2 p-0 rounded-full" />}
           <Button variant="ghost" size="sm" onClick={() => setActiveTab('notifications')} className="rounded-full h-10 w-10 p-0 glass hover:glow">
             <Bell className="w-5 h-5 text-primary" />
           </Button>
        </div>
      </div>

      <div className="flex gap-2 p-1 glass rounded-2xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id ? 'gradient-primary text-primary-foreground glow shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 neon-border relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 gradient-primary opacity-5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-xl shadow-primary/30">
                {childInfo?.name?.[0] || <User className="w-10 h-10" />}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold font-display tracking-tight">{childInfo?.name || 'Connecting...'}</h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">Student ID: {childInfo?.studentId || 'N/A'}</Badge>
                  <p className="text-sm font-medium text-muted-foreground">Class: <span className="text-foreground">{childInfo?.sectionName || 'Not Assigned'}</span></p>
                  <p className="text-sm font-medium text-muted-foreground">Roll Number: <span className="text-foreground font-bold">{childInfo?.rollNo || 'N/A'}</span></p>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { icon: ClipboardList, val: `${attendanceStats.rate}%`, label: 'Attendance', color: 'text-primary', bg: 'bg-primary/5' },
               { icon: CheckCircle2, val: attendanceStats.present, label: 'Present', color: 'text-success', bg: 'bg-success/5' },
               { icon: XCircle, val: attendanceStats.absent, label: 'Absent', color: 'text-destructive', bg: 'bg-destructive/5' },
               { icon: AlertTriangle, val: attendanceStats.late, label: 'Late', color: 'text-warning', bg: 'bg-warning/5' }
             ].map((stat, i) => (
               <motion.div key={i} whileHover={{ y: -5 }} className={`glass rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all hover:glow ${stat.bg}`}>
                 <stat.icon className={`w-6 h-6 ${stat.color} mb-3`} />
                 <p className={`text-3xl font-bold font-display ${stat.color}`}>{stat.val}</p>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
               </motion.div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass border-border lg:col-span-2 overflow-hidden">
              <CardHeader className="pb-2 border-b border-glass-border mb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Today's Schedule — {todayName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySchedule.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground/20 mx-auto" strokeWidth={1} />
                    <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">No classes scheduled today. {todayName === 'Sunday' ? 'Enjoy your family time!' : 'Timetable update pending.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                    {todaySchedule.map((slot, idx) => {
                      const isCurrent = slot.period === currentPeriod;
                      const isPast = slot.period < currentPeriod;
                      return (
                        <div key={idx} className={`rounded-xl p-4 border transition-all flex items-center justify-between ${
                            isCurrent ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-1 ring-primary/30' :
                            isPast ? 'border-border/50 opacity-40' : 'border-glass-border glass hover:bg-secondary/30'
                          }`}>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Period {slot.period}</p>
                            <p className={`font-bold font-display truncate ${isCurrent ? 'text-primary' : ''}`}>{slot.subject}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{slot.startTime || `${slot.period + 7}:00`} - {slot.endTime || `${slot.period + 8}:00`}</p>
                          </div>
                          {isCurrent && <Badge className="gradient-primary animate-pulse border-none">LIVE</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass border-border overflow-hidden">
              <CardHeader className="pb-2 border-b border-glass-border mb-4">
                 <CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-success" /> Performance Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {performanceData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <Brain className="w-10 h-10 text-muted-foreground/20 mb-3" />
                    <p className="text-xs text-muted-foreground">Results will appear here as the academic session progresses.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(222 30% 12%)" />
                      <XAxis dataKey="month" hide />
                      <YAxis domain={[0, 100]} hide />
                      <Tooltip 
                        contentStyle={{ background: 'hsl(222 47% 8%)', border: '1px solid hsl(222 30% 20%)', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Line type="monotone" dataKey="classAvg" stroke="hsl(245 58% 51%)" strokeWidth={3} dot={{ r: 4, fill: 'hsl(245 58% 51%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display">Student Leave Management</h2>
            <Button onClick={() => setShowLeaveForm(!showLeaveForm)} className="rounded-xl gradient-primary glow px-6">
              <Plus className="w-4 h-4 mr-2" />Apply New Leave
            </Button>
          </div>

          {showLeaveForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-6 space-y-4 border-primary/20">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs px-1 font-bold text-muted-foreground">From Date</Label>
                  <Input type="date" value={leaveFrom} onChange={e => setLeaveFrom(e.target.value)} className="bg-secondary/50 border-glass-border rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs px-1 font-bold text-muted-foreground">To Date</Label>
                  <Input type="date" value={leaveTo} onChange={e => setLeaveTo(e.target.value)} className="bg-secondary/50 border-glass-border rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs px-1 font-bold text-muted-foreground">Reason for Absence</Label>
                <Textarea value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder="Please explain the reason for leave..." className="bg-secondary/50 border-glass-border rounded-xl resize-none h-24" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleApplyLeave} className="rounded-xl gradient-primary px-8">Submit Application</Button>
                <Button variant="outline" onClick={() => setShowLeaveForm(false)} className="rounded-xl border-glass-border">Cancel</Button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myLeaves.length === 0 ? (
              <div className="col-span-full">
                <EmptyState icon={ClipboardList} title="No leave history" description="Submit your first leave request using the button above." />
              </div>
            ) : myLeaves.map((leave, i) => (
              <motion.div key={leave.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5 hover:glow group transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-bold text-muted-foreground flex items-center gap-2 tracking-tight">
                    <CalendarIcon className="w-3.5 h-3.5" /> {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()}
                  </div>
                  <Badge variant="outline" className={`rounded-lg font-bold text-[10px] px-2 capitalize ${statusColors[leave.status as keyof typeof statusColors]}`}>
                    {leave.status}
                  </Badge>
                </div>
                <p className="text-sm font-medium line-clamp-3 mb-2">{leave.reason}</p>
                {leave.status === 'approved' && <p className="text-[10px] text-success font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved by Admin</p>}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {notifications.length === 0 ? (
            <EmptyState icon={Bell} title="Your inbox is empty" description="Any school circulars or child-specific updates will appear here." />
          ) : notifications.map(notif => (
            <motion.div 
               key={notif.id} onClick={() => markRead(notif.id)}
               initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
               className={`glass rounded-2xl p-5 cursor-pointer transition-all border-l-4 hover:bg-secondary/20 ${notif.read ? 'border-l-transparent text-muted-foreground' : 'border-l-primary neon-border'}`}>
               <div className="flex items-center justify-between mb-1">
                 <h4 className={`font-bold font-display ${!notif.read ? 'text-primary' : ''}`}>{notif.title}</h4>
                 <span className="text-[10px]">{new Date(notif.createdAt).toLocaleDateString()}</span>
               </div>
               <p className="text-sm leading-relaxed">{notif.message}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParentPortal;
