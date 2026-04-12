import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, Eye } from 'lucide-react';
import api from '@/lib/api';
import { aiFeedbacks } from '@/data/mockData';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/hooks/use-toast';

const ReportGenerator = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const fetchStudents = async () => {
    try {
      const res = await api.get('/school/students');
      setStudents(res.data.students || []);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (students.length === 0) return;
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    setShowPreview(true);
    toast({ title: 'Report generated! 📄' });
  };

  const student = students[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Report Generator</h1>
          <p className="text-sm text-muted-foreground">Generate and preview PDF reports</p>
        </div>
        <Button onClick={handleGenerate} disabled={generating || students.length === 0} className="rounded-xl gradient-primary glow">
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
          Generate PDF Report
        </Button>
      </div>

      {generating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-12 text-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center glow">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <p className="text-lg font-medium">Generating PDF report...</p>
        </motion.div>
      )}

      {showPreview && student && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Report Preview</span>
            </div>
            <Button size="sm" onClick={() => toast({ title: 'Downloaded! 📥' })} className="rounded-lg gradient-primary">
              <Download className="w-4 h-4 mr-1" />Download PDF
            </Button>
          </div>
          <div className="p-8 bg-secondary/20">
            <div className="max-w-lg mx-auto bg-card rounded-xl p-8 shadow-lg border border-glass-border">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold font-display gradient-text">EduAuto Pro</h2>
                <p className="text-xs text-muted-foreground">Student Performance Report</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Student Name</span>
                  <span className="font-medium">{student.name}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-medium">{student.rollNo}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{student.subject}</span>
                </div>
                <div className="flex justify-between text-sm border-b border-border pb-2">
                  <span className="text-muted-foreground">Marks</span>
                  <Badge className={student.marks > 0 ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}>{student.marks > 0 ? `${student.marks}%` : 'N/A'}</Badge>
                </div>
                <div className="pt-2">
                  <p className="text-sm font-medium mb-2">AI Feedback</p>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiFeedbacks[0]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!showPreview && !generating && (
        <EmptyState
          icon={FileText}
          title={students.length === 0 ? "No students available" : "Generate a report"}
          description={students.length === 0 ? "Add students first before generating reports." : "Click the button above to generate a PDF report for your students."}
        />
      )}
    </div>
  );
};

export default ReportGenerator;
