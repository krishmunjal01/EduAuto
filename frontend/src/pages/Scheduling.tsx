import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Scheduling = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [mode, setMode] = useState<'now' | 'later'>('now');
  const [time, setTime] = useState('09:00');
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display">Message Scheduling</h1>
        <p className="text-sm text-muted-foreground">Schedule messages for optimal delivery</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-3">
            <button onClick={() => setMode('now')} className={`flex-1 p-4 rounded-2xl transition-all ${mode === 'now' ? 'gradient-primary text-primary-foreground glow' : 'glass hover:bg-secondary/50'}`}>
              <Send className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium text-sm">Send Now</p>
            </button>
            <button onClick={() => setMode('later')} className={`flex-1 p-4 rounded-2xl transition-all ${mode === 'later' ? 'gradient-primary text-primary-foreground glow' : 'glass hover:bg-secondary/50'}`}>
              <Clock className="w-6 h-6 mx-auto mb-2" />
              <p className="font-medium text-sm">Schedule Later</p>
            </button>
          </div>

          {mode === 'later' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="glass rounded-2xl p-6 space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Time</Label>
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
              </div>
              <p className="text-sm text-muted-foreground">
                Scheduled for <span className="text-foreground font-medium">{date?.toLocaleDateString()}</span> at <span className="text-foreground font-medium">{time}</span>
              </p>
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={() => toast({ title: mode === 'now' ? 'Messages sent! 🎉' : 'Scheduled! ⏰', description: mode === 'now' ? '45 messages delivered' : `Queued for ${date?.toLocaleDateString()} at ${time}` })}
              className="w-full h-12 rounded-xl gradient-primary glow text-base font-semibold">
              {mode === 'now' ? <><Send className="w-5 h-5 mr-2" />Send Now</> : <><CalendarIcon className="w-5 h-5 mr-2" />Schedule Messages</>}
            </Button>
          </motion.div>
        </div>

        {/* Calendar */}
        <div className="glass rounded-2xl p-6 flex items-center justify-center">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default Scheduling;
