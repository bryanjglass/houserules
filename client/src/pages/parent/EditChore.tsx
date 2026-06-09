import { useNavigate, useParams } from 'react-router-dom';
import { useChore, useChildren } from '../../api/queries';
import ChoreForm from '../../components/ChoreForm';
import Loading from '../../components/Loading';

// Edit-a-chore route: load the definition and the household's children (from
// the shared cache), then render the shared <ChoreForm> in edit mode.
export default function EditChore() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const choreQuery = useChore(id);
  const childrenQuery = useChildren();

  if (choreQuery.isError) {
    return (
      <div className="max-w-lg mx-auto px-5 pt-10 text-center">
        <p className="text-ink-500">This chore could not be found.</p>
        <button onClick={() => navigate(-1)} className="text-brand font-bold mt-3">Go back</button>
      </div>
    );
  }

  if (choreQuery.isPending || childrenQuery.isPending || !choreQuery.data) {
    return <Loading />;
  }

  return <ChoreForm mode="edit" children={childrenQuery.data ?? []} initial={choreQuery.data} />;
}
