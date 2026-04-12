import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Award, AlertTriangle, BarChart3 } from 'lucide-react';

const COLORS = ['hsl(0 84% 60%)', 'hsl(38 92% 50%)', 'hsl(245 58% 51%)', 'hsl(192 95% 55%)', 'hsl(142 71% 45%)'];
const tooltipStyle = { background: 'hsl(222 47% 8%)', border: '1px solid hsl(222 30% 18%)', borderRadius: '12px', color: 'hsl(210 40% 98%)' };

const Analytics = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [marksDistribution, setMarksDistribution] = useState<any[]>([]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/school/analytics');
      setStudents(res.data.students || []);
      setPerformanceData(res.data.performanceData || []);
      setMarksDistribution(res.data.marksDistribution || []);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (students.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Comprehensive performance insights</p>
        </div>
        <EmptyState
          icon={BarChart3}
          title="No analytics data yet"
          description="Analytics will appear once you have students with marks in the system. Upload report images and verify results to see performance insights."
        />
      </div>
    );
  }

  const topStudents = [...students].filter(s => s.marks > 0).sort((a, b) => b.marks - a.marks).slice(0, 3);
  const weakStudents = [...students].filter(s => s.marks > 0).sort((a, b) => a.marks - b.marks).slice(0, 3);
  const atRiskStudents = students.filter(s => s.marks > 0 && s.marks < 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Comprehensive performance insights</p>
      </div>

      {atRiskStudents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 border-l-4 border-l-warning">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-semibold font-display">Student Risk Detection</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {atRiskStudents.slice(0, 6).map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
                <span className="text-xs px-2 py-0.5 rounded-full bg-warning/20 text-warning font-semibold">⚠️ At Risk</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.subject} — {s.marks}%</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 neon-border">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-success" />
          <p className="font-semibold font-display text-lg">{students.length} students with results</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {performanceData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display mb-4">Class Performance</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                <XAxis dataKey="month" stroke="hsl(215 20% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="classAvg" stroke="hsl(245 58% 51%)" strokeWidth={3} dot={{ fill: 'hsl(245 58% 51%)', r: 4 }} />
                <Line type="monotone" dataKey="topPerformer" stroke="hsl(192 95% 55%)" strokeWidth={2} />
                <Line type="monotone" dataKey="lowest" stroke="hsl(0 84% 60%)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {marksDistribution.some(d => d.count > 0) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display mb-4">Marks Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={marksDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 16%)" />
                <XAxis dataKey="range" stroke="hsl(215 20% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {marksDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {topStudents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-warning" />Top Performers</h3>
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                  </div>
                  <span className="text-success font-bold">{s.marks}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {weakStudents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
            <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-destructive" />Needs Improvement</h3>
            <div className="space-y-3">
              {weakStudents.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-destructive/20 flex items-center justify-center text-sm font-bold text-destructive">!</span>
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.subject}</p>
                    </div>
                  </div>
                  <span className="text-destructive font-bold">{s.marks}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
