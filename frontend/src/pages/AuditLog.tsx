import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAppData } from '@/contexts/AppDataContext';
import { motion } from 'framer-motion';
import { Shield, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EmptyState from '@/components/EmptyState';

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/school/audit-logs');
      setAuditLogs(res.data.logs);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const uniqueUsers = [...new Set(auditLogs.map(l => l.user))];
  const uniqueActions = [...new Set(auditLogs.map(l => l.action))];

  const filtered = auditLogs.filter(l => {
    if (userFilter !== 'all' && l.user !== userFilter) return false;
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    return true;
  });

  const actionColors: Record<string, string> = {
    'result_sent': 'bg-success/20 text-success',
    'leave_approved': 'bg-success/20 text-success',
    'leave_rejected': 'bg-destructive/20 text-destructive',
    'teacher_added': 'bg-primary/20 text-primary',
    'timetable_edited': 'bg-accent/20 text-accent',
    'section_created': 'bg-warning/20 text-warning',
    'student_added': 'bg-primary/20 text-primary',
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold font-display">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">Track all system actions</p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by user" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {uniqueActions.map(a => <SelectItem key={a} value={a}>{a.replace(/_/g, ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="No audit logs" description="System actions will be logged here automatically." />
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Action</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">User</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Details</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <Badge className={`text-[10px] ${actionColors[log.action] || 'bg-secondary text-foreground'}`}>
                      {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm">{log.user}</td>
                  <td className="p-4"><Badge variant="outline" className="text-[10px]">{log.role}</Badge></td>
                  <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">{log.details}</td>
                  <td className="p-4 text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
