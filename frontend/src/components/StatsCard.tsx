import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  accent?: string;
}

const StatsCard = ({ title, value, icon, trend, trendUp, delay = 0, accent }: StatsCardProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const duration = 1500;
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress >= 1) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass rounded-2xl p-6 group cursor-pointer transition-all duration-300 hover:glow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn("p-3 rounded-xl", accent || "gradient-primary")}>{icon}</div>
        {trend && (
          <span className={cn("text-xs font-medium px-2 py-1 rounded-lg", trendUp ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive")}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold font-display">{count.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </motion.div>
  );
};

export default StatsCard;
