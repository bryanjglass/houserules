import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client';
import TaskForm from '../../components/TaskForm';
import type { Child, TaskView } from '../../types/models';

// Edit-a-task route: load the task and the household's children, then render the
// shared <TaskForm> in edit mode (all form logic lives in TaskForm).
export default function EditTask() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [task, setTask] = useState<TaskView | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.get(`/tasks/${id}`), api.get('/users/children')])
      .then(([taskRes, childrenRes]) => {
        setTask(taskRes.data);
        setChildren(childrenRes.data);
      })
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-10 text-center">
        <p className="text-ink-500">This task could not be found.</p>
        <button onClick={() => navigate(-1)} className="text-brand font-bold mt-3">Go back</button>
      </div>
    );
  }

  if (!task) {
    return <div className="max-w-lg mx-auto px-5 pt-10 text-center text-ink-400">Loading…</div>;
  }

  return <TaskForm mode="edit" children={children} initial={task} />;
}
