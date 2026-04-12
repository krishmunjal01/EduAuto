import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, AlertTriangle, UserCheck, UserX, Clock, ClipboardCheck, Calendar } from 'lucide-react';
import StatsCard from '@/components/StatsCard';

const AdminAttendance = () => {
  const { addNotification, addAuditLog } = useAppData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterSection, setFilterSection] = useState<string>('all');

  const [sections, setSections] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState<any[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const [secRes, attRes, corrRes, teachRes] = await Promise.all([
        api.get('/admin/sections'),
        api.get('/attendance/records'),
        api.get('/attendance/corrections'),
        api.get('/admin/teachers')
      ]);
      setSections(secRes.data.sections.map((s: any) => ({ ...s, name: s.section_name })));
      
      const attFormatted = attRes.data.records.reduce((acc: any, r: any) => {
        const key = `${r.sectionId}_${r.date}`;
        if (!acc[key]) acc[key] = { id: r.id, sectionId: r.sectionId, date: r.date, presentStudents: [], absentStudents: [], lateStudents: [], teacherEmail: r.markedBy };
        if (r.status === 'present') acc[key].presentStudents.push(r.studentId);
        else if (r.status === 'absent') acc[key].absentStudents.push(r.studentId);
        else acc[key].lateStudents.push(r.studentId);
        return acc;
      }, {});
      setAttendanceRecords(Object.values(attFormatted));
      setAttendanceCorrections(corrRes.data.corrections.map((c: any) => ({
        id: c.id, recordId: c.attendanceId, teacherEmail: c.requestedBy, reason: c.reason, status: c.status
      })));
      setTeacherAccounts(teachRes.data.teachers);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingCorrections = attendanceCorrections.filter(c => c.status === 'pending');

  const handleApproveCorrection = async (correctionId: string) => {
    try {
      await api.put(`/attendance/corrections/${correctionId}/status`, { status: 'approved' });
      await fetchData();
      addNotification('Attendance correction approved by admin', 'success', 'teacher');
      addAuditLog('correction_approved', user?.name || '', user?.role || '', `Approved correction ${correctionId}`);
      toast({ title: 'Correction Approved', description: 'Changes saved successfully.' });
    } catch(e) {
      toast({ title: 'Error processing correction', variant: 'destructive' });
    }
  };

  const handleRejectCorrection = async (correctionId: string) => {
    try {
      await api.put(`/attendance/corrections/${correctionId}/status`, { status: 'rejected' });
      await fetchData();
      addNotification('Attendance correction rejected by admin', 'error', 'teacher');
      addAuditLog('correction_rejected', user?.name || '', user?.role || '', `Rejected correction ${correctionId}`);
      toast({ title: 'Correction Rejected' });
    } catch(e) {
      toast({ title: 'Error processing correction', variant: 'destructive' });
    }
  };

  // School-wide statistics for filterDate
  const filteredRecords = attendanceRecords.filter(r => r.date === filterDate && (filterSection === 'all' || r.sectionId === filterSection));
  const totalPresent = filteredRecords.reduce((acc, r) => acc + r.presentStudents.length, 0);
  const totalAbsent = filteredRecords.reduce((acc, r) => acc + r.absentStudents.length, 0);
  const totalLate = filteredRecords.reduce((acc, r) => acc + r.lateStudents.length, 0);
  const totalStudents = filteredRecords.reduce((acc, r) => {
    const sec = sections.find(s => s.id === r.sectionId);
    return acc + (sec ? sec.students.length : 0);
  }, 0);
  const attendanceRate = totalStudents === 0 ? 0 : Math.round((totalPresent / totalStudents) * 100);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">System-wide Attendance</h1>
          <p className="text-sm text-muted-foreground">Monitor school attendance and approve correction requests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-xl bg-background/50 pl-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-transparent border-none outline-none text-sm p-2" />
          </div>
          <Select value={filterSection} onValueChange={setFilterSection}>
            <SelectTrigger className="w-40 h-9 rounded-xl"><SelectValue placeholder="All Sections" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Present Today" value={totalPresent} icon={<UserCheck className="w-5 h-5 text-primary-foreground" />} delay={0} />
        <StatsCard title="Absent Today" value={totalAbsent} icon={<UserX className="w-5 h-5 text-primary-foreground" />} delay={0.1} accent="bg-destructive" />
        <StatsCard title="Late Today" value={totalLate} icon={<Clock className="w-5 h-5 text-primary-foreground" />} delay={0.2} accent="bg-warning" />
        <StatsCard title="Attendance Rate" value={`${attendanceRate}%`} icon={<ClipboardCheck className="w-5 h-5 text-primary-foreground" />} delay={0.3} accent="bg-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl overflow-hidden p-6">
            <h3 className="font-display font-semibold mb-4">Attendance Logs ({filteredRecords.length} classes verified)</h3>
            
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No records found for this date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRecords.map(r => {
                  const sec = sections.find(s => s.id === r.sectionId);
                  const teacher = teacherAccounts.find(t => t.email === r.teacherEmail);
                  return (
                    <div key={r.id} className="flex justify-between items-center p-4 rounded-xl border border-glass-border hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="font-bold">{sec?.name} <span className="text-muted-foreground font-normal text-sm ml-2">by {teacher?.name || r.teacherEmail}</span></p>
                        <p className="text-sm text-foreground/70">{sec?.subject}</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-success">{r.presentStudents.length}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Present</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-destructive">{r.absentStudents.length}</p>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Absent</p>
                        </div>
                        {r.lateStudents.length > 0 && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-warning">{r.lateStudents.length}</p>
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Late</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Action Required</h3>
              {pendingCorrections.length > 0 && <Badge className="bg-destructive text-destructive-foreground">{pendingCorrections.length} Pending</Badge>}
            </div>
            
            {pendingCorrections.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-success/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCorrections.map(c => {
                  const rec = attendanceRecords.find(r => r.id === c.recordId);
                  const sec = sections.find(s => s.id === rec?.sectionId);
                  const teacher = teacherAccounts.find(t => t.email === c.teacherEmail);
                  
                  return (
                    <div key={c.id} className="p-4 rounded-xl border border-warning/30 bg-warning/5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        <span className="font-semibold text-sm">{sec?.name} Correction</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">Requested by: <span className="text-foreground">{teacher?.name || c.teacherEmail}</span></p>
                      <p className="text-xs text-muted-foreground mb-1">Date: <span className="text-foreground">{rec?.date}</span></p>
                      <div className="bg-background/50 rounded-lg p-2 text-xs italic border border-border my-2">
                        "{c.reason}"
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" onClick={() => handleApproveCorrection(c.id)} className="w-full gradient-primary h-8"><CheckCircle2 className="w-4 h-4 mr-1"/> Approve</Button>
                        <Button size="sm" onClick={() => handleRejectCorrection(c.id)} variant="ghost" className="w-full text-destructive hover:bg-destructive/20 h-8"><XCircle className="w-4 h-4 mr-1"/> Reject</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
