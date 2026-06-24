import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  FileText,
  Smartphone,
  Brain,
  CalendarClock,
  MessageSquareDiff,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  BarChart3,
  BellRing,
  Code2,
  MonitorPlay
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  // 3D Tilt Effect Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { damping: 30, stiffness: 200 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { damping: 30, stiffness: 200 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set(x / rect.width - 0.5);
    mouseY.set(y / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const allFeatures = [
    "AI OCR Grading", "WhatsApp Integration", "Voice Messaging", "Smart Timetables", 
    "Substitution Engine", "Role-Based Access", "Parent Portals", "Admin Analytics",
    "Audit Logs", "Bulk Report Generator", "Student Leaves", "Teacher Leaves",
    "Real-Time Attendance", "GenAI Feedback", "Multi-Tenant Architecture"
  ];

  // Typing effect text
  const waMessage = "Hello! Arjun's Math results have been published. He scored 85/100 (Top 10%).";
  const waWords = waMessage.split(" ");

  const featureTabs = [
    {
      id: "academics",
      title: "Academics & AI",
      icon: Brain,
      headline: "Grade 50 papers in 5 seconds.",
      desc: "Our flagship OCR engine reads messy handwriting, extracts marks, and syncs them to the database. Coupled with Google GenAI, it auto-generates personalized student feedback.",
      color: "from-cyan-400 to-blue-500",
      ui: (
        <div className="space-y-4 font-mono">
          <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              <FileText className="text-cyan-400 w-5 h-5" />
              <span className="text-sm text-slate-300">Math_Midterm_Batch.pdf</span>
            </div>
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }} 
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded"
            >
              Processing
            </motion.span>
          </div>
          <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
              initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
            className="flex flex-col gap-1 text-xs text-emerald-400 mt-4"
          >
            <div className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Extracted Roll #42: 85/100</div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Extracted Roll #43: 92/100</motion.div>
          </motion.div>
        </div>
      ),
      code: `import cv2, easyocr, google.genai
# AI Vision Pipeline
def grade_paper(image_path):
    img = cv2.imread(image_path)
    cleaned = preprocess(img)
    
    # Anchor-based extraction
    marks = ocr.readtext(cleaned, allowlist='0123456789/')
    
    # Generate Feedback
    prompt = f"Write parent feedback for score {marks}"
    feedback = genai.generate_text(prompt)
    
    return db.sync(marks, feedback)`
    },
    {
      id: "communication",
      title: "Communication",
      icon: Smartphone,
      headline: "Zero effort parent syncing.",
      desc: "Attendance marked? Test graded? Circular issued? EduAuto instantly pushes targeted WhatsApp and Voice messages to the exact parents who need to know.",
      color: "from-emerald-400 to-green-500",
      ui: (
        <div className="relative h-full flex flex-col items-center justify-center">
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
            className="bg-[#0b141a]/90 border border-emerald-500/20 p-4 rounded-2xl w-full max-w-sm ml-auto rounded-tr-sm shadow-2xl backdrop-blur-md"
          >
            <div className="text-xs text-emerald-400 font-semibold mb-1">EduAuto Bot</div>
            <p className="text-sm text-[#e9edef] leading-relaxed">
              {waWords.map((word, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1, delay: i * 0.1 }}
                >
                  {word}{" "}
                </motion.span>
              ))}
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: waWords.length * 0.1 }} className="text-[10px] text-[#8696a0] mt-2 text-right">
              10:42 AM <CheckCircle2 className="inline w-3 h-3 text-[#53bdeb] ml-1" />
            </motion.div>
          </motion.div>
        </div>
      ),
      code: `// Node.js Event Listener
eventBus.on('result_published', async (data) => {
  const parents = await db.getParents(data.classId);
  
  parents.forEach(parent => {
    whatsappAPI.sendMessage(parent.phone, {
      template: 'exam_result_v2',
      variables: [
        parent.childName,
        data.subject,
        data.score,
        data.percentile
      ]
    });
  });
});`
    },
    {
      id: "admin",
      title: "Administration",
      icon: ShieldCheck,
      headline: "Total oversight. Zero chaos.",
      desc: "From smart substitution algorithms that auto-assign sick teachers, to un-deletable audit logs and bulk report generation. Manage the entire school from one dashboard.",
      color: "from-purple-400 to-pink-500",
      ui: (
        <div className="space-y-3 relative">
          <div className="absolute top-0 bottom-0 left-[11px] w-[2px] bg-white/5 z-0"></div>
          {[
            { action: "Teacher substitution assigned", user: "System", time: "Just now", color: "text-purple-400", dot: "bg-purple-400" },
            { action: "Generated 400 Report Cards", user: "Admin", time: "15m ago", color: "text-blue-400", dot: "bg-blue-400" },
            { action: "Modified timetable slot", user: "Principal", time: "1h ago", color: "text-slate-400", dot: "bg-slate-400" }
          ].map((log, i) => (
            <motion.div 
              key={i} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}
              className="flex items-center justify-between p-3 bg-slate-900/60 border border-white/5 rounded-lg ml-6 relative z-10 hover:bg-slate-800/60 transition-colors"
            >
              <div className={`absolute -left-[29px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#050505] ${log.dot}`}></div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-200">{log.action}</span>
                <span className="text-xs text-slate-500">by {log.user}</span>
              </div>
              <span className={`text-xs font-mono ${log.color}`}>{log.time}</span>
            </motion.div>
          ))}
        </div>
      ),
      code: `// Secure Audit Trailing Middleware
export const auditLogger = async (req, res, next) => {
  const originalSend = res.send;
  res.send = async function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (req.method !== 'GET') {
        await prisma.auditLog.create({
          data: {
            action: req.route.path,
            method: req.method,
            userId: req.user.id,
            role: req.user.role,
            timestamp: new Date()
          }
        });
      }
    }
    originalSend.call(this, data);
  };
  next();
};`
    },
    {
      id: "attendance",
      title: "Attendance",
      icon: Users,
      headline: "Mark it once. Sync everywhere.",
      desc: "Teachers mark attendance in seconds. The system instantly updates the admin dashboard and pushes WhatsApp alerts to parents of absent students.",
      color: "from-blue-400 to-indigo-500",
      ui: (
        <div className="space-y-3">
          {["Arjun Kumar", "Priya Singh", "Rahul Verma"].map((name, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-900/80 rounded-lg border border-white/5">
              <span className="text-sm font-medium text-slate-300">{name}</span>
              <div className="flex gap-2">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs ${i === 2 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {i === 2 ? 'ABSENT' : 'PRESENT'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "timetable",
      title: "Timetables",
      icon: CalendarClock,
      headline: "Conflict-free scheduling.",
      desc: "Design complex school timetables with zero clashes. Our engine automatically flags double-bookings and suggests available substitute teachers.",
      color: "from-pink-400 to-rose-500",
      ui: (
        <div className="grid grid-cols-3 gap-3 h-full">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={`rounded-xl p-3 flex flex-col justify-center items-center text-center ${i === 5 ? 'bg-rose-500/10 border border-rose-500/30' : 'bg-slate-800/40 border border-white/5'}`}>
              <span className="text-xs text-slate-400 mb-1">Period {i}</span>
              <span className={`text-sm font-bold ${i === 5 ? 'text-rose-400' : 'text-slate-200'}`}>{i === 5 ? 'Substitute' : 'Maths'}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: BarChart3,
      headline: "See the bigger picture.",
      desc: "Instantly generate visual dashboards covering school-wide attendance trends, fee collection rates, and academic performance percentiles across all sections.",
      color: "from-amber-400 to-orange-500",
      ui: (
        <div className="h-full flex items-end gap-3 pb-2 px-4 border-b border-l border-white/10">
          {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
              className="flex-1 bg-gradient-to-t from-orange-500/20 to-amber-400 rounded-t-md relative group"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-amber-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {h}%
              </div>
            </motion.div>
          ))}
        </div>
      ),
      code: `// Aggregation Pipeline
async function generateSchoolReport() {
  const stats = await prisma.attendance.groupBy({
    by: ['date', 'classId'],
    _count: { studentId: true },
    where: { status: 'PRESENT' }
  });
  
  const revenue = await prisma.fees.aggregate({
    _sum: { amount: true },
    where: { 
      status: 'PAID',
      createdAt: { gte: startOfMonth }
    }
  });

  return { stats, revenue };
}`
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 selection:bg-cyan-500/30 overflow-x-hidden font-sans">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTU0LjYyNyAwTDYwIDUuMzczSDAuMzczTDYuNCAwaDQ4LjIyN3oiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-20"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#050505]/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)] group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-[#050505]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">EduAuto</span>
          </div>
          <div className="flex items-center gap-6">
            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 hidden sm:flex" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button className="bg-white text-[#050505] hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all rounded-full px-6" onClick={() => navigate('/signup')}>
              Launch Workspace
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 lg:pt-28 lg:pb-32 z-10 min-h-[85vh] flex flex-col justify-center">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="max-w-2xl text-left relative z-20"
            >
              <motion.p variants={fadeUp} className="text-xs font-bold tracking-[0.2em] text-cyan-500 uppercase mb-6">
                EduAuto Pro Phase 5
              </motion.p>
              
              <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[1.05] text-white">
                Your School, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">
                  On Autopilot.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-light">
                Eliminate manual data entry. Grade papers instantly with OCR, auto-assign substitutes, and let the system seamlessly sync with parents via WhatsApp.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 h-14 px-8 text-base font-bold rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] group transition-all" onClick={() => navigate('/signup')}>
                  Start Automating <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base border-white/10 text-slate-300 hover:bg-white/5 rounded-full backdrop-blur-sm" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                  Explore Features
                </Button>
              </motion.div>
            </motion.div>

            {/* Advanced Floating Hero Visual */}
            <div className="relative h-[600px] w-full hidden lg:block perspective-1000 z-10">
              {mounted && (
                <div className="absolute inset-0 flex items-center justify-center preserve-3d">
                  {/* Base Glass Panel */}
                  <motion.div 
                    initial={{ opacity: 0, rotateX: 20, rotateY: -10, y: 50 }}
                    animate={{ opacity: 1, rotateX: 10, rotateY: -15, y: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute w-[500px] h-[350px] bg-slate-900/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6"
                  >
                    <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    </div>
                    {/* Fake Chart */}
                    <div className="flex gap-4 items-end h-40 opacity-50">
                      {[40, 70, 45, 90, 65, 85, 100].map((h, i) => (
                        <div key={i} className="flex-1 bg-cyan-500/20 rounded-t-sm" style={{ height: `${h}%` }}>
                          <div className="w-full bg-cyan-500 rounded-t-sm" style={{ height: '4px' }}></div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Floating Notification */}
                  <motion.div 
                    animate={{ y: [0, -15, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-0 w-64 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-4 items-center transform translate-z-50"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <BellRing className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Attendance Synced</div>
                      <div className="text-xs text-slate-400">Parents notified via WA</div>
                    </div>
                  </motion.div>

                  {/* Floating Action Card */}
                  <motion.div 
                    animate={{ y: [0, 20, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-10 left-[-20px] w-56 bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl transform translate-z-50"
                  >
                     <div className="text-xs text-cyan-400 font-mono mb-2">ocr_pipeline_active</div>
                     <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-cyan-400"
                         animate={{ width: ["0%", "100%", "0%"] }}
                         transition={{ duration: 3, repeat: Infinity }}
                       />
                     </div>
                     <div className="text-xs text-slate-300 mt-2">Processing 150 sheets...</div>
                  </motion.div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Infinite Feature Marquee */}
      <div className="py-10 border-y border-white/5 bg-slate-900/30 overflow-hidden relative z-10 flex">
        <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[#050505] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[#050505] to-transparent z-20 pointer-events-none"></div>
        
        <motion.div 
          className="flex gap-8 whitespace-nowrap min-w-max"
          animate={{ x: [0, -1500] }}
          transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
        >
          {/* Double array for seamless loop */}
          {[...allFeatures, ...allFeatures].map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-cyan-500/50" />
              <span className="text-lg font-medium text-slate-400 uppercase tracking-widest">{feature}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Interactive Feature Ecosystem Showcase */}
      <section id="features" className="py-32 relative z-10 perspective-1000">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">The Unified Ecosystem</h2>
            <p className="text-slate-400 text-xl max-w-2xl mx-auto font-light">Built from the ground up to connect every single aspect of your school seamlessly.</p>
          </motion.div>

          <motion.div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY }}
            className="max-w-6xl mx-auto bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-4 md:p-8 shadow-2xl flex flex-col md:flex-row gap-8 preserve-3d"
          >
            
            {/* Tabs List */}
            <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:w-1/3 shrink-0 scrollbar-hide pb-2 md:pb-0 relative z-10 transform translate-z-20">
              {featureTabs.map((tab, idx) => {
                const isActive = activeTab === idx;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(idx)}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left whitespace-nowrap md:whitespace-normal
                      ${isActive ? 'bg-white/10 border-white/10 shadow-lg' : 'hover:bg-white/5 border-transparent'} border
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? `bg-gradient-to-br ${tab.color}` : 'bg-slate-800'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-400'}`}>{tab.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 bg-[#050505] rounded-3xl border border-white/5 p-8 relative overflow-hidden min-h-[420px] flex flex-col justify-center transform translate-z-30 shadow-inner">
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="h-full flex flex-col justify-between pt-8 md:pt-0"
                >
                  <div className="mb-10 relative z-10">
                    <h3 className={`text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r mb-4 ${featureTabs[activeTab].color}`}>
                      {featureTabs[activeTab].headline}
                    </h3>
                    <p className="text-slate-300 text-base md:text-lg leading-relaxed font-light">
                      {featureTabs[activeTab].desc}
                    </p>
                  </div>
                  
                  {/* Mockup Area */}
                  <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 relative overflow-hidden h-72">
                    <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-20 bg-gradient-to-br ${featureTabs[activeTab].color}`}></div>
                    <div className="relative z-10 h-full">
                      {featureTabs[activeTab].ui}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* The Three Pillars (Refined) */}
      <section className="py-32 bg-gradient-to-b from-transparent to-slate-900/20 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp} className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">One Platform. Three Experiences.</h2>
            <p className="text-slate-400">Strictly isolated, beautifully crafted dashboards for everyone.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: ShieldCheck, title: "Administrators", desc: "Un-deletable audit logs, bird's-eye analytics, and complete control over the school's data architecture." },
              { icon: Briefcase, title: "Teachers", desc: "A calm space focused entirely on teaching. The system handles the busywork of grading and attendance." },
              { icon: Users, title: "Parents", desc: "Real-time visibility. Attendance alerts, Voice updates, and beautiful digital report cards straight to their phone." }
            ].map((role, i) => (
              <motion.div 
                key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeUp}
                className="bg-slate-900/40 backdrop-blur-sm border border-white/5 p-10 rounded-[2rem] hover:bg-slate-800/40 transition-colors"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <role.icon className="w-8 h-8 text-cyan-400" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-4">{role.title}</h4>
                <p className="text-slate-400 leading-relaxed font-light">{role.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
          <div className="w-full h-full max-w-[800px] bg-gradient-to-b from-cyan-500/10 to-purple-500/10 blur-3xl rounded-full"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white tracking-tight">Ready for the future?</h2>
            <p className="text-slate-400 text-xl mb-10 font-light">Join the schools that have already automated their entire workflow.</p>
            <Button size="lg" className="bg-white hover:bg-slate-200 text-slate-950 rounded-full h-16 px-12 text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all" onClick={() => navigate('/signup')}>
              Launch Free Workspace
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050505] py-12 relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500 font-light">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="font-bold text-slate-300">EduAuto</span>
          </div>
          <p>© 2026 Krish Munjal. Built with cutting-edge tech.</p>
          <div className="flex gap-6">
            <span onClick={() => navigate('/privacy')} className="cursor-pointer hover:text-white transition-colors">Privacy Policy</span>
            <span onClick={() => navigate('/security')} className="cursor-pointer hover:text-white transition-colors">Security</span>
            <a href="https://krishmunjal.dev" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors font-medium">krishmunjal.dev</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
