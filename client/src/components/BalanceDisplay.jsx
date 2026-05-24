import moneyJar from '../assets/money-jar.png';
import { formatCents } from '../lib/money.js';

// Teal-gradient wallet header — the only place the teal gradient appears (it signals
// "the child's money"). Sparkle highlights + the savings-jar illustration on the right.
export default function BalanceDisplay({ balance, label = 'My Wallet', rounded = true }) {
  return (
    <div
      className={`relative overflow-hidden text-white p-5 ${rounded ? 'rounded-2xl shadow-md' : ''}`}
      style={{ background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 90% 30%, rgba(255,255,255,0.25), transparent 25%), radial-gradient(circle at 20% 80%, rgba(255,255,255,0.18), transparent 25%)',
        }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-[12.5px] font-semibold opacity-90">{label}</p>
          <p className="text-[36px] font-extrabold leading-tight mt-1" style={{ letterSpacing: '-0.02em' }}>
            {formatCents(balance)}
          </p>
          <p className="text-[11.5px] opacity-90 mt-1">Available Balance ✨</p>
        </div>
        <img
          src={moneyJar}
          alt="Savings jar"
          className="w-[90px] h-[90px] object-contain"
          style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.12))' }}
        />
      </div>
    </div>
  );
}
