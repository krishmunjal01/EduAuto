import { useState, useEffect, useMemo } from 'react';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/EmptyState';
import { motion } from 'framer-motion';
import { RefreshCw, UserCheck, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const DAYS_MAP: Record<number, string> = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };

const getDatesBetween = (from: string, to: string): string[] => {
  const dates: string[] = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
};

const getDayName = (dateStr: string): string => {
  return DAYS_MAP[new Date(dateStr).getDay()] || '';
};

const Substitution = () => {
  const { addNotification } = useAppData();
  const [timetables, setTimetables] = useState<any[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<any[]>([]);
  const [allSubs, setAllSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [ttRes, teacherRes, subRes] = await Promise.all([
        api.get('/timetable'),
        api.get('/admin/teachers'),
        api.get('/timetable/substitutions')
      ]);
      setTimetables(ttRes.data.timetables);
      setTeacherAccounts(teacherRes.data.teachers);
      setAllSubs(subRes.data.substitutions || []);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFreeTeachers = (day: string, periodIndex: number, absentEmail: string) => {
    const busyEmails = new Set<string>();
    timetables.forEach(tt => {
      const slot = tt.grid[day]?.[periodIndex];
      if (slot?.teacherEmail) busyEmails.add(slot.teacherEmail);
    });
    busyEmails.add(absentEmail);
    return teacherAccounts.filter(t => t.status === 'active' && !busyEmails.has(t.email));
  };

  const handleAssign = async (sub: any, teacherEmail: string) => {
    try {
      await api.put(`/timetable/substitutions/${sub.id}`, { substituteTeacherEmail: teacherEmail });
      await fetchData();
      addNotification(`Teacher assigned as substitute for ${sub.subject} P${sub.periodIndex + 1}`, 'success', 'admin');
      toast.success('Substitute assigned successfully');
    } catch (err) {
      toast.error('Failed to assign substitute');
    }
  };

  if (allSubs.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-2xl font-bold font-display">Substitution Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Auto-detect and assign substitutes for absent teachers</p>
        </motion.div>
        <EmptyState icon={RefreshCw} title="No substitutions needed" description="Substitution needs appear automatically when teacher leave is approved and a timetable exists. Substitutions are date-specific." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold font-display">Substitution Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {allSubs.filter(s => s.status === 'pending').length} pending · {allSubs.filter(s => s.status === 'assigned').length} assigned
        </p>
      </motion.div>

      <div className="space-y-4">
        {allSubs.map((sub, i) => {
          const freeTeachers = getFreeTeachers(sub.day, sub.periodIndex, sub.absentTeacherEmail);
          return (
            <motion.div key={sub.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={`glass border-border ${sub.status === 'pending' ? 'border-l-4 border-l-warning' : 'border-l-4 border-l-success'}`}>
                <CardContent className="pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{sub.sectionName}</h3>
                        <Badge variant="outline">{sub.date}</Badge>
                        <Badge variant="outline">{sub.day} · Period {sub.periodIndex + 1}</Badge>
                        <Badge className={sub.status === 'assigned' ? 'bg-success' : 'bg-warning'}>
                          {sub.status === 'assigned' ? <><UserCheck className="w-3 h-3 mr-1" /> Assigned</> : <><Clock className="w-3 h-3 mr-1" /> Pending</>}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{sub.subject}</span> — {sub.absentTeacherName} (on leave)
                      </p>
                      {sub.substituteTeacherName && (
                        <p className="text-sm text-success">Substitute: {sub.substituteTeacherName}</p>
                      )}
                    </div>

                    {sub.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        {freeTeachers.length > 0 ? (
                          <Select onValueChange={v => handleAssign(sub, v)}>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Assign teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {freeTeachers.map(t => (
                                <SelectItem key={t.email} value={t.email}>
                                  {t.name} ({t.subject})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-1 text-sm text-warning">
                            <AlertTriangle className="w-4 h-4" /> No free teachers
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Substitution;
