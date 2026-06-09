import { useSearchParams } from 'react-router-dom';
import { useChildren } from '../../api/queries';
import ChoreForm from '../../components/ChoreForm';
import QueryBoundary from '../../components/QueryBoundary';

// Create-a-chore route: load the household's children (from the shared cache),
// then render the shared <ChoreForm> in create mode.
export default function NewChore() {
  const [searchParams] = useSearchParams();
  const preselectedChildId = searchParams.get('childId') || '';
  const childrenQuery = useChildren();

  return (
    <QueryBoundary isPending={childrenQuery.isPending} isError={childrenQuery.isError} onRetry={childrenQuery.refetch}>
      <ChoreForm mode="create" children={childrenQuery.data ?? []} defaultChildId={preselectedChildId} />
    </QueryBoundary>
  );
}
