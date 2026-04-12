import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Image, Brain, Mic, Loader2, CheckCircle2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

const WhatsApp = () => {
  const [template, setTemplate] = useState('Hello {{ParentName}}, your child {{StudentName}} (Roll: {{RollNo}}) scored {{Marks}} in {{Subject}}. {{AIFeedback}}');
  const [attachImage, setAttachImage] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [sendVoice, setSendVoice] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [sendResult, setSendResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchSections = useCallback(async () => {
    try {
      const res = await api.get('/admin/sections');
      setSections(res.data.sections || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const section = sections.find(s => s.id === selectedSection);
  const studentCount = section?.students?.length || 0;

  // Live preview with first student's data or placeholder
  const firstStudent = section?.students?.[0];
  const preview = template
    .replace('{{ParentName}}', firstStudent?.parent_name || 'Parent Name')
    .replace('{{StudentName}}', firstStudent?.name || 'Student Name')
    .replace('{{RollNo}}', firstStudent?.roll_number || 'XXXX')
    .replace('{{Marks}}', '85%')
    .replace('{{Subject}}', section?.subject || 'Subject')
    .replace('{{AIFeedback}}', includeAI ? '\n\n📊 AI Insight: Shows strong understanding. Focus on time management for top results.' : '');

  const handleSend = async () => {
    if (!selectedSection) {
      toast({ title: 'Select a section', description: 'Choose a section first', variant: 'destructive' });
      return;
    }

    setSending(true); setDone(false); setProgress(0); setSendResult(null);

    try {
      // Simulate progress while backend processes
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 3, 90));
      }, 200);

      const res = await api.post('/messages/send-bulk', {
        template,
        sectionId: selectedSection,
        attachImage,
        includeAI
      });

      clearInterval(progressInterval);
      setProgress(100);
      setSendResult(res.data);
      setDone(true);
      toast({
        title: 'Messages sent! 🎉',
        description: `${res.data.totalSent} messages delivered, ${res.data.totalFailed} failed`
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.error || 'Failed to send', variant: 'destructive' });
    }

    setSending(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">WhatsApp Automation</h1>
        <p className="text-sm text-muted-foreground">Compose and send personalized messages to parents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Template Editor */}
        <div className="space-y-4">
          {/* Section Selector */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display mb-3">Select Section</h3>
            <Select value={selectedSection} onValueChange={v => { setSelectedSection(v); setDone(false); }}>
              <SelectTrigger><SelectValue placeholder="Choose a section" /></SelectTrigger>
              <SelectContent>
                {sections.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.section_name || s.name} — {s.subject} ({s.students?.length || 0} students)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {section && (
              <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{studentCount} parents will receive messages</span>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display mb-3">Message Template</h3>
            <Textarea value={template} onChange={e => setTemplate(e.target.value)} rows={6}
              className="bg-secondary/50 border-glass-border rounded-xl resize-none font-mono text-sm" />
            <div className="flex flex-wrap gap-2 mt-3">
              {['{{ParentName}}', '{{StudentName}}', '{{Marks}}', '{{Subject}}', '{{RollNo}}', '{{AIFeedback}}'].map(tag => (
                <button key={tag} onClick={() => setTemplate(t => t + ' ' + tag)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-mono">
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold font-display mb-1">Options</h3>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm"><Image className="w-4 h-4 text-accent" />Attach Report Image</Label>
              <Switch checked={attachImage} onCheckedChange={setAttachImage} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm"><Brain className="w-4 h-4 text-primary" />Include AI Feedback</Label>
              <Switch checked={includeAI} onCheckedChange={setIncludeAI} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm"><Mic className="w-4 h-4 text-success" />Send Voice Message</Label>
              <Switch checked={sendVoice} onCheckedChange={setSendVoice} />
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSend} disabled={sending || !selectedSection} className="w-full h-12 rounded-xl gradient-primary glow text-base font-semibold">
              {sending ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Sending messages…</> : done ? <><CheckCircle2 className="w-5 h-5 mr-2" />Sent Successfully!</> : <><Send className="w-5 h-5 mr-2" />Send to All Parents</>}
            </Button>
          </motion.div>

          {(sending || done) && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2 rounded-full" />
              <p className="text-xs text-muted-foreground text-center">
                {done && sendResult
                  ? `✅ ${sendResult.totalSent} sent, ${sendResult.totalFailed} failed`
                  : `${progress}% — Sending messages…`}
              </p>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold font-display mb-4">Live Preview</h3>
          <div className="bg-secondary/30 rounded-2xl p-6 border border-glass-border">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center text-sm font-bold text-accent-foreground">
                {(firstStudent?.parent_name || 'P')[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{firstStudent?.parent_name || 'Parent Name'}</p>
                <p className="text-xs text-muted-foreground">{firstStudent?.parent_phone || '+91 XXXXX XXXXX'}</p>
              </div>
            </div>
            <div className="bg-success/10 rounded-2xl rounded-tl-none p-4 max-w-sm">
              <p className="text-sm whitespace-pre-line leading-relaxed">{preview}</p>
              {attachImage && (
                <div className="mt-3 h-24 bg-secondary/50 rounded-xl flex items-center justify-center">
                  <Image className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground text-right mt-2">12:45 PM ✓✓</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsApp;
