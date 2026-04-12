import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { Brain, RefreshCw, Loader2, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const trendIcons = {
  improving: <TrendingUp className="w-4 h-4 text-success" />,
  declining: <TrendingDown className="w-4 h-4 text-destructive" />,
  stable: <Minus className="w-4 h-4 text-muted-foreground" />,
};

const trendColors = {
  improving: 'bg-success/20 text-success',
  declining: 'bg-destructive/20 text-destructive',
  stable: 'bg-secondary text-muted-foreground',
};

const AIFeedback = () => {
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setFeedbacks([]);
    setError('');
    try {
      const res = await api.post('/school/ai-feedback');
      const data = res.data.feedbacks || [];
      if (data.length === 0) {
        setError('No students with results found. Upload report images and verify results first.');
      }
      setFeedbacks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate feedback');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">AI Feedback Generator</h1>
          <p className="text-sm text-muted-foreground">Personalized performance insights from real student data</p>
        </div>
        <div className="flex gap-3">
          {feedbacks.length > 0 && (
            <Button variant="outline" onClick={generate} className="rounded-xl border-glass-border">
              <RefreshCw className="w-4 h-4 mr-2" />Regenerate
            </Button>
          )}
          <Button onClick={generate} disabled={loading} className="rounded-xl gradient-primary glow">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
            Generate AI Feedback
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass rounded-2xl p-12 text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center glow">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <p className="text-lg font-medium">Analyzing student performance...</p>
            <p className="text-sm text-muted-foreground mt-1">Processing marks, attendance, and trends</p>
            <div className="w-64 mx-auto mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity }} className="h-full w-1/2 gradient-primary rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {feedbacks.map((f, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.01 }} className="glass rounded-2xl p-6 group">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl gradient-primary shrink-0">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="font-semibold font-display">{f.student}</h3>
                  {f.section && <Badge variant="outline" className="text-[10px]">{f.section}</Badge>}
                  <Badge className={trendColors[f.trend as keyof typeof trendColors]}>
                    {trendIcons[f.trend as keyof typeof trendIcons]}
                    <span className="ml-1">{f.trend}</span>
                  </Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                  <span>Latest: <strong className="text-foreground">{f.latestMarks}%</strong></span>
                  <span>Average: <strong className="text-foreground">{f.avgMarks}%</strong></span>
                  <span>Attendance: <strong className={f.attendanceRate < 75 ? 'text-destructive' : 'text-foreground'}>{f.attendanceRate}%</strong></span>
                  <span>Rank: <strong className="text-foreground">#{f.rank}</strong></span>
                  <span>Tests: <strong className="text-foreground">{f.totalTests}</strong></span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{f.feedback}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {feedbacks.length === 0 && !loading && (
        <EmptyState
          icon={Brain}
          title={error || "Generate AI Feedback"}
          description={error ? "Ensure students have verified results in the system." : "Click the button above to analyze student performance and generate personalized insights from real data."}
        />
      )}
    </div>
  );
};

export default AIFeedback;
