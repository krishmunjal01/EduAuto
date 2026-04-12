import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import EmptyState from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Send, FolderOpen, Clock, Image } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const DAYS_MAP: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [messagesSent] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [secRes, ttRes, leaveRes] = await Promise.all([
          api.get('/admin/sections'),
          api.get('/timetable'),
          api.get('/leaves')
        ]);
        const formatted = secRes.data.sections.map((sec: any) => ({
          id: sec.id,
          name: sec.section_name,
          subject: sec.subject || '',
          teacherEmails: (sec.allTeacherEmails || [sec.teacherSections?.[0]?.teacher?.email].filter(Boolean)).map((e: string) => e.toLowerCase()),
          students: sec.students.map((st: any) => ({
            id: st.student_id,
            name: st.name,
            rollNo: st.roll_number,
            parentName: st.parent_name || '',
            phone: st.parent_phone || '',
            marks: 0,
            subject: sec.subject || '',
            sectionId: sec.id,
            status: 'unmatched'
          })),
        }));
        setSections(formatted);
        setTimetables(ttRes.data.timetables || []);
        const leaves = leaveRes.data.leaves || [];
        setPendingLeaves(leaves.filter((l: any) => l.type === 'student' && l.status === 'pending').length);
      } catch(err) {
        console.error(err);
      }
    };
    fetchAll();
  }, []);

  const mySections = sections.filter(s => (s.teacherEmails || []).includes(user?.email?.toLowerCase()));
  const myStudentCount = mySections.reduce((acc, s) => acc + s.students.length, 0);

  // Today's schedule
  const todayName = DAYS_MAP[new Date().getDay()];
  const todaySchedule: { period: number; subject: string; section: string }[] = [];
  timetables.forEach(tt => {
    const daySlots = tt.grid[todayName];
    if (!daySlots) return;
    daySlots.forEach((slot, idx) => {
      if (slot.teacherEmail?.toLowerCase() === user?.email?.toLowerCase()) {
        todaySchedule.push({ period: idx + 1, subject: slot.subject, section: tt.sectionName });
      }
    });
  });
  todaySchedule.sort((a, b) => a.period - b.period);

  const currentHour = new Date().getHours();
  const currentPeriod = Math.max(1, Math.min(12, currentHour - 7));

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-bold font-display">
          Welcome, {user?.name} <span className="inline-block animate-float">👋</span>
        </h1>
        <p className="text-muted-foreground mt-1">Teacher Dashboard — Select a section, upload report images, and send results</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="My Students" value={myStudentCount} icon={<Users className="w-5 h-5 text-primary-foreground" />} delay={0} />
        <StatsCard title="My Sections" value={mySections.length} icon={<FolderOpen className="w-5 h-5 text-primary-foreground" />} delay={1} accent="bg-accent" />
        <StatsCard title="Messages Sent" value={messagesSent} icon={<Send className="w-5 h-5 text-primary-foreground" />} delay={2} accent="bg-success" />
        <StatsCard title="Pending Leaves" value={pendingLeaves} icon={<Clock className="w-5 h-5 text-primary-foreground" />} delay={3} accent="bg-warning" />
      </div>

      {/* Today's Schedule */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Today's Schedule — {todayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaySchedule.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No classes scheduled today. {todayName === 'Sunday' ? 'Enjoy your day off!' : 'Your timetable may not be set up yet.'}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {todaySchedule.map(slot => {
                  const isCurrent = slot.period === currentPeriod;
                  const isPast = slot.period < currentPeriod;
                  const isFree = slot.subject === 'Free' || slot.subject === 'Break';
                  return (
                    <div key={slot.period}
                      className={`rounded-xl p-4 border transition-all ${
                        isCurrent ? 'border-primary bg-primary/10 ring-2 ring-primary/30' :
                        isPast ? 'border-border opacity-60' : 'border-border glass'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground font-medium">Period {slot.period}</span>
                        {isCurrent && <Badge className="bg-primary text-[10px] px-1.5 h-4">NOW</Badge>}
                        {isFree && <Badge variant="outline" className="text-[10px] px-1.5 h-4">FREE</Badge>}
                      </div>
                      <p className={`font-semibold text-sm ${isFree ? 'text-muted-foreground' : ''}`}>{slot.subject}</p>
                      <p className="text-xs text-muted-foreground">{slot.section}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions for Teacher */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="glass rounded-2xl p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.button whileHover={{ y: -2 }} onClick={() => navigate('/sections')}
            className="p-4 rounded-xl glass hover:neon-border transition-all text-left">
            <FolderOpen className="w-6 h-6 text-accent mb-2" />
            <p className="font-medium text-sm">View Sections</p>
            <p className="text-xs text-muted-foreground">Browse assigned student data</p>
          </motion.button>
          <motion.button whileHover={{ y: -2 }} onClick={() => navigate('/report-images')}
            className="p-4 rounded-xl glass hover:neon-border transition-all text-left">
            <Image className="w-6 h-6 text-primary mb-2" />
            <p className="font-medium text-sm">Upload Reports</p>
            <p className="text-xs text-muted-foreground">Process images with OCR</p>
          </motion.button>
          <motion.button whileHover={{ y: -2 }} onClick={() => navigate('/student-leave')}
            className="p-4 rounded-xl glass hover:neon-border transition-all text-left">
            <Clock className="w-6 h-6 text-warning mb-2" />
            <p className="font-medium text-sm">Student Leaves</p>
            <p className="text-xs text-muted-foreground">Approve or reject requests</p>
          </motion.button>
        </div>
      </motion.div>

      {mySections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No sections assigned"
          description="Your admin hasn't assigned any sections to you yet. Contact your school administrator to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mySections.map((section, i) => (
            <motion.div key={section.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }} onClick={() => navigate('/sections')}
              className="glass rounded-2xl p-6 cursor-pointer hover:neon-border transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {section.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold font-display">{section.name}</h3>
                  <p className="text-sm text-muted-foreground">{section.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{section.students.length} students</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
