// Component demos for the MilkMoney design spec page.
// Each block previews a live element + caption for handoff.

// Color swatch grid data
window.MM_COLORS = {
  Brand: [
    { name: 'Cream',     hex: '#FAF6EB', tw: 'cream',     note: 'Marketing & onboarding bg' },
    { name: 'App bg',    hex: '#F7F8FA', tw: 'app-bg',    note: 'In-app surfaces' },
    { name: 'Navy',      hex: '#1E3A8A', tw: 'navy',      note: '"Milk" wordmark, headings' },
    { name: 'Brand',     hex: '#2D7FF9', tw: 'brand',     note: 'Primary action, "Money"' },
    { name: 'Brand 100', hex: '#DBEAFE', tw: 'brand-100', note: 'Tinted bg, selected state' },
    { name: 'Brand 50',  hex: '#EFF6FF', tw: 'brand-50',  note: 'Soft fill' },
  ],
  Ink: [
    { name: 'Ink 900', hex: '#0F172A', tw: 'ink-900', note: 'Body text, headings' },
    { name: 'Ink 700', hex: '#334155', tw: 'ink-700', note: 'Labels' },
    { name: 'Ink 500', hex: '#64748B', tw: 'ink-500', note: 'Muted copy' },
    { name: 'Ink 400', hex: '#94A3B8', tw: 'ink-400', note: 'Captions, meta' },
    { name: 'Line',    hex: '#E5E7EB', tw: 'line',    note: 'Card borders, dividers' },
    { name: 'Card',    hex: '#FFFFFF', tw: 'card',    note: 'Card surface' },
  ],
  Status: [
    { name: 'Money 600', hex: '#16A34A', tw: 'money-600', note: 'Dollar amounts, earned' },
    { name: 'Money 50',  hex: '#DCFCE7', tw: 'money-50',  note: '"Available" / earned bg' },
    { name: 'Amber 600', hex: '#D97706', tw: 'amber-600', note: '"Due Soon" text' },
    { name: 'Amber 50',  hex: '#FEF3C7', tw: 'amber-50',  note: '"Due Soon" bg' },
    { name: 'Rose 600',  hex: '#DC2626', tw: 'rose-600',  note: '"Overdue", destructive' },
    { name: 'Rose 50',   hex: '#FEE2E2', tw: 'rose-50',   note: '"Overdue" bg' },
  ],
  Wallet: [
    { name: 'Teal start', hex: '#34D399', tw: 'teal-start', note: 'Wallet header gradient ⤴' },
    { name: 'Teal end',   hex: '#10B981', tw: 'teal-end',   note: 'Wallet header gradient ⤵' },
    { name: 'Coin gold',  hex: '#FCD34D', tw: 'gold',       note: 'Balance pill, coin highlights' },
    { name: 'Coin shade', hex: '#D97706', tw: 'gold-deep',  note: 'Coin shadow / depth' },
  ],
};

window.Swatch = ({ name, hex, tw, note }) => (
  <div className="swatch">
    <div className="well" style={{ background: hex }}/>
    <div className="body">
      <div className="name">{name}</div>
      <div className="vals">
        <span>{hex}</span>
        <span className="tw">--{tw}</span>
      </div>
      {note && <div style={{ marginTop: 6, fontSize: 11.5, color: '#64748B', lineHeight: 1.4 }}>{note}</div>}
    </div>
  </div>
);

// Type specimen rows
window.TypeRow = ({ role, size, weight, lh, tracking, sample, style }) => (
  <div className="type-row">
    <div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{role}</div>
      <div className="role">{size} / {weight}</div>
    </div>
    <div className="specimen" style={{ fontSize: size, fontWeight: weight, lineHeight: lh, letterSpacing: tracking, ...style }}>
      {sample}
    </div>
    <div className="specs">
      line-height: {lh}<br/>tracking: {tracking}
    </div>
  </div>
);

// Component preview block
window.Demo = ({ title, desc, children, cols = 1 }) => (
  <div className="demo">
    <h4>{title}</h4>
    <div className="desc">{desc}</div>
    <div style={{
      display: 'grid', gap: 16,
      gridTemplateColumns: cols === 1 ? '1fr' : `repeat(${cols}, 1fr)`,
      alignItems: 'start',
    }}>{children}</div>
  </div>
);

// Code snippet (no syntax highlighting libs; manual spans)
window.Code = ({ children }) => (
  <pre className="code" style={{ margin: 0 }}>{children}</pre>
);
