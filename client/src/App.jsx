import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import ParentDashboard from './pages/parent/Dashboard.jsx';
import ChildDetail from './pages/parent/ChildDetail.jsx';
import TaskManager from './pages/parent/TaskManager.jsx';
import Settings from './pages/parent/Settings.jsx';
import ChildDashboard from './pages/child/Dashboard.jsx';
import ChildAllowance from './pages/child/Allowance.jsx';
import Calendar from './pages/Calendar.jsx';

function AppRoutes() {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-400">Loading...</div>
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
      <Routes>
        <Route path="/" element={<ParentDashboard />} />
        <Route path="/children/:childId" element={<ChildDetail />} />
        <Route path="/tasks/new" element={<TaskManager />} />
        <Route path="/tasks/:taskId/edit" element={<TaskManager />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ChildDashboard />} />
      <Route path="/allowance" element={<ChildAllowance />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
