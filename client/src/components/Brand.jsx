// Brand atoms: the MilkMoney wordmark, the jar logo tile, and the kid avatar.

// Two-tone wordmark — navy "Milk" + brand-blue "Money".
export function Wordmark({ size = 28, className = '' }) {
  return (
    <div
      className={`font-extrabold leading-none ${className}`}
      style={{ letterSpacing: '-0.02em', fontSize: size }}
    >
      <span className="text-navy">Milk</span>
      <span className="text-brand">Money</span>
    </div>
  );
}

// Jar-in-a-blue-tile logo, built from primitives (placeholder for the real app icon).
export function LogoTile({ size = 64 }) {
  return (
    <div
      className="grid place-items-center relative"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(180deg, #4F9BFF 0%, #2D7FF9 100%)',
        boxShadow:
          '0 6px 14px rgba(45,127,249,0.35), inset 0 -6px 10px rgba(0,0,0,0.08), inset 0 2px 3px rgba(255,255,255,0.45)',
      }}
    >
      <div
        className="relative grid place-items-center"
        style={{
          width: '54%',
          height: '60%',
          background: '#fff',
          borderRadius: '6px 6px 12px 12px',
          boxShadow: 'inset 0 -4px 0 #ECEDEF, 0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-12%',
            left: '20%',
            right: '20%',
            height: '16%',
            background: '#fff',
            borderRadius: '3px 3px 0 0',
            boxShadow: 'inset 0 -2px 0 #ECEDEF',
          }}
        />
        <div
          className="grid place-items-center text-white font-extrabold"
          style={{
            width: '70%',
            height: '38%',
            background: '#16A34A',
            borderRadius: 2,
            fontSize: size * 0.16,
            boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.4)',
          }}
        >
          $
        </div>
      </div>
    </div>
  );
}

// Soft pastel avatar with a white ring + hairline outer. Tone is derived from the name
// so each child gets a stable color. Initial-only; drop in real portraits later.
const TONES = {
  peach: '#FFE6D6',
  sky: '#D6ECFF',
  mint: '#D6F5E3',
  lilac: '#E7DEFF',
  rose: '#FFD9E2',
};
const TONE_ORDER = ['peach', 'sky', 'mint', 'lilac', 'rose'];

export function avatarTone(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONE_ORDER[h % TONE_ORDER.length];
}

export function Avatar({ name = '', tone, size = 44 }) {
  const t = tone || avatarTone(name);
  return (
    <div
      className="grid place-items-center text-ink-700 font-extrabold shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: TONES[t] || TONES.peach,
        border: '2px solid #fff',
        boxShadow: '0 0 0 1px #E5E7EB',
        fontSize: size * 0.36,
        letterSpacing: '-0.02em',
      }}
    >
      {(name?.[0] || '?').toUpperCase()}
    </div>
  );
}
