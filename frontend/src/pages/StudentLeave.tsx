import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ClipboardList, Check, X, Search, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-success/20 text-success',
  rejected: 'bg-destructive/20 text-destructive',
};
const statusIcons = { pending: '🟡', approved: '🟢', rejected: '🔴' };

const StudentLeave = () => {
  const { user } = useAuth();
  const { addNotification, addAuditLog } = useAppData();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await api.get('/leaves');
      setLeaveRequests(res.data.leaves.filter((l: any) => l.type === 'student'));
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = leaveRequests
    .filter(l => filterStatus === 'all' || l.status === filterStatus)
    .filter(l => (l.studentName || '').toLowerCase().includes(search.toLowerCase()) || l.applicantName.toLowerCase().includes(search.toLowerCase()));

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      await fetchData();
      
      const leave = leaveRequests.find(l => l.id === id);
      addNotification(`Leave ${status} for ${leave?.studentName || leave?.applicantName}`, status === 'approved' ? 'success' : 'error', 'parent', leave?.applicantEmail);
      addNotification(`Student leave ${status}: ${leave?.studentName || leave?.applicantName}`, 'info', user?.role === 'admin' ? 'admin' : 'teacher', user?.email);
      addAuditLog(`leave_${status}`, user?.name || '', user?.role || '', `${status} student leave for ${leave?.studentName || leave?.applicantName}`);
      toast({ title: `Leave ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}` });
    } catch(err) {
      toast({ title: 'Error processing decision', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Student Leave Management</h1>
        <p className="text-sm text-muted-foreground">Review and manage student leave requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by student or parent name..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary/50 border-glass-border rounded-xl h-11" />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filterStatus === s ? 'gradient-primary text-primary-foreground' : 'glass hover:bg-secondary/50'
              }`}>
              {s === 'all' ? 'All' : `${statusIcons[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No leave requests"
          description={filterStatus !== 'all' ? `No ${filterStatus} leave requests found.` : "No student leave requests have been submitted yet."}
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Student</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {(user?.role === 'teacher' || user?.role === 'admin') && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((leave, i) => (
                <motion.tr key={leave.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium">{leave.studentName || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{leave.applicantName}</TableCell>
                  <TableCell className="text-muted-foreground">{leave.fromDate}</TableCell>
                  <TableCell className="text-muted-foreground">{leave.toDate}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{leave.reason}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[leave.status]}>{statusIcons[leave.status]} {leave.status}</Badge>
                  </TableCell>
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <TableCell>
                      {leave.status === 'pending' ? (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleDecision(leave.id, 'approved')}
                            className="h-8 w-8 rounded-lg hover:bg-success/20 hover:text-success">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDecision(leave.id, 'rejected')}
                            className="h-8 w-8 rounded-lg hover:bg-destructive/20 hover:text-destructive">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">By {leave.decidedBy}</span>
                      )}
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StudentLeave;
