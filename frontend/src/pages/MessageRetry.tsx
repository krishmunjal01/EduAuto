import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { RefreshCw, Send, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

const MessageRetry = () => {
  const [failedMessages, setFailedMessages] = useState<any[]>([]);
  const [retrying, setRetrying] = useState<Set<string>>(new Set());

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages');
      setFailedMessages(res.data.messages || []);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const statusConfig = {
    failed: { icon: AlertTriangle, color: 'bg-destructive/20 text-destructive', label: 'Failed' },
    pending: { icon: Clock, color: 'bg-warning/20 text-warning', label: 'Pending' },
    sent: { icon: CheckCircle2, color: 'bg-success/20 text-success', label: 'Sent' },
  };

  const handleRetry = async (id: string) => {
    setRetrying(prev => new Set(prev).add(id));
    try {
      await api.post(`/messages/${id}/retry`);
      setFailedMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'sent' } : m));
      toast.success('Retry complete');
    } catch {
      toast.error('Failed to retry');
    } finally {
      setRetrying(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleBulkRetry = async () => {
    const failedIds = failedMessages.filter(m => m.status === 'failed').map(m => m.id);
    for (const id of failedIds) {
      setRetrying(prev => new Set(prev).add(id));
      try {
        await api.post(`/messages/${id}/retry`);
        setFailedMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'sent' } : m));
      } catch (err) {}
    }
    setRetrying(new Set());
    toast.success('Bulk retry complete');
  };

  const failedCount = failedMessages.filter(m => m.status === 'failed').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Message Retry</h1>
          <p className="text-muted-foreground text-sm mt-1">{failedCount} failed message{failedCount !== 1 ? 's' : ''}</p>
        </div>
        {failedCount > 0 && (
          <Button onClick={handleBulkRetry} className="gradient-primary">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry All Failed
          </Button>
        )}
      </motion.div>

      {failedMessages.length === 0 ? (
        <EmptyState icon={Send} title="No message history" description="Failed messages will appear here after you send WhatsApp messages." />
      ) : (
        <div className="space-y-2">
          {failedMessages.map((msg, i) => {
            const cfg = statusConfig[msg.status];
            const isRetrying = retrying.has(msg.id);
            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{msg.parentName}</p>
                    <Badge className={`text-[10px] ${cfg.color}`}>{cfg.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{msg.phone} · {msg.studentName}</p>
                  {msg.reason && <p className="text-xs text-destructive mt-1">Reason: {msg.reason}</p>}
                </div>
                {msg.status === 'failed' && (
                  <Button size="sm" variant="outline" onClick={() => handleRetry(msg.id)} disabled={isRetrying}>
                    {isRetrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    <span className="ml-1.5">Retry</span>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessageRetry;
