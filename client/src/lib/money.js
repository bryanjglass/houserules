// Money is integer cents everywhere over the wire and in app state.
// These helpers are the only place dollars<->cents conversion happens.

export function formatCents(cents) {
  const n = Number(cents) || 0;
  return `$${(n / 100).toFixed(2)}`;
}

export function dollarsToCents(value) {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
