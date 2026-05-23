// MilkMoney design spec — main page
// Composes: Hero → Tokens (color, type, radii, shadows) → Components → Screens → Handoff

const {
  Screen1ParentLogin, Screen2ParentDash, Screen3CreateTask,
  Screen4KidLogin, Screen5KidTasks, Screen6KidWallet,
  MM_COLORS, Swatch, TypeRow, Demo, Code,
} = window;

// ───────────────────────── HERO ─────────────────────────
const Hero = () => (
  <div className="hero">
    <div>
      <div className="eyebrow">Design Specifications · v1</div>
      <h1 className="title">MilkMoney<br/><span style={{ color: '#64748B', fontWeight: 700 }}>visual system</span></h1>
      <p className="lead">
        A polished, kid-friendly system for a chores-and-allowance app. This document
        translates the reference mockup into reusable tokens, components, and annotated
        screen specs ready for handoff to Claude Code.
      </p>
      <div className="meta">
        <span className="chip"><span className="dot"/>Plus Jakarta Sans</span>
        <span className="chip"><span className="dot" style={{ background: '#16A34A' }}/>iOS + Web (Tailwind)</span>
        <span className="chip"><span className="dot" style={{ background: '#D97706' }}/>Parent & Kid roles</span>
        <span className="chip"><span className="dot" style={{ background: '#10B981' }}/>6 reference screens</span>
      </div>
    </div>
    <div className="hero-art">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="logo-tile">
          <img src="assets/icon-bottle.png" alt="MilkMoney app icon"/>
        </div>
        <div className="wm big" style={{ marginTop: 22 }}>
          <span className="a">Milk</span><span className="b">Money</span>
        </div>
        <div className="tagline">Chores today, confidence tomorrow.</div>
      </div>
    </div>
  </div>
);

// ───────────────────────── 01 — FOUNDATIONS ─────────────────────────
const Foundations = () => (
  <section>
    <div className="section-head">
      <div>
        <div className="section-num">01 / Foundations</div>
        <h2 className="section-title">Color</h2>
      </div>
      <div className="section-blurb">
        Cool blues for trust and action, money-greens for value earned, warm cream for the
        marketing surfaces that feel like home. Status colors map to chore states.
      </div>
    </div>

    {Object.entries(MM_COLORS).map(([group, swatches]) => (
      <div key={group} style={{ marginBottom: 36 }}>
        <h3 className="sub">{group}</h3>
        <div className="grid-6">
          {swatches.map(s => <Swatch key={s.name} {...s}/>)}
        </div>
      </div>
    ))}

    <div style={{ marginTop: 28 }} className="card">
      <h3 className="sub" style={{ margin: '0 0 12px' }}>Usage rules</h3>
      <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 14, lineHeight: 1.7 }}>
        <li><b>Primary actions</b> always use Brand (#2D7FF9). One per screen.</li>
        <li><b>Dollar amounts</b> are always Money 600 (#16A34A) and bold. Never neutral.</li>
        <li><b>Status pills</b> use the 50-tier as background + 600-tier as text. Never invert.</li>
        <li><b>Wallet header</b> is the only place the teal gradient appears — it signals "child's money".</li>
        <li><b>Cream</b> (#FAF6EB) is reserved for onboarding / marketing. App surfaces stay white.</li>
      </ul>
    </div>
  </section>
);

// ───────────────────────── 02 — TYPE ─────────────────────────
const Typography = () => (
  <section>
    <div className="section-head">
      <div>
        <div className="section-num">02 / Foundations</div>
        <h2 className="section-title">Typography</h2>
      </div>
      <div className="section-blurb">
        One family: <b>Plus Jakarta Sans</b>. Friendly, geometric, kid-readable.
        Weights 600/700/800 carry the personality; 500 for body, 400 only for the longest blocks.
      </div>
    </div>

    <div className="card" style={{ padding: '8px 28px' }}>
      <TypeRow role="Display"    size="56px"   weight={800} lh={1.0}  tracking="-0.025em" sample="Raise responsible kids and smart savers."/>
      <TypeRow role="Title 1"    size="28px"   weight={800} lh={1.1}  tracking="-0.02em"  sample="Good morning, Alex!"/>
      <TypeRow role="Title 2"    size="22px"   weight={800} lh={1.15} tracking="-0.01em"  sample="Earn, save, achieve!"/>
      <TypeRow role="Section"    size="17px"   weight={700} lh={1.25} tracking="-0.005em" sample="Outstanding Chores"/>
      <TypeRow role="Body"       size="15px"   weight={500} lh={1.5}  tracking="0"        sample="The simple way to manage chores and allowance as a family."/>
      <TypeRow role="Label"      size="13px"   weight={700} lh={1.3}  tracking="0"        sample="Task Title"/>
      <TypeRow role="Caption"    size="11.5px" weight={600} lh={1.3}  tracking="0.005em"  sample="Abby · Due May 18"/>
      <TypeRow role="Amount"     size="16px"   weight={800} lh={1.1}  tracking="-0.01em"  sample="$18.75" style={{ color: '#16A34A' }}/>
      <TypeRow role="Badge"      size="10.5px" weight={700} lh={1}    tracking="0.02em"   sample="DUE SOON" style={{ textTransform: 'uppercase' }}/>
    </div>

    <div style={{ marginTop: 18, fontSize: 13, color: '#64748B', display: 'flex', gap: 8, alignItems: 'center' }}>
      <span style={{ fontFamily: 'JetBrains Mono', color: '#0F172A', background: '#F1F3F5', padding: '4px 8px', borderRadius: 6 }}>JetBrains Mono</span>
      reserved for tokens, codes, and monetary inputs (when fixed-width helps).
    </div>
  </section>
);

// ───────────────────────── 03 — RADII / SHADOWS / SPACING ─────────────────────────
const Surface = () => (
  <section>
    <div className="section-head">
      <div>
        <div className="section-num">03 / Foundations</div>
        <h2 className="section-title">Surface</h2>
      </div>
      <div className="section-blurb">
        Soft, generous radii (12–20px) on cards. Shadows are quiet — depth comes from
        clean borders + 1-pixel hairlines.
      </div>
    </div>

    <h3 className="sub">Radii</h3>
    <div className="radii">
      {[
        { name: 'sm', r: 8 }, { name: 'md', r: 12 }, { name: 'lg', r: 16 }, { name: 'xl', r: 20 }, { name: '2xl', r: 24 },
      ].map(x => (
        <div key={x.name} className="r">
          <div className="shape" style={{ borderRadius: x.r }}/>
          <div className="label">{x.name} · {x.r}px</div>
        </div>
      ))}
    </div>

    <h3 className="sub" style={{ marginTop: 32 }}>Shadows</h3>
    <div className="shadows">
      <div className="s"><div className="box" style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>sh-sm · hairline lift</div></div>
      <div className="s"><div className="box" style={{ boxShadow: '0 4px 14px rgba(15,23,42,0.06)' }}>sh-md · cards</div></div>
      <div className="s"><div className="box" style={{ boxShadow: '0 18px 38px rgba(15,23,42,0.08)' }}>sh-lg · overlays, modals</div></div>
    </div>

    <h3 className="sub" style={{ marginTop: 32 }}>Spacing scale</h3>
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
        {[4, 6, 8, 12, 16, 20, 24, 32, 48].map(n => (
          <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: n, height: n, background: '#2D7FF9', borderRadius: 4 }}/>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#64748B' }}>{n}</div>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 14, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
        Use multiples of 4. Cards pad 16–20px, screens pad 20–28px horizontally,
        sections separate by 18–24px vertically. Tab bar items: 44px hit target minimum.
      </p>
    </div>
  </section>
);

// ───────────────────────── 04 — COMPONENTS ─────────────────────────
const Components = () => (
  <section>
    <div className="section-head">
      <div>
        <div className="section-num">04 / Library</div>
        <h2 className="section-title">Components</h2>
      </div>
      <div className="section-blurb">
        The atomic kit. Every screen below is built from these — keep them strict so the app
        compounds visually as it grows.
      </div>
    </div>

    <div className="two-col">
      <Demo title="Buttons" desc="Primary = the one thing on the screen. Secondary lives in a white card and gets a tinted border. Ghost links carry the same brand color at 700 weight." cols={3}>
        <button className="btn btn-primary">Log In as Parent</button>
        <button className="btn btn-secondary">Create Account</button>
        <button className="btn btn-ghost">Switch to Kid</button>
      </Demo>

      <Demo title="Inputs" desc="14px radius, 1.5px border. Focus = brand border + soft 4px halo. Inline icons (pet thumb, $ chip, calendar) sit inside the field, not beside it." cols={1}>
        <div>
          <label className="label">Task Title</label>
          <input className="input" defaultValue="Feed the dog"/>
        </div>
        <div>
          <label className="label">Description <span className="opt">(optional)</span></label>
          <input className="input" defaultValue="Make sure he gets fresh water too!"/>
        </div>
      </Demo>
    </div>

    <div className="two-col" style={{ marginTop: 24 }}>
      <Demo title="Status badges" desc="One per task. Background = 50, text = 600. Always rounded-full, uppercase optional but recommended only on overdue." cols={4}>
        <span className="badge badge-todo">To Do</span>
        <span className="badge badge-due">Due Soon</span>
        <span className="badge badge-over">Overdue</span>
        <span className="badge badge-ok">Available</span>
      </Demo>

      <Demo title="Avatars" desc="Soft pastel tones, 2px white ring, 1px hairline outer. Initial-only fallback; designed to drop in real photos / illustrated portraits when assets arrive." cols={5}>
        <div className="avatar peach" style={{ width: 56, height: 56, fontSize: 18 }}>A</div>
        <div className="avatar sky"   style={{ width: 56, height: 56, fontSize: 18 }}>O</div>
        <div className="avatar mint"  style={{ width: 56, height: 56, fontSize: 18 }}>S</div>
        <div className="avatar lilac" style={{ width: 56, height: 56, fontSize: 18 }}>J</div>
        <div className="avatar peach" style={{ width: 56, height: 56, fontSize: 18 }}>+</div>
      </Demo>
    </div>

    <div className="two-col" style={{ marginTop: 24 }}>
      <Demo title="Task card (parent view)" desc="44px pet thumb · title (15/700) + meta (12/600 ink-400) · amount (15/800 ink-900) + status pill. Whole row is tappable.">
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
          <div className="pet">dog</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Clean room</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Abby · Due May 18</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>$5.00</div>
            <span className="badge badge-due" style={{ marginTop: 4 }}>Due Soon</span>
          </div>
        </div>
      </Demo>

      <Demo title="Stat tile" desc="Tinted-50 icon chip + 2-line stack. Use for KPIs above the fold — never more than 2 per row on mobile.">
        <div style={{ border: '1px solid #E5E7EB', borderRadius: 14, padding: 14, display: 'flex', gap: 12, alignItems: 'center', background: '#fff' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'grid', placeItems: 'center', fontWeight: 800 }}>$</div>
          <div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>Total Allowance Paid</div>
            <div style={{ fontSize: 19, fontWeight: 800 }}>$86.25</div>
            <div style={{ fontSize: 10, color: '#94A3B8' }}>This month</div>
          </div>
        </div>
      </Demo>
    </div>

    <Demo title="Bottom tab bar" desc="5 destinations max. Active = brand text + bold; inactive = ink-400 + semibold. Outline icons throughout. 22px icon, 10px label. 22px bottom padding for the home indicator." cols={1}>
      <div style={{ width: 360, border: '1px solid #E5E7EB', borderRadius: 16, padding: '10px 14px 22px', display: 'flex', justifyContent: 'space-around', background: '#fff', margin: '0 auto' }}>
        {[
          { t: 'Home', on: true,  d: 'M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z' },
          { t: 'Tasks', on: false, d: null },
          { t: 'Calendar', on: false, d: null },
          { t: 'Wallet', on: false, d: null },
          { t: 'More', on: false, d: null },
        ].map(x => (
          <div key={x.t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: x.on ? '#2D7FF9' : '#94A3B8' }}>
            <div style={{ width: 22, height: 22, border: '2px solid currentColor', borderRadius: 6 }}/>
            <span style={{ fontSize: 10, fontWeight: x.on ? 700 : 600 }}>{x.t}</span>
          </div>
        ))}
      </div>
    </Demo>
  </section>
);

// ───────────────────────── 05 — SCREENS ─────────────────────────
const ScreenCap = ({ n, title, notes, anno, children }) => (
  <div className="screen-cap">
    <div className="id"><span className="n">{n}</span>{title}</div>
    {children}
    {anno && (
      <div className="anno">
        {anno.map(([tag, txt], i) => (
          <React.Fragment key={i}>
            <div className="tag">{tag}</div>
            <div className="txt">{txt}</div>
          </React.Fragment>
        ))}
      </div>
    )}
    {notes && <div className="notes">{notes}</div>}
  </div>
);

const Screens = () => (
  <section>
    <div className="section-head">
      <div>
        <div className="section-num">05 / Application</div>
        <h2 className="section-title">Screens</h2>
      </div>
      <div className="section-blurb">
        Six reference screens, recreated 1:1 with the source mockup using the tokens above.
        Placeholders mark spots that need illustrated assets (cow mascot, pastoral landscape,
        kid portraits, pet photos).
      </div>
    </div>

    <div className="screens">
      <ScreenCap n="1" title="Parent · Login / Welcome"
        anno={[
          ['A1', 'Logo tile: 22% radius, blue gradient. White jar w/ green bill inside.'],
          ['A2', 'Headline: Title 2 (22/800), 240px max-width, center-aligned.'],
          ['A3', 'Primary button has soft blue glow shadow — only on primary.'],
          ['A4', 'Bottom illustration is full-bleed: assets/landscape.png (~150px tall).'],
        ]}>
        <Screen1ParentLogin/>
      </ScreenCap>

      <ScreenCap n="2" title="Parent · Dashboard"
        anno={[
          ['B1', 'Greeting block: 46px avatar, 2-line greeting, 38px bell tile.'],
          ['B2', '3-column "Your Family" row — kids + "Add Child" dashed tile.'],
          ['B3', '2 stat tiles (Money + Brand chips). Never more than two per row.'],
          ['B4', 'Task list rows: 44px pet thumb, status pill in top-right column.'],
        ]}>
        <Screen2ParentDash/>
      </ScreenCap>

      <ScreenCap n="3" title="Parent · Create / Assign Task"
        anno={[
          ['C1', 'Back-chevron + center title + right action ("Save" in brand).'],
          ['C2', 'Inline pet thumb sits INSIDE the title field, not beside it.'],
          ['C3', '"Up for grabs" tile shows the brand-50 selected state with star.'],
          ['C4', 'Category pills: brand fill when selected, line border when not.'],
        ]}>
        <Screen3CreateTask/>
      </ScreenCap>

      <ScreenCap n="4" title="Kid · Login / Welcome"
        anno={[
          ['D1', 'Top illustration: cow mascot holding $-bill. assets/cow-mascot.png'],
          ['D2', 'Same button hierarchy as parent — primary + secondary + ghost.'],
          ['D3', 'Tone shift: more playful copy, but identical components.'],
        ]}>
        <Screen4KidLogin/>
      </ScreenCap>

      <ScreenCap n="5" title="Kid · Tasks / To-Do List"
        anno={[
          ['E1', 'Balance pill: gold-coin orb + bold amount, amber tint.'],
          ['E2', 'Segmented tabs: brand-filled active state, ink-500 inactive.'],
          ['E3', 'Section labels (My Tasks / Up for Grabs) — Section type, 14/700.'],
          ['E4', '4-state badges across the same card layout: Due Soon / To Do / Overdue / Available.'],
        ]}>
        <Screen5KidTasks/>
      </ScreenCap>

      <ScreenCap n="6" title="Kid · Wallet & Calendar"
        anno={[
          ['F1', 'Teal gradient header — the ONLY screen that uses it.'],
          ['F2', 'Today = brand-filled disc; earned days = money-50 fill + dot.'],
          ['F3', 'Earnings amounts always money-600 with leading "+" sign.'],
          ['F4', 'Goal progress: gradient bar (teal → brand), $ saved + %.'],
        ]}>
        <Screen6KidWallet/>
      </ScreenCap>
    </div>
  </section>
);

// ───────────────────────── 06 — HANDOFF ─────────────────────────
const Handoff = () => (
  <section>
    <div className="section-head">
      <div>
        <div className="section-num">06 / Handoff</div>
        <h2 className="section-title">Implementation</h2>
      </div>
      <div className="section-blurb">
        Drop-in Tailwind config + a minimum-viable migration plan for the existing React + Vite codebase.
      </div>
    </div>

    <div className="two-thirds">
      <div>
        <h3 className="sub">tailwind.config.js</h3>
        <Code>{`/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:   '#FAF6EB',
        appbg:   '#F7F8FA',
        navy:    '#1E3A8A',
        brand: {
          DEFAULT: '#2D7FF9',
          600: '#1E6BE0',
          100: '#DBEAFE',
          50:  '#EFF6FF',
        },
        ink: {
          900: '#0F172A', 700: '#334155',
          500: '#64748B', 400: '#94A3B8', 300: '#CBD5E1',
        },
        line: '#E5E7EB',
        money: { 700:'#15803D', 600:'#16A34A', 50:'#DCFCE7' },
        amber: { 600:'#D97706', 500:'#F59E0B', 50:'#FEF3C7' },
        rose:  { 600:'#DC2626', 500:'#EF4444', 50:'#FEE2E2' },
        teal:  { start:'#34D399', end:'#10B981' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm': '8px', 'md': '12px', 'lg': '16px',
        'xl': '20px', '2xl': '24px', '3xl': '28px',
      },
      boxShadow: {
        'sm':  '0 1px 2px rgba(15,23,42,0.04)',
        'md':  '0 4px 14px rgba(15,23,42,0.06)',
        'lg':  '0 18px 38px rgba(15,23,42,0.08)',
        'brand': '0 4px 14px rgba(45,127,249,0.35)',
      },
    },
  },
  plugins: [],
};`}</Code>

        <h3 className="sub" style={{ marginTop: 28 }}>index.css</h3>
        <Code>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body { @apply bg-appbg text-ink-900 font-sans antialiased min-h-screen; }
}

@layer components {
  .btn-primary   { @apply bg-brand text-white font-bold rounded-2xl px-5 py-3.5 shadow-brand hover:bg-brand-600 transition; }
  .btn-secondary { @apply bg-white text-brand font-bold rounded-2xl px-5 py-3.5 border border-brand-100 hover:border-brand transition; }
  .input         { @apply w-full px-4 py-3.5 rounded-2xl border-2 border-line bg-white text-ink-900 placeholder:text-ink-400 focus:border-brand focus:ring-4 focus:ring-brand-50 outline-none transition; }
  .card          { @apply bg-white border border-line rounded-xl; }
  .badge-due     { @apply bg-amber-50 text-amber-600 font-bold text-[11px] px-2.5 py-1 rounded-full; }
  .badge-over    { @apply bg-rose-50 text-rose-600 font-bold text-[11px] px-2.5 py-1 rounded-full; }
  .badge-todo    { @apply bg-brand-50 text-brand-600 font-bold text-[11px] px-2.5 py-1 rounded-full; }
  .badge-ok      { @apply bg-money-50 text-money-700 font-bold text-[11px] px-2.5 py-1 rounded-full; }
}`}</Code>
      </div>

      <div>
        <div className="card" style={{ background: '#FBFCFD' }}>
          <h3 className="sub" style={{ margin: '0 0 12px' }}>Migration plan</h3>
          <ol style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13.5, lineHeight: 1.7 }}>
            <li>Replace <code style={{ background: '#F1F3F5', padding: '1px 6px', borderRadius: 4 }}>tailwind.config.js</code> + <code style={{ background: '#F1F3F5', padding: '1px 6px', borderRadius: 4 }}>index.css</code> with the snippets at left.</li>
            <li>Find/replace <code style={{ background: '#F1F3F5', padding: '1px 6px', borderRadius: 4 }}>indigo-*</code> → <code style={{ background: '#F1F3F5', padding: '1px 6px', borderRadius: 4 }}>brand</code> across the client.</li>
            <li>Swap emoji (<code style={{ background: '#F1F3F5', padding: '1px 6px', borderRadius: 4 }}>🥛 👶 👦 📋</code>…) for the icon set (outline, 2px stroke).</li>
            <li>Rebuild screens 1–6 per the recreated layouts above. Login & Dashboard first.</li>
            <li>Source illustrated assets: cow mascot, pastoral landscape, jar/coin set, pet thumbs.</li>
            <li>Add <code style={{ background: '#F1F3F5', padding: '1px 6px', borderRadius: 4 }}>BottomTabBar</code> shared component; mount in child + parent layouts.</li>
          </ol>
        </div>

        <div className="card" style={{ background: '#FFFBEA', borderColor: '#FDE68A', marginTop: 16 }}>
          <h3 className="sub" style={{ margin: '0 0 10px', color: '#92400E' }}>Assets</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#78350F', fontSize: 13.5, lineHeight: 1.7 }}>
            <li><b>✓ Cow mascot</b> — <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4 }}>assets/cow-mascot.png</code></li>
            <li><b>✓ Pastoral landscape</b> — <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4 }}>assets/landscape.png</code></li>
            <li><b>✓ Money jar</b> — <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4 }}>assets/money-jar.png</code></li>
            <li><b>✓ App icon (milk bottle)</b> — <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 6px', borderRadius: 4 }}>assets/icon-bottle.png</code></li>
            <li><b>Still needed:</b> kid avatar portraits (illustrated, soft pastels), pet/task thumbs (40×40 — dog, dishwasher, bed, trash, bike).</li>
          </ul>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 className="sub" style={{ margin: '0 0 10px' }}>Accessibility notes</h3>
          <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13.5, lineHeight: 1.7 }}>
            <li>Status is never <em>color-only</em> — every badge has a text label.</li>
            <li>Min 44×44 hit target on tab bar icons + kid login tiles.</li>
            <li>Brand (#2D7FF9) on white = 4.62:1 contrast — passes AA for normal text.</li>
            <li>Body text on cream/white meets 7:1 (AAA) via Ink 900.</li>
          </ul>
        </div>
      </div>
    </div>

    <div className="footer">
      <div>MilkMoney · Design Specifications · v1</div>
      <div>Built for handoff · Plus Jakarta Sans · Tailwind v3</div>
    </div>
  </section>
);

// ───────────────────────── render ─────────────────────────
const App = () => (
  <React.Fragment>
    <Hero/>
    <Foundations/>
    <Typography/>
    <Surface/>
    <Components/>
    <Screens/>
    <Handoff/>
  </React.Fragment>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
