import { useState, useEffect } from 'react';
// TimetableSlot type inlined
type TimetableSlot = { subject: string; teacherEmail: string; teacherName: string };
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { motion } from 'framer-motion';
import { Calendar, Plus, Save, Trash2, Edit2, Clock, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableManagement = () => {
  // audit log helper removed — now backend handles audit
  const [sections, setSections] = useState<any[]>([]);
  const [teacherAccounts, setTeacherAccounts] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');

  const fetchData = async () => {
    try {
      const [secRes, teachRes, timeRes] = await Promise.all([
        api.get('/admin/sections'),
        api.get('/admin/teachers'),
        api.get('/timetable')
      ]);
      setSections(secRes.data.sections);
      setTeacherAccounts(teachRes.data.teachers);
      setTimetables(timeRes.data.timetables);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const [periodsPerDay, setPeriodsPerDay] = useState(8);
  const [selectedDays, setSelectedDays] = useState<string[]>(DEFAULT_DAYS.slice(0, 6));
  const [grid, setGrid] = useState<Record<string, TimetableSlot[]>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Subject frequency state for auto-generation
  const [subjectFreqs, setSubjectFreqs] = useState<Record<string, number>>({});

  // Custom subjects managed locally
  const [customSubjects, setCustomSubjects] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('eduauto_subjects');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newSubject, setNewSubject] = useState('');

  const addCustomSubject = () => {
    const sub = newSubject.trim();
    if (sub && !customSubjects.includes(sub)) {
      const updated = [...customSubjects, sub];
      setCustomSubjects(updated);
      localStorage.setItem('eduauto_subjects', JSON.stringify(updated));
      setNewSubject('');
    }
  };

  const removeCustomSubject = (sub: string) => {
    const updated = customSubjects.filter(s => s !== sub);
    setCustomSubjects(updated);
    localStorage.setItem('eduauto_subjects', JSON.stringify(updated));
  };

  const section = sections.find(s => s.id === selectedSection);
  // Build subjects from: section subjects + teacher subjects + custom subjects
  const sectionSubjects = sections.map(s => s.subject).filter(Boolean);
  const teacherSubjects = teacherAccounts.map((t: any) => t.subject).filter(Boolean);
  const allSubjects = [...new Set([...sectionSubjects, ...teacherSubjects, ...customSubjects])].filter(Boolean);
  const activeTeachers = teacherAccounts.filter(t => t.status === 'active');

  const initGrid = () => {
    const newGrid: Record<string, TimetableSlot[]> = {};
    selectedDays.forEach(day => {
      newGrid[day] = Array.from({ length: periodsPerDay }, () => ({
        subject: '', teacherEmail: '', teacherName: '',
      }));
    });
    setGrid(newGrid);
  };

  const handleCreateNew = () => {
    if (!selectedSection) { toast.error('Select a section first'); return; }
    initGrid();
    setEditingId(null);
    setShowBuilder(true);
  };

  const handleAutoGenerate = async () => {
    if (!selectedSection) { toast.error('Select a section first'); return; }
    const totalSlots = selectedDays.length * periodsPerDay;
    const subjects = Object.entries(subjectFreqs).filter(([, freq]) => freq > 0);
    if (subjects.length === 0) { toast.error('Set subject frequencies first'); return; }

    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate

    // Build a pool of subject slots
    const pool: string[] = [];
    subjects.forEach(([sub, freq]) => {
      for (let i = 0; i < freq; i++) pool.push(sub);
    });
    // Fill remaining with Free/Break
    while (pool.length < totalSlots) pool.push(pool.length % 5 === 4 ? 'Break' : 'Free');
    // Trim if too many
    pool.length = totalSlots;

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Build teacher map: subject -> teacher
    const subjectTeacher: Record<string, { email: string; name: string }> = {};
    activeTeachers.forEach(t => {
      if (!subjectTeacher[t.subject]) subjectTeacher[t.subject] = { email: t.email, name: t.name };
    });

    const newGrid: Record<string, TimetableSlot[]> = {};
    let idx = 0;
    selectedDays.forEach(day => {
      newGrid[day] = Array.from({ length: periodsPerDay }, () => {
        const sub = pool[idx++] || 'Free';
        const teacher = subjectTeacher[sub];
        return {
          subject: sub,
          teacherEmail: teacher?.email || '',
          teacherName: teacher?.name || '',
        };
      });
    });

    setGrid(newGrid);
    setEditingId(null);
    setShowBuilder(true);
    setGenerating(false);
    toast.success('Timetable generated! Review and edit as needed.');
  };

  const handleEditTimetable = (tt: typeof timetables[0]) => {
    setSelectedSection(tt.sectionId);
    setPeriodsPerDay(tt.periodsPerDay);
    setSelectedDays(tt.days);
    setGrid(JSON.parse(JSON.stringify(tt.grid)));
    setEditingId(tt.id);
    setShowBuilder(true);
  };

  const handleSlotChange = (day: string, idx: number, field: 'subject' | 'teacherEmail', value: string) => {
    setGrid(prev => {
      const updated = { ...prev };
      const slots = [...updated[day]];
      slots[idx] = { ...slots[idx], [field]: value };
      if (field === 'teacherEmail') {
        const teacher = teacherAccounts.find(t => t.email === value);
        slots[idx].teacherName = teacher?.name || '';
      }
      updated[day] = slots;
      return updated;
    });
  };

  const handleSave = async () => {
    if (!section) return;
    try {
      await api.post('/timetable', { sectionId: selectedSection, grid });
      await fetchData();
      toast.success('Timetable saved successfully');
      setShowBuilder(false);
    } catch (err) {
      toast.error('Failed to save timetable');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this timetable?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      await fetchData();
      toast.success('Timetable deleted');
    } catch (err) {
      toast.error('Failed to delete timetable');
    }
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">{editingId ? 'Edit' : 'Create'} Timetable</h1>
            <p className="text-muted-foreground text-sm mt-1">{section?.section_name || section?.name || 'Section'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBuilder(false)}>Cancel</Button>
            <Button onClick={handleSave} className="gradient-primary"><Save className="w-4 h-4 mr-2" /> Save Timetable</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="glass rounded-tl-xl p-3 text-left text-sm font-medium text-muted-foreground min-w-[100px]">Day / Period</th>
                {Array.from({ length: periodsPerDay }, (_, i) => (
                  <th key={i} className="glass p-3 text-center text-sm font-medium text-muted-foreground min-w-[160px]">
                    <div className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> Period {i + 1}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedDays.map(day => (
                <tr key={day}>
                  <td className="glass p-3 font-medium text-sm">{day}</td>
                  {grid[day]?.map((slot, idx) => (
                    <td key={idx} className="glass p-2 hover:bg-primary/5 transition-colors">
                      <div className="space-y-1.5">
                        <Select value={slot.subject} onValueChange={v => handleSlotChange(day, idx, 'subject', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
                          <SelectContent>
                            {allSubjects.map(sub => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                            <SelectItem value="Free">Free</SelectItem>
                            <SelectItem value="Break">Break</SelectItem>
                            <SelectItem value="Assembly">Assembly</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={slot.teacherEmail} onValueChange={v => handleSlotChange(day, idx, 'teacherEmail', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Teacher" /></SelectTrigger>
                          <SelectContent>
                            {activeTeachers.map(t => <SelectItem key={t.email} value={t.email}>{t.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold font-display">Timetable Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Create and manage class schedules</p>
      </motion.div>

      <Card className="glass border-border">
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[200px]">
              <Label>Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.section_name || s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-32">
              <Label>Periods/Day</Label>
              <Input type="number" min={1} max={12} value={periodsPerDay} onChange={e => setPeriodsPerDay(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DEFAULT_DAYS.map(day => (
                  <Badge key={day} variant={selectedDays.includes(day) ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors" onClick={() => toggleDay(day)}>
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Manage Subjects */}
          <div className="space-y-2 pt-2 border-t border-border">
            <Label className="text-sm text-muted-foreground">Subjects — add subjects that will appear in timetable slots</Label>
            <div className="flex flex-wrap gap-2 items-center">
              {allSubjects.map(sub => (
                <Badge key={sub} variant="default" className="gap-1 pr-1">
                  {sub}
                  {customSubjects.includes(sub) && (
                    <button onClick={() => removeCustomSubject(sub)} className="ml-1 hover:text-destructive text-xs">✕</button>
                  )}
                </Badge>
              ))}
              <div className="flex gap-1">
                <Input 
                  placeholder="e.g. Mathematics" 
                  value={newSubject} 
                  onChange={e => setNewSubject(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSubject(); } }}
                  className="h-8 w-40 text-xs"
                />
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addCustomSubject}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            </div>
          </div>
          {/* Subject frequencies for auto-generation */}
          {selectedSection && allSubjects.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-sm text-muted-foreground">Subject Frequency (per week) — for auto-generation</Label>
              <div className="flex flex-wrap gap-3">
                {allSubjects.map(sub => (
                  <div key={sub} className="flex items-center gap-2">
                    <span className="text-xs font-medium min-w-[60px]">{sub}</span>
                    <Input type="number" min={0} max={selectedDays.length * periodsPerDay}
                      value={subjectFreqs[sub] || 0}
                      onChange={e => setSubjectFreqs(prev => ({ ...prev, [sub]: Number(e.target.value) }))}
                      className="w-16 h-8 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreateNew} variant="outline">
              <Plus className="w-4 h-4 mr-2" /> Manual Create
            </Button>
            <Button onClick={handleAutoGenerate} className="gradient-primary" disabled={generating}>
              {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating optimal timetable…</> : <><Wand2 className="w-4 h-4 mr-2" /> Auto Generate</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {timetables.length === 0 ? (
        <EmptyState icon={Calendar} title="No timetables yet" description="Create a timetable for a section to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timetables.map((tt, i) => (
            <motion.div key={tt.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="glass border-border hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tt.sectionName}</CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditTimetable(tt)}><Edit2 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(tt.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{tt.days.length} days</span>
                    <span>{tt.periodsPerDay} periods</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;
