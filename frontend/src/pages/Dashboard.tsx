import { useAuth } from '@/contexts/AuthContext';
import AdminDashboard from './AdminDashboard';

// Dashboard route redirects based on role, but for /dashboard (admin), render AdminDashboard
const Dashboard = () => {
  return <AdminDashboard />;
};

export default Dashboard;
