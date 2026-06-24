import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Security from "./pages/Security";
import TeacherDashboard from "./pages/TeacherDashboard";
import ReportImages from "./pages/ReportImages";
import TeacherAttendance from "./pages/TeacherAttendance";
import AdminAttendance from "./pages/AdminAttendance";
import AIFeedback from "./pages/AIFeedback";
import WhatsApp from "./pages/WhatsApp";
import VoiceMessage from "./pages/VoiceMessage";
import Scheduling from "./pages/Scheduling";
import Analytics from "./pages/Analytics";
import AdminPanel from "./pages/AdminPanel";
import ParentPortal from "./pages/ParentPortal";
import ReportGenerator from "./pages/ReportGenerator";
import Settings from "./pages/Settings";
import SectionManagement from "./pages/SectionManagement";
import StudentLeave from "./pages/StudentLeave";
import TeacherLeave from "./pages/TeacherLeave";
import TimetableManagement from "./pages/TimetableManagement";
import Substitution from "./pages/Substitution";
import NotificationCenter from "./pages/NotificationCenter";
import AuditLog from "./pages/AuditLog";
import BulkReport from "./pages/BulkReport";
import MessageRetry from "./pages/MessageRetry";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    return <Navigate to="/parent-portal" replace />;
  }
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/security" element={<Security />} />

    {/* Admin routes */}
    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminPanel /></ProtectedRoute>} />
    <Route path="/admin-attendance" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendance /></ProtectedRoute>} />
    <Route path="/analytics" element={<ProtectedRoute allowedRoles={['admin']}><Analytics /></ProtectedRoute>} />
    <Route path="/timetable" element={<ProtectedRoute allowedRoles={['admin']}><TimetableManagement /></ProtectedRoute>} />
    <Route path="/substitution" element={<ProtectedRoute allowedRoles={['admin']}><Substitution /></ProtectedRoute>} />
    <Route path="/audit-log" element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
    <Route path="/subscription" element={<ProtectedRoute allowedRoles={['admin']}><Subscription /></ProtectedRoute>} />

    {/* Admin + Teacher shared */}
    <Route path="/sections" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><SectionManagement /></ProtectedRoute>} />
    <Route path="/report-images" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><ReportImages /></ProtectedRoute>} />
    <Route path="/ai-feedback" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><AIFeedback /></ProtectedRoute>} />
    <Route path="/whatsapp" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><WhatsApp /></ProtectedRoute>} />
    <Route path="/voice" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><VoiceMessage /></ProtectedRoute>} />
    <Route path="/scheduling" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><Scheduling /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><ReportGenerator /></ProtectedRoute>} />
    <Route path="/student-leave" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><StudentLeave /></ProtectedRoute>} />
    <Route path="/teacher-leave" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><TeacherLeave /></ProtectedRoute>} />
    <Route path="/bulk-report" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><BulkReport /></ProtectedRoute>} />
    <Route path="/message-retry" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><MessageRetry /></ProtectedRoute>} />

    {/* Teacher routes */}
    <Route path="/teacher-dashboard" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
    <Route path="/teacher-attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />

    {/* Parent only */}
    <Route path="/parent-portal" element={<ProtectedRoute allowedRoles={['parent']}><ParentPortal /></ProtectedRoute>} />

    {/* Shared all roles */}
    <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppDataProvider>
            <AppRoutes />
          </AppDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
