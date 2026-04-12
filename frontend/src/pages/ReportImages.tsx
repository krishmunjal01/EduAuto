import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData, OCRResult, Section, Student } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/EmptyState';
import { Upload, Image as ImageIcon, CheckCircle2, XCircle, AlertTriangle, Send, Edit2, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ReportImages = () => {
  const { user } = useAuth();
  const { addNotification, addAuditLog, messagesSent, setMessagesSent, subscription, setSubscription, canSendMessages } = useAppData();
  const { toast } = useToast();
  
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testDate, setTestDate] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'done'>('setup');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const mySections = user?.role === 'admin' ? sections : sections.filter(s => (s as any).teacherEmails?.includes(user?.email?.toLowerCase()));
  const section = mySections.find(s => s.id === selectedSection);

  const runOCR = async (files: FileList | File[]) => {
    if (!section || section.students.length === 0) {
      toast({ title: 'No students', description: 'This section has no students.', variant: 'destructive' });
      return;
    }
    if (!testTitle || !testDate) {
      toast({ title: 'Missing info', description: 'Enter test title and date first.', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    setProcessedCount(0);
    const results: OCRResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await api.post('/ocr/extract', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const { extractedRollNo, extractedMarks, confidence, rawText } = res.data.data;
        
        let matchedStudentId = undefined;
        let matchedStudentName = undefined;
        let matchedParentPhone = undefined;
        
        if (extractedRollNo) {
          const matched = section.students.find(s => s.rollNo === extractedRollNo || s.id === extractedRollNo);
          if (matched) {
            matchedStudentId = matched.id;
            matchedStudentName = matched.name;
            matchedParentPhone = matched.phone;
          }
        }

        results.push({
          id: crypto.randomUUID(),
          imageFile: file.name,
          imageUrl: URL.createObjectURL(file),
          extractedRollNo: extractedRollNo || '',
          extractedMarks: extractedMarks || '',
          confidence: confidence.toLowerCase(),
          verified: false,
          matchedStudentId,
          matchedStudentName,
          matchedParentPhone
        });
      } catch (err) {
        // Fallback for failed extraction
        results.push({
          id: crypto.randomUUID(),
          imageFile: file.name,
          imageUrl: URL.createObjectURL(file),
          extractedRollNo: '',
          extractedMarks: '',
          confidence: 'low',
          verified: false
        });
      }
      setProcessedCount(i + 1);
    }

    setOcrResults(results);
    setProcessing(false);
    setStep('verify');
    toast({ title: 'OCR Complete 🔍', description: `Processed ${files.length} images. Please verify before sending.` });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      runOCR(e.target.files);
    }
  };

  const updateOCRResult = (id: string, field: 'extractedRollNo' | 'extractedMarks', value: string) => {
    setOcrResults(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'extractedRollNo' && section) {
        const student = section.students.find(s => s.rollNo === value);
        updated.matchedStudentId = student ? student.id : undefined;
        updated.matchedStudentName = student ? student.name : undefined;
        updated.matchedParentPhone = student ? student.phone : undefined;
      }
      return updated;
    }));
  };

  const verifyResult = (id: string) => {
    setOcrResults(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r));
  };

  const allVerified = ocrResults.length > 0 && ocrResults.every(r => r.verified && r.extractedRollNo && r.extractedMarks && r.matchedStudentId);
  const verifiedCount = ocrResults.filter(r => r.verified).length;

  const handleSendResults = async () => {
    if (!allVerified) {
      toast({ title: 'Verification required', description: 'Please verify all entries before sending.', variant: 'destructive' });
      return;
    }
    if (!canSendMessages(ocrResults.length)) {
      toast({ title: 'Message limit reached', description: 'Upgrade your plan to send more messages.', variant: 'destructive' });
      return;
    }

    setSending(true);

    let successCount = 0;
    
    for (const r of ocrResults) {
      try {
        await api.post('/results/save-verified', {
           testId: crypto.randomUUID(), 
           sectionId: section.id, 
           studentRoll: r.extractedRollNo, 
           marks: r.extractedMarks, 
           imageUrl: r.imageUrl || '' 
        });
        successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    setSending(false);

    if (successCount > 0) {
      setMessagesSent(prev => prev + successCount);
      toast({ title: 'Results Sent! 🎉', description: `${successCount} results saved to database.` });
      setStep('done');
    } else {
      toast({ title: 'Error', description: 'Failed to send results.', variant: 'destructive' });
    }
  };

  if (step === 'done') {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-12 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-success" />
          <h2 className="text-2xl font-bold font-display mb-2">Results Sent Successfully!</h2>
          <p className="text-muted-foreground mb-6">{ocrResults.length} results for {section?.name} — {testTitle}</p>
          <Button onClick={() => { setStep('setup'); setOcrResults([]); setSelectedSection(''); setTestTitle(''); setTestDate(''); }} className="rounded-xl gradient-primary">
            Send More Results
          </Button>
        </motion.div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display">Verify OCR Results</h1>
            <p className="text-sm text-muted-foreground">{section?.name} — {testTitle} · {verifiedCount}/{ocrResults.length} verified</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setStep('setup'); setOcrResults([]); }} className="rounded-xl">Back</Button>
            <Button onClick={handleSendResults} disabled={!allVerified || sending} className="rounded-xl gradient-primary glow">
              {sending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send All Results</>}
            </Button>
          </div>
        </div>

        {!allVerified && (
          <div className="glass rounded-xl p-4 border-l-4 border-l-warning flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
            <p className="text-sm">Please verify each entry. Edit roll numbers or marks if OCR detection was inaccurate. All entries must be verified before sending.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ocrResults.map((result, i) => (
            <motion.div key={result.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass rounded-2xl overflow-hidden ${result.verified ? 'border border-success/30' : !result.extractedRollNo || !result.extractedMarks ? 'border border-destructive/30' : 'border border-warning/30'}`}>
              {/* Image preview */}
              <div className="h-28 bg-secondary/50 flex items-center justify-center relative overflow-hidden group">
                {result.imageUrl ? (
                  <img src={result.imageUrl} alt="OCR Preview" className="w-full h-full object-cover transition-transform group-hover:scale-[1.03]" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                )}
                <Badge className={`absolute top-2 right-2 text-[10px] ${
                  result.confidence === 'high' ? 'bg-success/20 text-success' :
                  result.confidence === 'medium' ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'
                }`}>
                  {result.confidence} confidence
                </Badge>
                {result.verified && (
                  <div className="absolute top-2 left-2 rounded-full bg-background/80 shadow">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground truncate">{result.imageFile}</p>

                {/* Editable Roll No */}
                <div>
                  <Label className="text-xs text-muted-foreground">Roll Number</Label>
                  <Input value={result.extractedRollNo} onChange={e => updateOCRResult(result.id, 'extractedRollNo', e.target.value)}
                    placeholder="Enter roll number"
                    className={`h-8 text-sm mt-1 ${!result.extractedRollNo ? 'border-destructive' : ''} bg-secondary/50 border-glass-border`} />
                </div>

                {/* Editable Marks */}
                <div>
                  <Label className="text-xs text-muted-foreground">Marks</Label>
                  <Input value={result.extractedMarks} onChange={e => updateOCRResult(result.id, 'extractedMarks', e.target.value)}
                    placeholder="Enter marks" type="number"
                    className={`h-8 text-sm mt-1 ${!result.extractedMarks ? 'border-destructive' : ''} bg-secondary/50 border-glass-border`} />
                </div>

                {/* Matched student info */}
                {result.matchedStudentName ? (
                  <div className="bg-success/10 rounded-lg p-2">
                    <p className="text-xs font-medium text-success">✓ Matched: {result.matchedStudentName}</p>
                    <p className="text-[10px] text-muted-foreground">{result.matchedParentPhone}</p>
                  </div>
                ) : result.extractedRollNo ? (
                  <div className="bg-destructive/10 rounded-lg p-2">
                    <p className="text-xs text-destructive">⚠️ No student found for Roll No: {result.extractedRollNo}</p>
                  </div>
                ) : (
                  <div className="bg-destructive/10 rounded-lg p-2">
                    <p className="text-xs text-destructive">⚠️ Could not detect data — manual input required</p>
                  </div>
                )}

                {/* Verify button */}
                {!result.verified ? (
                  <Button size="sm" onClick={() => verifyResult(result.id)}
                    disabled={!result.extractedRollNo || !result.extractedMarks || !result.matchedStudentId}
                    className="w-full rounded-lg text-xs h-8 gradient-primary">
                    <Eye className="w-3 h-3 mr-1" />Verify & Confirm
                  </Button>
                ) : (
                  <Badge className="w-full justify-center bg-success/20 text-success py-1">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Verified
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Report Images</h1>
        <p className="text-sm text-muted-foreground">Upload report images, verify OCR results, and send to parents</p>
      </div>

      {/* Step 1: Select section + test info */}
      <div className="glass rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold font-display">Test Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Section</Label>
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {mySections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}{s.subject ? ' — ' + s.subject : ''} ({s.students.length} students)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Test Title</Label>
            <Input placeholder="e.g., Mid-Term Exam" value={testTitle} onChange={e => setTestTitle(e.target.value)}
              className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Test Date</Label>
            <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)}
              className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
          </div>
        </div>
      </div>

      {/* Step 2: Upload */}
      {selectedSection && section && section.students.length > 0 ? (
          <motion.div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { 
                e.preventDefault(); 
                setDragOver(false); 
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    runOCR(e.dataTransfer.files);
                }
            }}
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-accent bg-accent/5 glow-accent' : 'border-border hover:border-muted-foreground/50'}`}
          >
          {processing ? (
            <div className="space-y-4">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <p className="text-lg font-medium">Processing images with OCR...</p>
              <p className="text-sm text-muted-foreground">Extracting roll numbers and marks</p>
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                Image {processedCount} of {fileInputRef.current?.files?.length || '...'}
              </div>
            </div>
          ) : (
            <>
              <input type="file" multiple accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
              <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-1">Click to Upload or Drop report images here</p>
              <p className="text-sm text-muted-foreground mb-4">PNG, JPG up to 10MB each · OCR will extract roll numbers and marks</p>
              <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl gradient-primary"><Upload className="w-4 h-4 mr-2" />Upload Images & Process</Button>
            </>
          )}
        </motion.div>
      ) : selectedSection && section && section.students.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="No students in this section"
          description="Admin needs to upload student CSV before you can process report images." />
      ) : (
        <EmptyState icon={ImageIcon} title="Select a section to begin"
          description="Choose a section above, then upload report images for OCR processing." />
      )}
    </div>
  );
};

export default ReportImages;
