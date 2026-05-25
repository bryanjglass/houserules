import api from '../api/client';
import Thumb from './Thumb';
import { formatCents } from '../lib/money';
import type { Role } from '../types/domain';
import type { TaskView } from '../types/models';

// Map a task to a design status pill. Pending/rejected tasks become Overdue / Due Soon
// / To Do based on their due date; completed/approved get their own pills.
function statusPill(task: TaskView): { label: string; cls: string } {
  if (task.status === 'COMPLETED') return { label: 'Waiting', cls: 'badge-due' };
  if (task.status === 'APPROVED') return { label: 'Done', cls: 'badge-ok' };
  if (task.status === 'REJECTED') return { label: 'Needs redo', cls: 'badge-over' };

  const due = task.dueDate ? new Date(task.dueDate) : null;
  if (due) {
    const days = (due.getTime() - Date.now()) / 86400000;
    if (days < 0) return { label: 'Overdue', cls: 'badge-over' };
    if (days <= 2) return { label: 'Due Soon', cls: 'badge-due' };
  }
  return { label: 'To Do', cls: 'badge-todo' };
}

function dueLabel(task: TaskView): string {
  const bits: string[] = [];
  if (task.assignedTo) bits.push(task.assignedTo.name);
  if (task.dueDate) {
    bits.push(
      'Due ' + new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    );
  }
  return bits.join(' · ');
}

export default function TaskCard({
  task,
  role,
  onUpdate,
}: {
  task: TaskView;
  role: Role;
  onUpdate: () => void;
}) {
  const handleMarkDone = async () => { await api.put(`/tasks/${task.id}`, {}); onUpdate(); };
  const handleApprove = async () => { await api.post(`/tasks/${task.id}/approve`); onUpdate(); };
  const handleReject = async () => { await api.post(`/tasks/${task.id}/reject`); onUpdate(); };
  const handleGrab = async () => {
    try {
      await api.post(`/tasks/${task.id}/claim`);
    } catch (err: any) {
      if (err.response?.status === 409) alert('Someone already grabbed this chore!');
    }
    onUpdate();
  };
  const handleDelete = async () => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await api.delete(`/tasks/${task.id}`);
    onUpdate();
  };

  const pill = statusPill(task);
  const meta = dueLabel(task);

  // An unclaimed up-for-grabs chore: a child can grab it (not mark it done yet).
  const isOpenGrab = task.isUpForGrabs && !task.assignedToId;
  const childCanGrab = role === 'CHILD' && isOpenGrab;
  const childCanAct = role === 'CHILD' && !isOpenGrab && (task.status === 'PENDING' || task.status === 'REJECTED');
  const parentCanReview = role === 'PARENT' && task.status === 'COMPLETED';
  const hasActions = childCanGrab || childCanAct || parentCanReview || role === 'PARENT';

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <Thumb size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[14px] font-bold text-ink-900 truncate">{task.title}</h3>
            {task.isUpForGrabs && (
              <span className="badge badge-grab">Up for grabs</span>
            )}
            {task.isRecurring && (
              <span className="badge badge-todo capitalize">{task.recurrence?.toLowerCase()}</span>
            )}
          </div>
          {task.description && (
            <p className="text-[11.5px] text-ink-500 mt-0.5 truncate">{task.description}</p>
          )}
          {meta && <p className="text-[11.5px] text-ink-400 mt-0.5">{meta}</p>}
        </div>
        <div className="text-right shrink-0">
          {task.dollarAmount ? (
            <div className="text-[14px] font-extrabold text-ink-900">{formatCents(task.dollarAmount)}</div>
          ) : (
            <div className="text-[12px] text-ink-300 font-semibold">No pay</div>
          )}
          <span className={`${pill.cls} mt-1`}>{pill.label}</span>
        </div>
      </div>

      {hasActions && (
        <div className="flex gap-2 mt-3">
          {childCanGrab && (
            <button
              onClick={handleGrab}
              className="flex-1 bg-violet-600 text-white text-[14px] font-bold py-2 rounded-[14px] hover:brightness-95 active:scale-[0.98] transition"
            >
              Grab it
            </button>
          )}
          {childCanAct && (
            <button onClick={handleMarkDone} className="btn-primary flex-1 !py-2 !text-[14px]">
              Mark Done
            </button>
          )}
          {parentCanReview && (
            <>
              <button
                onClick={handleApprove}
                className="flex-1 bg-money-600 text-white text-[14px] font-bold py-2 rounded-[14px] hover:bg-money-700 active:scale-[0.98] transition"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-rose-50 text-rose-600 text-[14px] font-bold py-2 rounded-[14px] hover:brightness-95 active:scale-[0.98] transition"
              >
                Reject
              </button>
            </>
          )}
          {role === 'PARENT' && (
            <button
              onClick={handleDelete}
              className="text-ink-400 hover:text-rose-500 text-[13px] font-semibold px-3 py-2 transition"
              title="Delete task"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
