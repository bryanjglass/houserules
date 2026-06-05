import { useNavigate, useParams } from 'react-router-dom';
import { useTask, useChildren } from '../../api/queries';
import TaskForm from '../../components/TaskForm';
import Loading from '../../components/Loading';

// Edit-a-task route: load the task and the household's children (from the shared
// cache), then render the shared <TaskForm> in edit mode.
export default function EditTask() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const taskQuery = useTask(id);
  const childrenQuery = useChildren();

  if (taskQuery.isError) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-10 text-center">
        <p className="text-ink-500">This task could not be found.</p>
        <button onClick={() => navigate(-1)} className="text-brand font-bold mt-3">Go back</button>
      </div>
    );
  }

  if (taskQuery.isPending || childrenQuery.isPending || !taskQuery.data) {
    return <Loading />;
  }

  return <TaskForm mode="edit" children={childrenQuery.data ?? []} initial={taskQuery.data} />;
}
