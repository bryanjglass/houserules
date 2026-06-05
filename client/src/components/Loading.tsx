// Shared loading indicator — replaces the per-screen ad-hoc "Loading…" blocks.
export default function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen text-ink-400">{label}</div>
  );
}
