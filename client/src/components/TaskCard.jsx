import api from '../api/client.js';

const STATUS_STYLES = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  APPROVED:  'bg-green-100 text-green-800',
  REJECTED:  'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  PENDING:   'To Do',
  COMPLETED: 'Waiting for approval',
  APPROVED:  'Done ✓',
  REJECTED:  'Needs redo',
};

export default function TaskCard({ task, role, onUpdate }) {
  const handleMarkDone = async () => {
    await api.put(`/tasks/${task.id}`, {});
    onUpdate();
  };

  const handleApprove = async () => {
    await api.post(`/tasks/${task.id}/approve`);
    onUpdate();
  };

  const handleReject = async () => {
    await api.post(`/tasks/${task.id}/reject`);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await api.delete(`/tasks/${task.id}`);
    onUpdate();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
            {task.isRecurring && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                {task.recurrence?.toLowerCase()}
              </span>
            )}
          </div>
          {task.description && (
            <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
          )}
          {task.assignedTo && (
            <p className="text-xs text-gray-400 mt-1">Assigned to: {task.assignedTo.name}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {task.dollarAmount ? (
            <span className="text-green-600 font-bold">${task.dollarAmount.toFixed(2)}</span>
          ) : (
            <span className="text-gray-300 text-sm">No pay</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>
      </div>

      {task.dueDate && (
        <p className="text-xs text-gray-400 mt-2">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </p>
      )}

      <div className="flex gap-2 mt-3 flex-wrap">
        {role === 'CHILD' && (task.status === 'PENDING' || task.status === 'REJECTED') && (
          <button
            onClick={handleMarkDone}
            className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-indigo-700 active:scale-95 transition"
          >
            Mark Done
          </button>
        )}
        {role === 'PARENT' && task.status === 'COMPLETED' && (
          <>
            <button
              onClick={handleApprove}
              className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 active:scale-95 transition"
            >
              Approve
            </button>
            <button
              onClick={handleReject}
              className="flex-1 bg-red-100 text-red-700 text-sm font-semibold py-2 rounded-lg hover:bg-red-200 active:scale-95 transition"
            >
              Reject
            </button>
          </>
        )}
        {role === 'PARENT' && (
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 text-sm px-2 py-2 transition"
            title="Delete task"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  );
}
