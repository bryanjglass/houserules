// MilkMoney — Recreated screens (1:1 with the source mockup)
// Each screen is a self-contained <Phone> body.

// ───────────────────────── shared atoms ─────────────────────────
const Wordmark = ({ size = 28 }) => (
  <div style={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, fontSize: size }}>
    <span style={{ color: '#1E3A8A' }}>Milk</span><span style={{ color: '#2D7FF9' }}>Money</span>
  </div>
);

const StatusBar = () => (
  <div style={{
    height: 44, padding: '14px 26px 4px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    fontSize: 14, fontWeight: 700, color: '#0F172A',
    position: 'relative', zIndex: 1,
  }}>
    <span>9:41</span>
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="9" y="3" width="3" height="8" rx="0.5" fill="currentColor"/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill="currentColor"/></svg>
      <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.8c2 0 3.8.8 5.2 2.1l1-1A8.2 8.2 0 0 0 7.5 1.4 8.2 8.2 0 0 0 1.3 4l1 1A7 7 0 0 1 7.5 2.8Zm0 3.1c1.2 0 2.3.5 3.1 1.2l1-1A5.6 5.6 0 0 0 7.5 4.5 5.6 5.6 0 0 0 3.4 6l1 1A4.5 4.5 0 0 1 7.5 5.9Z" fill="currentColor"/><circle cx="7.5" cy="9.2" r="1.3" fill="currentColor"/></svg>
      <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" fill="none" opacity="0.4"/><rect x="2" y="2" width="17" height="7" rx="1.2" fill="currentColor"/><path d="M22 4v3c.5-.2 1-.7 1-1.5S22.5 4.2 22 4Z" fill="currentColor" opacity="0.4"/></svg>
    </div>
  </div>
);

// Phone shell — used in the design canvas
const Phone = ({ children, bg = '#fff' }) => (
  <div className="phone" style={{ background: bg }}>
    <div className="notch"/>
    <StatusBar/>
    <div style={{ height: 'calc(100% - 44px)', overflow: 'hidden', background: bg, position: 'relative' }}>
      {children}
    </div>
  </div>
);

// Reusable bottom tab bar
const TabBar = ({ active = 'Home', tint = '#2D7FF9' }) => {
  const tabs = ['Home', 'Tasks', 'Calendar', 'Wallet', 'More'];
  const icons = {
    Home: <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>,
    Tasks: <><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m8 12 3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>,
    Calendar: <><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    Wallet: <><rect x="3" y="6" width="18" height="13" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M3 10h18M16 14h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></>,
    More: <><circle cx="6" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="18" cy="12" r="1.6" fill="currentColor"/></>,
  };
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #F1F3F5',
      padding: '10px 14px 22px', display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => {
        const on = t === active;
        return (
          <div key={t} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? tint : '#94A3B8',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24">{icons[t]}</svg>
            <span style={{ fontSize: 10, fontWeight: on ? 700 : 600 }}>{t}</span>
          </div>
        );
      })}
    </div>
  );
};

// Avatar placeholder (NO illustrated kid faces — labeled circle)
const Avatar = ({ name, tone = 'peach', size = 44 }) => {
  const palette = {
    peach: '#FFE6D6', sky: '#D6ECFF', mint: '#D6F5E3', lilac: '#E7DEFF',
    rose: '#FFD9E2',
  };
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: palette[tone], border: '2px solid #fff',
      boxShadow: '0 0 0 1px #E5E7EB',
      display: 'grid', placeItems: 'center',
      color: '#334155', fontWeight: 800, fontSize: size * 0.36,
      letterSpacing: '-0.02em',
    }}>{name?.[0]}</div>
  );
};

// Pet thumbnail (placeholder, stripes + label)
const PetThumb = ({ label = 'pet', size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: 12, flexShrink: 0,
    border: '1px solid #E5E7EB',
    background: 'repeating-linear-gradient(135deg, #fff 0 4px, #F4F6F8 4px 8px)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'JetBrains Mono, monospace', fontSize: 8.5, color: '#94A3B8',
    textAlign: 'center', lineHeight: 1.1, padding: 4,
  }}>{label}</div>
);

// Illustration placeholder (sized box w/ monospace caption)
const IllusBox = ({ w = '100%', h = 160, label = 'illustration', radius = 18 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    border: '1px dashed #C7D2DC',
    background: 'repeating-linear-gradient(135deg, #fff 0 6px, #F4F6F8 6px 12px)',
    display: 'grid', placeItems: 'center',
    fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#64748B',
    textAlign: 'center', padding: 12,
  }}>{label}</div>
);

const Bell = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);

// App icon tile — blue rounded square w/ milk-bottle illustration
const LogoTile = ({ size = 64 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.22,
    background: 'linear-gradient(180deg, #5BA0FF 0%, #2D7FF9 100%)',
    boxShadow: '0 8px 18px rgba(45,127,249,0.35), inset 0 -6px 10px rgba(0,0,0,0.10), inset 0 2px 3px rgba(255,255,255,0.45)',
    display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden',
  }}>
    <img src="assets/icon-bottle.png" alt=""
      style={{ width: '74%', height: '74%', objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}/>
  </div>
);

// ──────────────────────── Screen 1 — Parent Login ────────────────────────
window.Screen1ParentLogin = () => (
  <Phone bg="linear-gradient(180deg, #EAF4FF 0%, #F8FBFF 50%, #FFFFFF 100%)">
    <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <LogoTile size={68}/>
        <Wordmark size={26}/>
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.15, color: '#0F172A', textAlign: 'center', margin: '28px 0 10px', maxWidth: 240, letterSpacing: '-0.01em' }}>
        Raise responsible kids and smart savers.
      </h2>
      <p style={{ fontSize: 13.5, color: '#64748B', textAlign: 'center', margin: 0, lineHeight: 1.5, maxWidth: 260 }}>
        The simple way to manage chores and allowance as a family.
      </p>
      <div style={{ width: '100%', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        <button style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: '#2D7FF9', color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          boxShadow: '0 4px 14px rgba(45,127,249,0.35)',
        }}>Log In as Parent</button>
        <button style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: '#fff', color: '#2D7FF9', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          border: '1.5px solid #DBEAFE',
        }}>Create Parent Account</button>
        <button style={{
          background: 'transparent', border: 'none', color: '#2D7FF9',
          fontWeight: 600, fontSize: 14, fontFamily: 'inherit', marginTop: 6, cursor: 'pointer',
        }}>Switch to Kid Login</button>
      </div>
      <img src="assets/landscape.png" alt=""
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', display: 'block', pointerEvents: 'none' }}/>
    </div>
  </Phone>
);

// ──────────────────────── Screen 2 — Parent Dashboard ────────────────────────
window.Screen2ParentDash = () => (
  <Phone bg="#fff">
    <div style={{ padding: '14px 20px 0', height: '100%', overflow: 'auto', paddingBottom: 90 }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name="A" tone="peach" size={46}/>
          <div>
            <div style={{ fontSize: 13, color: '#64748B' }}>Good morning,</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>Alex!</div>
          </div>
        </div>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: '#F4F6F8', display: 'grid', placeItems: 'center' }}>
          <Bell/>
        </div>
      </div>

      {/* Your Family */}
      <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Your Family</div>
        <div style={{ fontSize: 12.5, color: '#2D7FF9', fontWeight: 700 }}>Edit</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 10 }}>
        {[
          { name: 'Abby', bal: '$18.75', tone: 'rose' },
          { name: 'Owen', bal: '$24.50', tone: 'sky' },
        ].map(k => (
          <div key={k.name} style={{
            border: '1px solid #E5E7EB', borderRadius: 14, padding: '12px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: '#fff',
          }}>
            <Avatar name={k.name} tone={k.tone} size={40}/>
            <div style={{ fontSize: 12.5, fontWeight: 700 }}>{k.name}</div>
            <div style={{ fontSize: 13, color: '#16A34A', fontWeight: 800 }}>{k.bal}</div>
            <div style={{ fontSize: 10, color: '#94A3B8' }}>Balance</div>
          </div>
        ))}
        <div style={{
          border: '1.5px dashed #CBD5E1', borderRadius: 14,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          color: '#64748B',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>Add Child</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        {[
          { icon: '$', label: 'Total Allowance Paid', value: '$86.25', tint: '#16A34A' },
          { icon: '✓', label: 'Chores Completed',     value: '23',      tint: '#2D7FF9' },
        ].map(s => (
          <div key={s.label} style={{
            border: '1px solid #E5E7EB', borderRadius: 14, padding: 12,
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: s.tint + '15', color: s.tint, display: 'grid', placeItems: 'center', fontWeight: 800 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{s.value}</div>
              <div style={{ fontSize: 9.5, color: '#94A3B8' }}>This month</div>
            </div>
          </div>
        ))}
      </div>

      {/* Outstanding Chores */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Outstanding Chores</div>
        <div style={{ fontSize: 12.5, color: '#2D7FF9', fontWeight: 700 }}>View all</div>
      </div>
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { title: 'Clean room', sub: 'Abby · Due May 18', amount: '$5.00', badge: 'Due Soon', tone: 'due', pet: 'dog' },
          { title: 'Take out trash', sub: 'Owen · Due May 17', amount: '$3.00', badge: 'Overdue', tone: 'over', pet: 'kid' },
        ].map(t => (
          <div key={t.title} style={{
            border: '1px solid #E5E7EB', borderRadius: 14, padding: 12,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <PetThumb label={t.pet}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{t.title}</div>
              <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{t.sub}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{t.amount}</div>
              <div style={{
                marginTop: 4, display: 'inline-block', padding: '3px 8px', borderRadius: 999,
                fontSize: 10, fontWeight: 700,
                background: t.tone === 'over' ? '#FEE2E2' : '#FEF3C7',
                color: t.tone === 'over' ? '#DC2626' : '#D97706',
              }}>{t.badge}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <TabBar active="Home"/>
  </Phone>
);

// ──────────────────────── Screen 3 — Create Task ────────────────────────
window.Screen3CreateTask = () => (
  <Phone bg="#fff">
    <div style={{ padding: '8px 20px 0', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0 14px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Create New Task</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#2D7FF9' }}>Save</div>
      </div>

      {/* Task Title */}
      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Task Title</label>
      <div style={{
        marginTop: 6, border: '1.5px solid #E5E7EB', borderRadius: 12,
        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: '#0F172A' }}>Feed the dog</div>
        <PetThumb label="dog" size={28}/>
      </div>

      {/* Description */}
      <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155', marginTop: 14, display: 'block' }}>
        Description <span style={{ color: '#94A3B8', fontWeight: 500 }}>(optional)</span>
      </label>
      <div style={{
        marginTop: 6, border: '1.5px solid #E5E7EB', borderRadius: 12,
        padding: '10px 12px', fontSize: 13.5, color: '#0F172A',
      }}>Make sure he gets fresh water too!</div>

      {/* Reward + Due Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Reward</label>
          <div style={{ marginTop: 6, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 999, background: '#DCFCE7', color: '#15803D', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12 }}>$</div>
            <span style={{ fontSize: 14.5, fontWeight: 700 }}>4.00</span>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Due Date</label>
          <div style={{ marginTop: 6, border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D7FF9" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>May 20, 2025</span>
            <span style={{ fontSize: 14, color: '#94A3B8' }}>×</span>
          </div>
        </div>
      </div>

      {/* Assign To */}
      <div style={{ marginTop: 16, fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Assign To</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
        {[
          { name: 'Abby', tone: 'rose' },
          { name: 'Owen', tone: 'sky' },
        ].map(k => (
          <div key={k.name} style={{
            border: '1.5px solid #E5E7EB', borderRadius: 14, padding: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Avatar name={k.name} tone={k.tone} size={28}/>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{k.name}</span>
          </div>
        ))}
        <div style={{
          border: '1.5px solid #2D7FF9', borderRadius: 14, padding: 10,
          background: '#EFF6FF',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="m12 2 2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7L2 9.5l7.1-.6L12 2Z"/></svg>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1E6BE0' }}>Up for grabs</span>
        </div>
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11 }}>★</span>
        Up for grabs tasks can be claimed by any child.
      </div>

      {/* Category */}
      <div style={{ marginTop: 14, fontSize: 12.5, fontWeight: 700, color: '#334155' }}>Category</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
        {['Home', 'Pets', 'Chores', 'Other'].map((c, i) => (
          <div key={c} style={{
            padding: '7px 14px', borderRadius: 999,
            fontSize: 12, fontWeight: 700,
            background: i === 0 ? '#2D7FF9' : '#fff',
            color: i === 0 ? '#fff' : '#334155',
            border: i === 0 ? '1px solid #2D7FF9' : '1px solid #E5E7EB',
          }}>{c}</div>
        ))}
      </div>
    </div>
  </Phone>
);

// ──────────────────────── Screen 4 — Kid Login ────────────────────────
window.Screen4KidLogin = () => (
  <Phone bg="linear-gradient(180deg, #EAF4FF 0%, #F8FBFF 50%, #FFFFFF 100%)">
    <div style={{ padding: '20px 28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative' }}>
      <div style={{ marginTop: 4, width: '100%', height: 180, display: 'grid', placeItems: 'center' }}>
        <img src="assets/cow-mascot.png" alt="MilkMoney cow mascot"
          style={{ width: '85%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}/>
      </div>
      <div style={{ marginTop: 12 }}><Wordmark size={28}/></div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '14px 0 6px', letterSpacing: '-0.01em' }}>
        Earn, save, achieve!
      </h2>
      <p style={{ fontSize: 13.5, color: '#64748B', textAlign: 'center', margin: 0, lineHeight: 1.5, maxWidth: 240 }}>
        Every chore you do brings you closer to your goals.
      </p>
      <div style={{ width: '100%', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        <button style={{
          width: '100%', padding: '15px', borderRadius: 14, border: 'none',
          background: '#2D7FF9', color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          boxShadow: '0 4px 14px rgba(45,127,249,0.35)',
        }}>Log In as Kid</button>
        <button style={{
          width: '100%', padding: '15px', borderRadius: 14,
          background: '#fff', color: '#2D7FF9', fontWeight: 700, fontSize: 15, fontFamily: 'inherit',
          border: '1.5px solid #DBEAFE',
        }}>I'm New Here</button>
        <button style={{
          background: 'transparent', border: 'none', color: '#2D7FF9',
          fontWeight: 600, fontSize: 14, fontFamily: 'inherit', marginTop: 6, cursor: 'pointer',
        }}>Switch to Parent Login</button>
      </div>
      <img src="assets/landscape.png" alt=""
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', display: 'block', pointerEvents: 'none' }}/>
    </div>
  </Phone>
);

// ──────────────────────── Screen 5 — Kid Tasks ────────────────────────
window.Screen5KidTasks = () => (
  <Phone bg="#fff">
    <div style={{ padding: '12px 20px 0', height: '100%', overflow: 'auto', paddingBottom: 90 }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="A" tone="rose" size={40}/>
          <div style={{ fontSize: 19, fontWeight: 800 }}>Hi Abby! <span style={{ fontSize: 18 }}>👋</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FFF8E1', border: '1px solid #FDE68A', padding: '6px 12px', borderRadius: 999 }}>
          <div style={{ width: 18, height: 18, borderRadius: 999, background: 'radial-gradient(circle at 30% 30%, #FCD34D, #D97706)', boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.08)' }}/>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>$18.75</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: 16, background: '#F4F6F8', borderRadius: 12, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div style={{
          background: '#2D7FF9', color: '#fff', borderRadius: 9, padding: '10px 0',
          fontSize: 13, fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          boxShadow: '0 2px 6px rgba(45,127,249,0.3)',
        }}>
          <span>★</span> My Tasks
        </div>
        <div style={{ color: '#64748B', fontSize: 13, fontWeight: 700, textAlign: 'center', padding: '10px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          ⊕ Up for Grabs
        </div>
      </div>

      {/* My Tasks */}
      <div style={{ marginTop: 18, fontSize: 14, fontWeight: 700 }}>My Tasks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
        {[
          { t: 'Feed the dog', d: 'Due May 20', amt: '$4.00', badge: 'Due Soon', tone: 'due', pet: 'dog' },
          { t: 'Unload dishwasher', d: 'Due May 21', amt: '$3.00', badge: 'To Do', tone: 'todo', pet: 'dish' },
          { t: 'Clean room', d: 'Due May 18', amt: '$5.00', badge: 'Overdue', tone: 'over', pet: 'bed' },
        ].map(x => (
          <div key={x.t} style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <PetThumb label={x.pet}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{x.t}</div>
              <div style={{ fontSize: 11.5, color: '#94A3B8' }}>{x.d}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{x.amt}</div>
              <div style={{
                marginTop: 4, display: 'inline-block', padding: '3px 8px', borderRadius: 999,
                fontSize: 10, fontWeight: 700,
                background: x.tone === 'over' ? '#FEE2E2' : x.tone === 'todo' ? '#EFF6FF' : '#FEF3C7',
                color: x.tone === 'over' ? '#DC2626' : x.tone === 'todo' ? '#1E6BE0' : '#D97706',
              }}>{x.badge}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Up for Grabs */}
      <div style={{ marginTop: 18, fontSize: 14, fontWeight: 700 }}>Up for Grabs</div>
      <div style={{ marginTop: 10, border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <PetThumb label="trash"/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Take out trash</div>
          <div style={{ fontSize: 11.5, color: '#94A3B8' }}>Due May 19</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>$3.00</div>
          <div style={{ marginTop: 4, display: 'inline-block', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, background: '#DCFCE7', color: '#15803D' }}>Available</div>
        </div>
      </div>
    </div>
    <TabBar active="Home"/>
  </Phone>
);

// ──────────────────────── Screen 6 — Kid Wallet + Calendar ────────────────────────
window.Screen6KidWallet = () => {
  const days = Array.from({ length: 35 }, (_, i) => i - 3); // shift so May starts on a Thu (display only)
  const monthRange = (d) => d >= 1 && d <= 31;
  return (
    <Phone bg="#fff">
      {/* Wallet header w/ gradient + jar */}
      <div style={{
        background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
        padding: '18px 22px 26px',
        borderRadius: '0 0 0 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* sparkles */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 90% 30%, rgba(255,255,255,0.25), transparent 25%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.18), transparent 25%)', pointerEvents: 'none' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ color: '#fff' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, opacity: 0.9 }}>My Wallet</div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 4 }}>$18.75</div>
            <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 4 }}>Available Balance ✨</div>
          </div>
          {/* Money jar illustration */}
          <img src="assets/money-jar.png" alt="Savings jar"
            style={{ width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))' }}/>
        </div>
      </div>

      <div style={{ padding: '14px 20px 90px', overflow: 'auto', height: 'calc(100% - 130px)' }}>
        {/* Month head */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>May 2025</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#F4F6F8', display: 'grid', placeItems: 'center', color: '#64748B', fontSize: 11 }}>‹</div>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#F4F6F8', display: 'grid', placeItems: 'center', color: '#64748B', fontSize: 11 }}>›</div>
          </div>
        </div>
        {/* DOW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginTop: 8, fontSize: 9.5, color: '#94A3B8', fontWeight: 700, textAlign: 'center' }}>
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => <div key={d}>{d}</div>)}
        </div>
        {/* Days */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginTop: 4, gap: 2, fontSize: 11, textAlign: 'center', fontWeight: 600 }}>
          {days.map((d, i) => {
            const inMonth = monthRange(d);
            const isToday = d === 16;
            const earned = [12, 14].includes(d);
            return (
              <div key={i} style={{
                aspectRatio: '1', display: 'grid', placeItems: 'center',
                color: !inMonth ? '#CBD5E1' : isToday ? '#fff' : '#0F172A',
                background: isToday ? '#2D7FF9' : earned ? '#DCFCE7' : 'transparent',
                borderRadius: 999,
                position: 'relative',
              }}>
                <span>{inMonth ? d : d <= 0 ? 30 + d : d - 31}</span>
                {earned && !isToday && <div style={{ position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: 999, background: '#16A34A' }}/>}
              </div>
            );
          })}
        </div>

        {/* Recent Earnings */}
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Recent Earnings</div>
          <div style={{ fontSize: 12, color: '#2D7FF9', fontWeight: 700 }}>View all</div>
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { t: 'Feed the dog', d: 'May 16', amt: '+$4.00', pet: 'dog' },
            { t: 'Unload dishwasher', d: 'May 14', amt: '+$3.00', pet: 'dish' },
          ].map(x => (
            <div key={x.t} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
              <PetThumb label={x.pet} size={34}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{x.t}</div>
                <div style={{ fontSize: 10.5, color: '#94A3B8' }}>{x.d}</div>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: '#16A34A' }}>{x.amt}</div>
            </div>
          ))}
        </div>

        {/* Savings Goal */}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Savings Goal</div>
          <div style={{ fontSize: 12, color: '#2D7FF9', fontWeight: 700 }}>New Goal</div>
        </div>
        <div style={{ marginTop: 8, border: '1px solid #E5E7EB', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <PetThumb label="bike"/>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800 }}>New Bike</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>$60.00</div>
            </div>
            <div style={{ marginTop: 6, height: 6, background: '#F1F3F5', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '37%', height: '100%', background: 'linear-gradient(90deg, #34D399, #2D7FF9)', borderRadius: 999 }}/>
            </div>
            <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#94A3B8' }}>
              <span>$22.00 saved</span><span>37%</span>
            </div>
          </div>
        </div>
      </div>
      <TabBar active="Wallet"/>
    </Phone>
  );
};
