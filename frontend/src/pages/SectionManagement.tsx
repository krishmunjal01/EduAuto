import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, Section, Student } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { FolderOpen, Plus, Upload, Users, ArrowLeft, Pencil, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SectionManagement = () => {
  const { user } = useAuth();
  const { addNotification, addAuditLog } = useAppData();
  const { toast } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sectionName, setSectionName] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ name: '', rollNo: '', parentName: '', phone: '' });

  const fetchSections = useCallback(async () => {
    try {
      const res = await api.get('/admin/sections');
      const formatted = res.data.sections.map((sec: any): Section => ({
        id: sec.id,
        name: sec.section_name,
        subject: sec.subject || '',
        teacherEmails: (sec.allTeacherEmails || [sec.teacherSections?.[0]?.teacher?.email].filter(Boolean)).map((e: string) => e.toLowerCase()),
        students: sec.students.map((st: any): Student => ({
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
        createdAt: sec.created_at,
      }));
      setSections(formatted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.role === 'admin';
  // Admin sees all sections, teacher sees their own
  const visibleSections = isAdmin ? sections : sections.filter(s => (s as any).teacherEmails?.includes(user?.email?.toLowerCase()));
  const selected = visibleSections.find(s => s.id === activeSection);

  const handleCreateSection = async () => {
    if (!sectionName) {
      toast({ title: 'Error', description: 'Please provide a section name', variant: 'destructive' });
      return;
    }
    
    try {
      await api.post('/admin/sections', {
        sectionName: sectionName,
        subject: '',
        teacherEmail: user?.email || '',
      });
      
      await fetchSections();
      
      addNotification(`Section "${sectionName}" created`, 'success', isAdmin ? 'admin' : 'teacher', user?.email);
      addAuditLog('section_created', user?.name || '', user?.role || '', `Created section "${sectionName}"`);
      toast({ title: 'Section Created! 📚', description: `${sectionName}` });
      setShowCreateForm(false);
      setSectionName('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to create section', variant: 'destructive' });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!window.confirm('Are you sure you want to delete this section? All students in it will be removed.')) return;
    
    try {
      await api.delete(`/admin/sections/${sectionId}`);
      toast({ title: 'Section Deleted', description: 'The section and its students have been removed.' });
      if (activeSection === sectionId) setActiveSection(null);
      await fetchSections();
    } catch(err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to delete section', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post(`/admin/sections/${sectionId}/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast({ title: 'File Uploaded! 📄', description: res.data.message });
      await fetchSections();
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.response?.data?.error || err.message, variant: 'destructive' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student.id);
    setEditValues({ name: student.name, rollNo: student.rollNo, parentName: student.parentName, phone: student.phone });
  };

  const handleSaveStudent = (sectionId: string, studentId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? {
        ...s,
        students: s.students.map(st => st.id === studentId ? { ...st, ...editValues } : st)
      } : s
    ));
    setEditingStudent(null);
    toast({ title: 'Student updated ✅' });
  };

  const handleDeleteStudent = (sectionId: string, studentId: string) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, students: s.students.filter(st => st.id !== studentId) } : s
    ));
    toast({ title: 'Student removed' });
  };

  if (activeSection && selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setActiveSection(null)} className="rounded-xl border border-border bg-secondary/50">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Sections
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold font-display">{selected.name}</h1>
            <p className="text-sm text-muted-foreground">{selected.students.length} students</p>
          </div>
          {isAdmin && (
            <Button variant="outline" className="rounded-xl border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleDeleteSection(selected.id)}>
              <Trash2 className="w-4 h-4 mr-2" />Delete Section
            </Button>
          )}
        </div>

        {/* CSV Upload (admin only) */}
        {isAdmin && (
          <div className="space-y-4">
             <input type="file" accept=".csv,.xlsx,.xls" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, selected.id)} />
            <motion.div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { 
                e.preventDefault(); 
                setDragOver(false); 
                if (e.dataTransfer.files?.length) {
                  // create a synthetic event to reuse logic
                  const syntheticEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileUpload(syntheticEvent, selected.id);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                dragOver ? 'border-accent bg-accent/5 glow-accent' : 'border-border hover:border-accent hover:bg-accent/5'
              }`}
            >
              <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-accent' : 'text-muted-foreground'}`} />
              <p className="text-muted-foreground mb-1 font-medium">Click to upload CSV or Excel file, or drag and drop</p>
              <p className="text-xs text-muted-foreground/70">Supported: .csv, .xlsx, .xls &nbsp;·&nbsp; Columns: Name, Roll Number, Parent Name, Phone Number</p>
            </motion.div>
          </div>
        )}
        
        {selected.students.length === 0 && !isAdmin ? (
          <EmptyState
            icon={Users}
            title="No students in this section"
            description="The admin hasn't uploaded student data for this section yet. Please contact your school administrator."
          />
        ) : selected.students.length > 0 && (
          <div className="space-y-4">
            {/* Student Table */}
            <div className="glass rounded-2xl overflow-hidden mt-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Marks</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.students.map((s, i) => (
                    <motion.tr key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.05, 0.5) }}
                      className="border-border hover:bg-secondary/30 transition-colors">
                      <TableCell><Badge variant="outline" className="border-glass-border font-mono">{s.id}</Badge></TableCell>
                      <TableCell>
                        {editingStudent === s.id ? (
                          <Input value={editValues.name} onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                            className="h-8 text-sm bg-secondary/50 border-glass-border" />
                        ) : <span className="font-medium">{s.name}</span>}
                      </TableCell>
                      <TableCell>
                        {editingStudent === s.id ? (
                          <Input value={editValues.rollNo} onChange={e => setEditValues(prev => ({ ...prev, rollNo: e.target.value }))}
                            className="h-8 text-sm w-20 bg-secondary/50 border-glass-border" />
                        ) : <Badge variant="outline" className="border-glass-border">{s.rollNo}</Badge>}
                      </TableCell>
                      <TableCell>
                        {editingStudent === s.id ? (
                          <Input value={editValues.parentName} onChange={e => setEditValues(prev => ({ ...prev, parentName: e.target.value }))}
                            className="h-8 text-sm bg-secondary/50 border-glass-border" />
                        ) : <span className="text-muted-foreground">{s.parentName}</span>}
                      </TableCell>
                      <TableCell>
                        {editingStudent === s.id ? (
                          <Input value={editValues.phone} onChange={e => setEditValues(prev => ({ ...prev, phone: e.target.value }))}
                            className="h-8 text-sm bg-secondary/50 border-glass-border" />
                        ) : <span className="text-muted-foreground font-mono text-sm">{s.phone}</span>}
                      </TableCell>
                      <TableCell>{s.marks > 0 ? <Badge className={s.marks >= 80 ? 'bg-success/20 text-success' : s.marks >= 60 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}>{s.marks}%</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {editingStudent === s.id ? (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-success/20 hover:text-success"
                                onClick={() => handleSaveStudent(selected.id, s.id)}>
                                <Save className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-accent/20 hover:text-accent"
                                onClick={() => handleEditStudent(s)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                              onClick={() => handleDeleteStudent(selected.id, s.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Sections</h1>
          <p className="text-sm text-muted-foreground">{isAdmin ? 'Manage class sections and upload student data' : 'View your assigned sections'}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreateForm(true)} className="rounded-xl gradient-primary glow">
            <Plus className="w-4 h-4 mr-2" />Create Section
          </Button>
        )}
      </div>

      {/* Create Form (Admin only) */}
      <AnimatePresence>
        {showCreateForm && isAdmin && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold font-display">New Section</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Class Name *</Label>
                <Input placeholder="e.g., 10A" value={sectionName} onChange={e => setSectionName(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreateSection} className="rounded-xl gradient-primary">Create Section</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)} className="rounded-xl border-glass-border">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section Cards */}
      {visibleSections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={isAdmin ? "No sections created yet" : "No sections assigned"}
          description={isAdmin ? "Create your first section to organize students. Then upload a CSV or Excel file of students per section." : "Your admin hasn't assigned any sections to you yet."}
          actionLabel={isAdmin ? "Create First Section" : undefined}
          onAction={isAdmin ? () => setShowCreateForm(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleSections.map((section, i) => (
            <motion.div key={section.id} 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }} onClick={() => setActiveSection(section.id)}
              className="glass rounded-2xl p-6 cursor-pointer hover:border-accent/40 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              <div className="relative z-10 flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-inner">
                  {section.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold font-display text-lg leading-tight">{section.name}</h3>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 p-2 rounded-lg">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{section.students.length} students enrolled</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionManagement;
