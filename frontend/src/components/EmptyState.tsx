import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-16 px-4"
  >
    <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6">
      <Icon className="w-10 h-10 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold font-display mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="rounded-xl gradient-primary glow">
        {actionLabel}
      </Button>
    )}
  </motion.div>
);

export default EmptyState;
