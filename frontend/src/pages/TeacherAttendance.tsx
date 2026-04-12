import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertTriangle, FileText, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';

const TeacherAttendance = () => {
  const { user } = useAuth();
  const { addNotification, addAuditLog } = useAppData();
  const { toast } = useToast();

  const [sections, setSections] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState<any[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<any>({
    attendanceMode: localStorage.getItem('attendanceMode') || 'day_wise'
  });
  
  const fetchData = async () => {
    try {
      const [secRes, attRes, corrRes] = await Promise.all([
        api.get('/admin/sections'),
        api.get('/attendance/records'),
        api.get('/attendance/corrections')
      ]);
      const formattedSections = secRes.data.sections.map((sec: any) => ({
        id: sec.id,
        name: sec.section_name,
        subject: sec.subject || '',
        teacherEmails: (sec.allTeacherEmails || [sec.teacherSections?.[0]?.teacher?.email].filter(Boolean)).map((e: string) => e.toLowerCase()),
        students: sec.students.map((st: any) => ({
          id: st.id,
          studentId: st.student_id,
          name: st.name,
          rollNo: st.roll_number
        }))
      }));
      setSections(formattedSections);
      
      const attFormatted = attRes.data.records.reduce((acc: any, r: any) => {
        // Find or create group for this date/section
        const key = `${r.sectionId}_${r.date}`;
        if (!acc[key]) acc[key] = { id: r.id, sectionId: r.sectionId, date: r.date, presentStudents: [], absentStudents: [], lateStudents: [] };
        if (r.status === 'present') acc[key].presentStudents.push(r.studentId);
        else if (r.status === 'absent') acc[key].absentStudents.push(r.studentId);
        else acc[key].lateStudents.push(r.studentId);
        return acc;
      }, {});
      setAttendanceRecords(Object.values(attFormatted));
      setAttendanceCorrections(corrRes.data.corrections.map((c: any) => ({
        id: c.id, recordId: c.attendanceId, teacherEmail: c.requestedBy, reason: c.reason, status: c.status
      })));
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mySections = sections.filter(s => (s.teacherEmails || []).includes(user?.email?.toLowerCase()));
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 'present', 'absent', 'late'
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present'|'absent'|'late'>>({});
  
  const [showCorrectionForm, setShowCorrectionForm] = useState(false);
  const [correctionRecordId, setCorrectionRecordId] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionProof, setCorrectionProof] = useState<string>(''); // just a string for the fake name
  
  const section = mySections.find(s => s.id === selectedSection);
  const existingRecord = attendanceRecords.find(r => 
    r.sectionId === selectedSection && 
    r.date === date && 
    (schoolInfo?.attendanceMode === 'subject_wise' ? r.markedBy === user?.id : true)
  );

  // Initialize attendance states if a new section is selected
  const handleSectionSelect = (secId: string) => {
    setSelectedSection(secId);
    const sec = mySections.find(s => s.id === secId);
    if (sec) {
      const existing = attendanceRecords.find(r => r.sectionId === secId && r.date === date);
      if (existing) {
        setAttendanceState(existing.presentStudents.reduce((acc, id) => ({...acc, [id]: 'present'}), {}));
        // Absentees and late handled below
      } else {
        const defaultState: Record<string, 'present'> = {};
        sec.students.forEach(st => defaultState[st.id] = 'present');
        setAttendanceState(defaultState as Record<string, 'present'|'absent'|'late'>);
      }
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (selectedSection) {
      handleSectionSelect(selectedSection); // Re-trigger to check existing record
    }
  };

  const handleToggle = (studentId: string, status: 'present'|'absent'|'late') => {
    setAttendanceState(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    if (!section) return;

    if (existingRecord) {
      toast({ title: 'Record already exists', description: 'Attendance for this date is already marked. Apply for a correction if needed.', variant: 'destructive' });
      return;
    }

    const presentStudents: string[] = [];
    const absentStudents: string[] = [];
    const lateStudents: string[] = [];
    const payloadRecords: any[] = [];

    section.students.forEach((st: any) => {
      const status = attendanceState[st.id] || 'present';
      if (status === 'present') presentStudents.push(st.id);
      if (status === 'absent') absentStudents.push(st.id);
      if (status === 'late') lateStudents.push(st.id);
      
      payloadRecords.push({ studentId: st.id, status });
    });

    try {
      await api.post('/attendance/mark', {
        sectionId: section.id,
        date,
        mode: schoolInfo?.attendanceMode || 'day_wise',
        records: payloadRecords
      });
      
      await fetchData();
      addNotification(`Attendance marked for ${section.name} on ${date}`, 'success', 'admin');
      toast({ title: 'Attendance Saved! 📝', description: `${presentStudents.length} present, ${absentStudents.length} absent.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to record attendance', variant: 'destructive' });
    }
  };

  const handleCorrectionApply = async () => {
    if (!correctionRecordId || !correctionReason) {
      toast({ title: 'Missing Info', description: 'Please provide reason and select record.', variant: 'destructive' });
      return;
    }
    
    try {
      await api.post('/attendance/corrections', {
        attendanceId: correctionRecordId,
        newStatus: 'review', // generic signal
        reason: correctionReason
      });
      await fetchData();
      addNotification(`Attendance correction requested by ${user?.name}`, 'info', 'admin');
      toast({ title: 'Correction Requested', description: 'Sent to admin for approval.' });
      setShowCorrectionForm(false);
      setCorrectionReason('');
      setCorrectionProof('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to request correction', variant: 'destructive' });
    }
  };

  const mySectionIds = mySections.map(s => s.id);
  const myRecords = attendanceRecords.filter(r => mySectionIds.includes(r.sectionId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Mark Attendance</h1>
        <p className="text-sm text-muted-foreground">Log daily attendance for your sections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="w-full sm:w-1/2">
              <Label className="text-sm text-muted-foreground">Select Section</Label>
              <Select value={selectedSection} onValueChange={handleSectionSelect}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Choose a section" /></SelectTrigger>
                <SelectContent>
                  {mySections.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {s.subject}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-1/2">
              <Label className="text-sm text-muted-foreground">Date</Label>
              <Input type="date" value={date} onChange={e => handleDateChange(e.target.value)} className="mt-1" max={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {!selectedSection ? (
            <EmptyState icon={ClipboardCheck} title="No section selected" description="Please choose a section and date to mark attendance." />
          ) : section && section.students.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Empty Section" description="There are no students in this section yet." />
          ) : (
            <div className="glass rounded-2xl p-6">
              <div className="flex justify-between items-end border-b border-border pb-4 mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{section?.name} Attendance</h3>
                  <p className="text-sm text-muted-foreground">{section?.students.length} students • {date}</p>
                </div>
                {existingRecord ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 py-1"><CheckCircle2 className="w-3 h-3 mr-1"/> Submitted</Badge>
                ) : (
                  <Button onClick={handleSubmitAttendance} className="gradient-primary"><FileText className="w-4 h-4 mr-2"/> Submit Attendance</Button>
                )}
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {section?.students.map(st => {
                  let status = attendanceState[st.id] || 'present';
                  if (existingRecord) {
                     if (existingRecord.presentStudents.includes(st.id)) status = 'present';
                     else if (existingRecord.lateStudents.includes(st.id)) status = 'late';
                     else status = 'absent';
                  }
                  
                  return (
                    <div key={st.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-glass-border hover:bg-secondary/30 transition-colors">
                      <div>
                        <p className="font-medium">{st.name}</p>
                        <p className="text-xs text-muted-foreground">Roll No: {st.rollNo} • ID: {st.id}</p>
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-0">
                        <Button size="sm" variant={status === 'present' ? 'default' : 'outline'}
                          onClick={() => !existingRecord && handleToggle(st.id, 'present')}
                          disabled={!!existingRecord}
                          className={`h-8 ${status === 'present' ? 'bg-success hover:bg-success/90 text-success-foreground' : ''}`}>
                          <CheckCircle2 className="w-4 h-4 mr-1" /> Present
                        </Button>
                        {schoolInfo?.attendanceMode === 'subject_wise' && (
                          <Button size="sm" variant={status === 'late' ? 'default' : 'outline'}
                            onClick={() => !existingRecord && handleToggle(st.id, 'late')}
                            disabled={!!existingRecord}
                            className={`h-8 ${status === 'late' ? 'bg-warning hover:bg-warning/90 text-warning-foreground' : ''}`}>
                            <Clock className="w-4 h-4 mr-1" /> Late
                          </Button>
                        )}
                        <Button size="sm" variant={status === 'absent' ? 'default' : 'outline'}
                          onClick={() => !existingRecord && handleToggle(st.id, 'absent')}
                          disabled={!!existingRecord}
                          className={`h-8 ${status === 'absent' ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}`}>
                          <XCircle className="w-4 h-4 mr-1" /> Absent
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar for Corrections/History */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-4">Raise Correction</h3>
            <p className="text-xs text-muted-foreground mb-4">Made a mistake? Request an attendance correction from the administrator.</p>
            {!showCorrectionForm ? (
               <Button onClick={() => setShowCorrectionForm(true)} variant="outline" className="w-full border-dashed"><AlertTriangle className="w-4 h-4 mr-2"/> Apply for Correction</Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Select Record</Label>
                  <Select value={correctionRecordId} onValueChange={setCorrectionRecordId}>
                    <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue placeholder="Choose past record" /></SelectTrigger>
                    <SelectContent>
                      {myRecords.map(r => {
                        const sec = sections.find(s => s.id === r.sectionId);
                        return <SelectItem key={r.id} value={r.id}>{sec?.name} - {r.date}</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Reason for correction</Label>
                  <Textarea value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} placeholder="Explain the error..." className="h-20 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Attach Proof (Optional)</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Input type="file" className="text-xs file:text-xs file:h-full cursor-pointer" onChange={e => setCorrectionProof(e.target.files?.[0]?.name || '')} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCorrectionApply} size="sm" className="w-full gradient-primary">Submit</Button>
                  <Button onClick={() => setShowCorrectionForm(false)} size="sm" variant="ghost" className="w-full">Cancel</Button>
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-display font-semibold mb-3">Correction Status</h3>
            {attendanceCorrections.filter(c => c.teacherEmail === user?.email).length === 0 ? (
               <p className="text-xs text-muted-foreground text-center py-4">No active correction requests.</p>
            ) : (
              <div className="space-y-3">
                {attendanceCorrections.filter(c => c.teacherEmail === user?.email).map(c => {
                   const rec = attendanceRecords.find(r => r.id === c.recordId);
                   const sec = sections.find(s => s.id === rec?.sectionId);
                   return (
                     <div key={c.id} className="p-3 rounded-xl border border-border bg-secondary/20">
                       <div className="flex justify-between items-start mb-1">
                         <span className="text-xs font-semibold">{sec?.name} - {rec?.date}</span>
                         <Badge variant="outline" className={`text-[10px] py-0 h-4 ${c.status === 'pending' ? 'text-warning border-warning/50' : c.status === 'approved' ? 'text-success border-success/50' : 'text-destructive border-destructive/50'}`}>{c.status}</Badge>
                       </div>
                       <p className="text-[10px] text-muted-foreground line-clamp-2">{c.reason}</p>
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

export default TeacherAttendance;
