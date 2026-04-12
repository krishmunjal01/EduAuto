import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { User, Lock, Palette, Key, Moon, Sun, Save, Loader2, Bell, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, theme, toggleTheme } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setSaving(false);
    toast({ title: 'Settings saved! ✅' });
  };

  const isAdmin = user?.role === 'admin';
  const isParent = user?.role === 'parent';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" />Profile Settings</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Full Name</Label>
            <Input defaultValue={user?.name} className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <Input defaultValue={user?.email} className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
          </div>
        </div>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" />Change Password</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground">Current Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">New Password</Label>
            <Input type="password" placeholder="••••••••" className="mt-1 bg-secondary/50 border-glass-border rounded-xl" />
          </div>
        </div>
      </motion.div>

      {/* Theme */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
        <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-primary" />Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <Label className="text-sm">Dark Mode</Label>
          </div>
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
        </div>
      </motion.div>

      {/* Parent: Notification Preferences */}
      {isParent && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
          <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-primary" />Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Result notifications</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Leave status updates</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">WhatsApp messages</Label>
              <Switch defaultChecked />
            </div>
          </div>
        </motion.div>
      )}

      {/* Admin Only: School Preferences */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 mb-6">
          <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" />School Preferences</h3>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <Label className="text-sm">Lecture-wise Attendance Mode</Label>
              <span className="text-xs text-muted-foreground mt-1">Enable to track attendance for each period instead of once per day.</span>
            </div>
            <Switch 
              defaultChecked={localStorage.getItem('attendanceMode') === 'subject_wise'}
              onCheckedChange={(checked) => {
                localStorage.setItem('attendanceMode', checked ? 'subject_wise' : 'day_wise');
              }}
            />
          </div>
        </motion.div>
      )}

      {/* Admin Only: API Keys */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
          <h3 className="font-semibold font-display mb-4 flex items-center gap-2"><Key className="w-5 h-5 text-primary" />API Keys</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">WhatsApp API Key</Label>
              <Input placeholder="wha_xxxxxxxxxxxxxxxx" className="mt-1 bg-secondary/50 border-glass-border rounded-xl font-mono text-sm" />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">OpenAI API Key</Label>
              <Input placeholder="sk-xxxxxxxxxxxxxxxx" className="mt-1 bg-secondary/50 border-glass-border rounded-xl font-mono text-sm" />
            </div>
          </div>
        </motion.div>
      )}

      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl gradient-primary glow text-base font-semibold">
          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Save Changes
        </Button>
      </motion.div>
    </div>
  );
};

export default Settings;
