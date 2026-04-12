import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Upload, Pencil, Trash2, Download, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Students = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const fetchStudents = async () => {
    try {
      const res = await api.get('/school/students');
      setStudents(res.data.students.map((s: any) => ({
        ...s,
        marks: s.marks || 0, // Fallback since marks are in results
        subject: s.sectionName || 'General',
        phone: s.parentPhone || '—'
      })));
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCSVUpload = () => {
    toast({ title: 'Feature moved', description: 'Please import students inside Section Management.' });
  };

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.rollNo.includes(search));
  const allSelected = filtered.length > 0 && selected.length === filtered.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Student Management</h1>
          <p className="text-sm text-muted-foreground">{students.length} students registered</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-glass-border"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button onClick={handleCSVUpload} className="rounded-xl gradient-primary glow"><Upload className="w-4 h-4 mr-2" />Upload CSV</Button>
        </div>
      </div>

      {/* Drag & Drop CSV */}
      <motion.div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleCSVUpload(); }}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${dragOver ? 'border-accent bg-accent/5 glow-accent' : 'border-border hover:border-muted-foreground/50'}`}
      >
        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Drag & drop your CSV file here, or <span className="text-accent underline">browse</span></p>
      </motion.div>

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students added yet"
          description="Upload a CSV file to import students or add them manually. Students will appear here once added."
        />
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary/50 border-glass-border rounded-xl h-11" />
          </div>

          <div className="glass rounded-2xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox checked={allSelected} onCheckedChange={c => setSelected(c ? filtered.map(s => s.id) : [])} />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="border-border hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      <Checkbox checked={selected.includes(s.id)} onCheckedChange={c => setSelected(c ? [...selected, s.id] : selected.filter(x => x !== s.id))} />
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="outline" className="border-glass-border">{s.rollNo}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{s.parentName}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone}</TableCell>
                    <TableCell>{s.subject}</TableCell>
                    <TableCell>
                      {s.marks > 0 ? (
                        <Badge className={s.marks >= 80 ? 'bg-success/20 text-success' : s.marks >= 60 ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}>
                          {s.marks}%
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-accent/20 hover:text-accent" onClick={() => toast({ title: 'Coming soon' })}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => toast({ title: 'Delete from Section view instead' })}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default Students;
