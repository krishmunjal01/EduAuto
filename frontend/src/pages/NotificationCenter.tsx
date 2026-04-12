import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import EmptyState from '@/components/EmptyState';

type FilterType = 'all' | 'success' | 'error' | 'info';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/school/notifications');
      setNotifications(res.data.notifications);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const markNotificationRead = async (id: string) => {
    try {
      await api.put(`/school/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch(err) {
      console.error(err);
    }
  };

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  const iconMap = {
    success: <CheckCircle2 className="w-4 h-4 text-success" />,
    error: <AlertTriangle className="w-4 h-4 text-destructive" />,
    info: <Info className="w-4 h-4 text-accent" />,
  };

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Success', value: 'success' },
    { label: 'Errors', value: 'error' },
    { label: 'Info', value: 'info' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-2xl font-bold font-display">Notification Center</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
        </p>
      </motion.div>

      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(f => (
          <Badge key={f.value} variant={filter === f.value ? 'default' : 'outline'}
            className="cursor-pointer transition-colors" onClick={() => setFilter(f.value)}>
            {f.label}
          </Badge>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="Notifications will appear here when actions relevant to your role are performed." />
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => markNotificationRead(n.id)}
              className={`glass rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:bg-secondary/30 ${!n.read ? 'border-l-4 border-l-primary' : ''}`}>
              <div className="mt-0.5">{iconMap[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? 'font-medium' : 'text-muted-foreground'}`}>{n.message || n.title}</p>
                <span className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
              {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
