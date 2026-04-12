import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Calendar, Plus, Check, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const statusColors = {
  pending: 'bg-warning/20 text-warning',
  approved: 'bg-success/20 text-success',
  rejected: 'bg-destructive/20 text-destructive',
};
const statusIcons = { pending: '🟡', approved: '🟢', rejected: '🔴' };

const TeacherLeave = () => {
  const { user } = useAuth();
  const { addNotification, addAuditLog } = useAppData();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';

  const [showForm, setShowForm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const res = await api.get('/leaves');
      const teacherLeaves = res.data.leaves.filter((l: any) => l.type === 'teacher');
      setLeaveRequests(teacherLeaves);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = leaveRequests
    .filter(l => filterStatus === 'all' || l.status === filterStatus)
    .filter(l => l.applicantName.toLowerCase().includes(search.toLowerCase()));

  const handleApply = async () => {
    if (!fromDate || !toDate || !reason) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    try {
      await api.post('/leaves', {
        type: 'teacher',
        fromDate,
        toDate,
        reason
      });
      await fetchData();
      addNotification('Teacher leave application submitted', 'info', 'admin');
      addAuditLog('leave_applied', user?.name || '', 'teacher', `Teacher leave applied: ${fromDate} to ${toDate}`);
      toast({ title: 'Leave Applied ✅' });
      setShowForm(false);
      setFromDate('');
      setToDate('');
      setReason('');
    } catch(err) {
      toast({ title: 'Error applying leave', variant: 'destructive' });
    }
  };

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      await fetchData();
      
      const leave = leaveRequests.find(l => l.id === id);
      addNotification(`Teacher leave ${status}: ${leave?.applicantName}`, 'info', 'admin');
      addAuditLog(`leave_${status}`, user?.name || '', 'admin', `${status} teacher leave for ${leave?.applicantName}`);
      toast({ title: `Leave ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}` });
    } catch(err) {
      toast({ title: 'Error processing decision', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Teacher Leave {isAdmin ? 'Management' : 'Requests'}</h1>
          <p className="text-sm text-muted-foreground">{isAdmin ? 'Manage all teacher leave requests' : 'Apply and track your leave requests'}</p>
        </div>
        {!isAdmin && (
          <Button onClick={() => setShowForm(!showForm)} className="rounded-xl gradient-primary glow">
            <Plus className="w-4 h-4 mr-2" />Apply Leave
          </Button>
        )}
      </div>

      {/* Apply Form (teacher only) */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold font-display">Apply for Leave</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">From Date</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">To Date</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Reason</Label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe your reason..."
                className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleApply} className="rounded-xl gradient-primary">Submit</Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl border-glass-border">Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by teacher name..." value={search} onChange={e => setSearch(e.target.value)}
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
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={isAdmin ? 'No teacher leave requests' : 'No leave requests'}
          description={isAdmin ? 'No teacher leave requests have been submitted yet.' : 'You haven\'t applied for any leave yet.'}
        />
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Teacher</TableHead>
                {isAdmin && <TableHead>Subject</TableHead>}
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((leave, i) => (
                <motion.tr key={leave.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-border hover:bg-secondary/30 transition-colors">
                  <TableCell className="font-medium">{leave.applicantName}</TableCell>
                  {isAdmin && <TableCell className="text-muted-foreground">{leave.teacherSubject || '—'}</TableCell>}
                  <TableCell className="text-muted-foreground">{leave.fromDate}</TableCell>
                  <TableCell className="text-muted-foreground">{leave.toDate}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{leave.reason}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[leave.status]}>{statusIcons[leave.status]} {leave.status}</Badge>
                  </TableCell>
                  {isAdmin && (
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

export default TeacherLeave;
