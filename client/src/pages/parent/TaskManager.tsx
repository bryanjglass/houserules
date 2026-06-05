import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import TaskForm from '../../components/TaskForm';
import type { Child } from '../../types/models';

// Create-a-task route: load the household's children, then render the shared
// <TaskForm> in create mode (all form logic lives in TaskForm).
export default function TaskManager() {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId') || '';

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/children')
      .then(r => setChildren(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="max-w-lg mx-auto px-5 pt-10 text-center text-ink-400">Loading…</div>;
  }

  return <TaskForm mode="create" children={children} defaultChildId={preselectedChildId} />;
}
