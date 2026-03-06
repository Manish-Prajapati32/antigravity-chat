import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import MainLayout from './components/MainLayout';
import Chat from './pages/Chat';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import AdminChats from './admin/pages/AdminChats';
import AdminMedia from './admin/pages/AdminMedia';
import AdminLogs from './admin/pages/AdminLogs';
import AdminSettings from './admin/pages/AdminSettings';
import AdminLogin from './admin/pages/AdminLogin';
import { Loader } from 'lucide-react';

// Guard: user must be logged in
const ProtectedRoute = ({ children }) => {
  const { user, token, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-dark-bg)]">
        <Loader className="w-12 h-12 text-[var(--color-neon-cyan)] animate-spin" />
      </div>
    );
  }
  if (!token && !user) return <Navigate to="/login" replace />;
  if (user && user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return children;
};

// Guard: user must have role === 'admin'
const AdminRoute = ({ children }) => {
  const { user, token, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-dark-bg)]">
        <Loader className="w-12 h-12 text-[var(--color-neon-cyan)] animate-spin" />
      </div>
    );
  }
  if (!token || !user) return <Navigate to="/admin" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User-protected */}
      <Route
        path="/profile"
        element={<ProtectedRoute><Profile /></ProtectedRoute>}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout><Chat /></MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Login */}
      <Route path="/admin" element={<AdminLogin />} />

      {/* Admin-protected — /admin/* */}
      <Route
        path="/admin/dashboard"
        element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>}
      />
      <Route
        path="/admin/users"
        element={<AdminRoute><AdminLayout><AdminUsers /></AdminLayout></AdminRoute>}
      />
      <Route
        path="/admin/chats"
        element={<AdminRoute><AdminLayout><AdminChats /></AdminLayout></AdminRoute>}
      />
      <Route
        path="/admin/media"
        element={<AdminRoute><AdminLayout><AdminMedia /></AdminLayout></AdminRoute>}
      />
      <Route
        path="/admin/logs"
        element={<AdminRoute><AdminLayout><AdminLogs /></AdminLayout></AdminRoute>}
      />
      <Route
        path="/admin/settings"
        element={<AdminRoute><AdminLayout><AdminSettings /></AdminLayout></AdminRoute>}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
