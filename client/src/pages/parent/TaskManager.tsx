import { useSearchParams } from 'react-router-dom';
import { useChildren } from '../../api/queries';
import TaskForm from '../../components/TaskForm';
import QueryBoundary from '../../components/QueryBoundary';

// Create-a-task route: load the household's children (from the shared cache),
// then render the shared <TaskForm> in create mode.
export default function TaskManager() {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId') || '';
  const childrenQuery = useChildren();

  return (
    <QueryBoundary isPending={childrenQuery.isPending} isError={childrenQuery.isError} onRetry={childrenQuery.refetch}>
      <TaskForm mode="create" children={childrenQuery.data ?? []} defaultChildId={preselectedChildId} />
    </QueryBoundary>
  );
}
