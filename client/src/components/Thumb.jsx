import { TasksIcon } from './Icons.jsx';

// Rounded placeholder thumbnail for a task ("pet thumb" slot in the design).
// Real illustrated 40x40 thumbs (dog, dishwasher, bed, trash, bike) drop in here later.
export default function Thumb({ size = 40, tint = '#EFF6FF', color = '#2D7FF9' }) {
  return (
    <div
      className="grid place-items-center shrink-0 border border-line"
      style={{ width: size, height: size, borderRadius: 12, background: tint, color }}
    >
      <TasksIcon size={size * 0.5} />
    </div>
  );
}
