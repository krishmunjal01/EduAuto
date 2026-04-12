import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { FileText, Download, Award, AlertTriangle, BarChart3, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['hsl(0 84% 60%)', 'hsl(38 92% 50%)', 'hsl(245 58% 51%)', 'hsl(192 95% 55%)', 'hsl(142 71% 45%)'];
const tooltipStyle = { background: 'hsl(222 47% 8%)', border: '1px solid hsl(222 30% 18%)', borderRadius: '12px', color: 'hsl(210 40% 98%)' };

const BulkReport = () => {
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [withMarks, setWithMarks] = useState<any[]>([]);

  const fetchSections = async () => {
    try {
      const res = await api.get('/admin/sections');
      setSections(res.data.sections || []);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleGenerate = async () => {
    if (!selectedSection) { toast.error('Select a section first'); return; }
    setLoading(true);
    setShowPreview(false);
    try {
      // Use the analytics endpoint filtered by section
      const res = await api.get(`/school/analytics?sectionId=${selectedSection}`);
      const students = res.data.students || [];
      
      if (students.length === 0) {
        toast.error('No students with marks found in this section');
        setLoading(false);
        return;
      }
      
      setWithMarks(students);
      setShowPreview(true);
    } catch (err) {
      toast.error('Failed to fetch report data');
      console.error(err);
    }
    setLoading(false);
  };

  const activeSection = sections.find(s => s.id === selectedSection);

  const classAvg = withMarks.length > 0 ? Math.round(withMarks.reduce((a, s) => a + s.marks, 0) / withMarks.length) : 0;
  const topPerformers = [...withMarks].sort((a, b) => b.marks - a.marks).slice(0, 5);
  const weakStudents = [...withMarks].filter(s => s.marks < 40);
  const atRiskStudents = [...withMarks].filter(s => s.marks >= 40 && s.marks < 60);

  const subjectMap: Record<string, number[]> = {};
  withMarks.forEach(s => {
    const subj = s.subject || activeSection?.subject || 'General';
    if (!subjectMap[subj]) subjectMap[subj] = [];
    subjectMap[subj].push(s.marks);
  });
  const subjectPerformance = Object.entries(subjectMap).map(([subject, marks]) => ({
    subject,
    average: Math.round(marks.reduce((a, b) => a + b, 0) / marks.length),
  }));

  const handleDownloadCSV = () => {
    if (withMarks.length === 0) return;
    
    const headers = ['Student Name', 'Subject', 'Marks', 'Percentage', 'Status'];
    const rows = withMarks.map(s => [
      s.name,
      s.subject || activeSection?.subject || 'General',
      s.marks,
      `${s.marks}%`,
      s.marks >= 40 ? (s.marks >= 75 ? 'Distinction' : 'Pass') : 'Fail'
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Report_${activeSection?.name || 'Class'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV report downloaded');
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold font-display">Bulk Report Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">Generate comprehensive class reports from database records</p>
      </motion.div>

      <div className="flex flex-wrap items-end gap-4 p-6 glass rounded-2xl">
        <div className="space-y-2 min-w-[240px]">
          <label className="text-xs font-medium text-muted-foreground px-1">Select Class/Section</label>
          <Select value={selectedSection} onValueChange={v => { setSelectedSection(v); setShowPreview(false); }}>
            <SelectTrigger className="bg-secondary/50 border-glass-border"><SelectValue placeholder="Select section" /></SelectTrigger>
            <SelectContent>
              {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name || s.section_name} — {s.subject}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleGenerate} disabled={loading || !selectedSection} className="gradient-primary glow h-10 px-6">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate Report
        </Button>
      </div>

      {!showPreview && !loading && (
        <EmptyState icon={BarChart3} title="Class Performance Report" description="Select a section above to analyze real performance data and export results." />
      )}

      {loading && (
        <div className="py-20 text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground animate-pulse">Aggregating database records...</p>
        </div>
      )}

      {showPreview && activeSection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold font-display">Preview: {activeSection.name} ({activeSection.subject})</h2>
            <div className="flex gap-3">
              <Button onClick={handleDownloadCSV} variant="outline" className="border-glass-border">
                <Download className="w-4 h-4 mr-2" /> Export CSV
              </Button>
              <Button onClick={() => toast.info('Advanced PDF export coming soon')} className="gradient-secondary glow">
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="glass border-border overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-50" />
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold gradient-text">{classAvg}%</p>
                <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">Class Average</p>
              </CardContent>
            </Card>
            <Card className="glass border-border overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-success opacity-50" />
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-success">{withMarks.filter(s => s.marks >= 75).length}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">Distinctions</p>
              </CardContent>
            </Card>
            <Card className="glass border-border overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-destructive opacity-50" />
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-destructive">{weakStudents.length}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-wider">Needs Attention</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass border-border">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Award className="w-4 h-4 text-warning" /> High Achievers (Top 5)</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topPerformers.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20">#{i + 1}</span>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <Badge className="bg-success/10 text-success border-success/20 font-bold">{s.marks}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-border">
              <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" /> Critical Alerts (Below 60%)</CardTitle></CardHeader>
              <CardContent>
                {weakStudents.length === 0 && atRiskStudents.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">All students are above the risk threshold! 🎉</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[...weakStudents, ...atRiskStudents].slice(0, 5).map(s => (
                      <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                        <div className="flex items-center gap-3">
                          <Badge className={s.marks < 40 ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'} variant="outline">
                            {s.marks < 40 ? 'FAILED' : 'AT RISK'}
                          </Badge>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                        <span className="text-destructive font-bold text-sm">{s.marks}%</span>
                      </div>
                    ))}
                    { (weakStudents.length + atRiskStudents.length) > 5 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">+{ (weakStudents.length + atRiskStudents.length) - 5 } more students at risk</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {subjectPerformance.length > 0 && (
            <Card className="glass border-border">
              <CardHeader><CardTitle className="text-base">Marks Distribution Analysis</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={withMarks.sort((a,b) => a.marks - b.marks)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(222 30% 16%)" />
                      <XAxis dataKey="name" hide />
                      <YAxis stroke="hsl(215 20% 55%)" fontSize={12} unit="%" />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(222 30% 12%)' }} />
                      <Bar dataKey="marks" radius={[4, 4, 0, 0]}>
                        {withMarks.sort((a,b) => a.marks - b.marks).map((s, i) => (
                          <Cell key={i} fill={s.marks < 40 ? 'hsl(0 84% 60%)' : s.marks < 75 ? 'hsl(245 58% 51%)' : 'hsl(142 71% 45%)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BulkReport;
