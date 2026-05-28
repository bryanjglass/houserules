import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ParentDashboard from './pages/parent/Dashboard';
import ChildDetail from './pages/parent/ChildDetail';
import TaskManager from './pages/parent/TaskManager';
import EditTask from './pages/parent/EditTask';
import Settings from './pages/parent/Settings';
import ChildDashboard from './pages/child/Dashboard';
import ChildAllowance from './pages/child/Allowance';
import Calendar from './pages/Calendar';
import AppShell from './components/AppShell';

function AppRoutes() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-ink-400">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (user.role === 'PARENT') {
    return (
      <AppShell>
        <Routes>
          <Route path="/" element={<ParentDashboard />} />
          <Route path="/children/:childId" element={<ChildDetail />} />
          <Route path="/tasks/new" element={<TaskManager />} />
          <Route path="/tasks/:id/edit" element={<EditTask />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    );
  }

  return (
    <AppShell bg="bg-white">
      <Routes>
        <Route path="/" element={<ChildDashboard />} />
        <Route path="/allowance" element={<ChildAllowance />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
