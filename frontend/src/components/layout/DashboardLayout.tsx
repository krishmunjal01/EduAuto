import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import {
  LayoutDashboard, Users, Image, Brain, MessageSquare, Mic, Calendar,
  BarChart3, Building2, UserCircle, FileText, Settings, Bell, Search,
  ChevronLeft, ChevronRight, LogOut, GraduationCap, Globe, Send, Moon, Sun,
  FolderOpen, ClipboardList, Clock, RefreshCw, Shield, RotateCcw, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  // Admin
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { path: '/admin', label: 'Teachers', icon: Building2, roles: ['admin'] },
  { path: '/sections', label: 'Sections', icon: FolderOpen, roles: ['admin'] },
  { path: '/admin-attendance', label: 'Attendance', icon: ClipboardList, roles: ['admin'] },
  { path: '/report-images', label: 'Report Images', icon: Image, roles: ['admin'] },
  { path: '/ai-feedback', label: 'AI Feedback', icon: Brain, roles: ['admin'] },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageSquare, roles: ['admin'] },
  { path: '/voice', label: 'Voice Messages', icon: Mic, roles: ['admin'] },
  { path: '/scheduling', label: 'Scheduling', icon: Calendar, roles: ['admin'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['admin'] },
  { path: '/student-leave', label: 'Student Leave', icon: ClipboardList, roles: ['admin'] },
  { path: '/teacher-leave', label: 'Teacher Leave', icon: Calendar, roles: ['admin'] },
  { path: '/timetable', label: 'Timetable', icon: Clock, roles: ['admin'] },
  { path: '/substitution', label: 'Substitution', icon: RefreshCw, roles: ['admin'] },
  { path: '/bulk-report', label: 'Bulk Report', icon: FileText, roles: ['admin'] },
  { path: '/message-retry', label: 'Message Retry', icon: RotateCcw, roles: ['admin'] },
  { path: '/audit-log', label: 'Audit Log', icon: Shield, roles: ['admin'] },
  { path: '/subscription', label: 'Subscription', icon: Crown, roles: ['admin'] },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  // Teacher
  { path: '/teacher-dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['teacher'] },
  { path: '/sections', label: 'Sections', icon: FolderOpen, roles: ['teacher'] },
  { path: '/teacher-attendance', label: 'Attendance', icon: ClipboardList, roles: ['teacher'] },
  { path: '/report-images', label: 'Report Images', icon: Image, roles: ['teacher'] },
  { path: '/ai-feedback', label: 'AI Feedback', icon: Brain, roles: ['teacher'] },
  { path: '/whatsapp', label: 'WhatsApp', icon: MessageSquare, roles: ['teacher'] },
  { path: '/student-leave', label: 'Student Leave', icon: ClipboardList, roles: ['teacher'] },
  { path: '/teacher-leave', label: 'My Leave', icon: Calendar, roles: ['teacher'] },
  { path: '/bulk-report', label: 'Bulk Report', icon: FileText, roles: ['teacher'] },
  { path: '/reports', label: 'Reports', icon: FileText, roles: ['teacher'] },
  // Parent
  { path: '/parent-portal', label: 'Dashboard', icon: LayoutDashboard, roles: ['parent'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'teacher', 'parent'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'teacher', 'parent'] },
];

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout, theme, toggleTheme, language, setLanguage } = useAuth();
  const { notifications } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  // Role-based notification filtering
  const myNotifications = notifications.filter(n => {
    if (n.targetRole === 'all') return true;
    if (n.targetRole === user?.role) {
      if (n.targetEmail) return n.targetEmail === user?.email;
      return true;
    }
    return false;
  });
  const unreadCount = myNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommand(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!user) { navigate('/login'); return null; }

  const roleBadgeColor = user.role === 'admin' ? 'bg-primary' : user.role === 'teacher' ? 'bg-success' : 'bg-accent';
  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Teacher' : 'Parent';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 h-screen z-40 glass-strong flex flex-col overflow-hidden"
      >
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="p-2 rounded-xl gradient-primary glow shrink-0">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <AnimatePresence>
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-bold text-lg font-display gradient-text whitespace-nowrap">
                EduAuto
              </motion.span>
          </AnimatePresence>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {filteredNav.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={`${item.path}-${item.roles[0]}`} to={item.path}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    active ? 'gradient-primary text-primary-foreground glow' : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap">
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors">
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: collapsed ? 72 : 260, transition: 'margin-left 0.3s ease-in-out' }}>
        <header className="sticky top-0 z-30 glass-strong border-b border-border px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowCommand(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/50 border border-border text-muted-foreground hover:text-foreground transition-colors text-sm">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline text-xs bg-background px-1.5 py-0.5 rounded border border-border ml-2">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setShowLangMenu(!showLangMenu)} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors">
                <Globe className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 glass rounded-xl p-2 min-w-32 shadow-xl z-50">
                    {languages.map(l => (
                      <button key={l.code} onClick={() => { setLanguage(l.code); setShowLangMenu(false); }}
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${language === l.code ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/50'}`}>
                        {l.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 rounded-xl hover:bg-secondary/50 text-muted-foreground transition-colors relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 glass rounded-xl p-3 w-80 shadow-xl z-50 max-h-96 overflow-y-auto">
                    <h3 className="font-semibold mb-3 font-display">Notifications</h3>
                    {myNotifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No notifications yet</p>
                    ) : (
                      myNotifications.slice(0, 10).map(n => (
                        <div key={n.id} className={`flex items-start gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors mb-1 ${!n.read ? 'bg-secondary/20' : ''}`}>
                          <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.type === 'success' ? 'bg-success' : n.type === 'error' ? 'bg-destructive' : 'bg-accent'}`} />
                          <div>
                            <p className="text-sm">{n.message}</p>
                            <span className="text-xs text-muted-foreground">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <Badge className={`${roleBadgeColor} text-[10px] px-1.5 py-0 h-4`}>{roleLabel}</Badge>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="p-2 rounded-xl hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette */}
      <AnimatePresence>
        {showCommand && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setShowCommand(false)}>
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative glass rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input autoFocus placeholder="Search pages, actions..." className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="p-2 max-h-64 overflow-y-auto">
                {filteredNav.map(item => (
                  <button key={`cmd-${item.path}-${item.roles[0]}`} onClick={() => { navigate(item.path); setShowCommand(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 text-left transition-colors">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (admin/teacher only) */}
      {user.role !== 'parent' && (
        <motion.div className="fixed bottom-6 right-6 z-40" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button className="w-14 h-14 rounded-2xl gradient-primary glow shadow-2xl" onClick={() => navigate('/whatsapp')}>
            <Send className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {(showNotifications || showLangMenu) && (
        <div className="fixed inset-0 z-20" onClick={() => { setShowNotifications(false); setShowLangMenu(false); }} />
      )}
    </div>
  );
};

export default DashboardLayout;
