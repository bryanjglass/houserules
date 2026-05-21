export default function BalanceDisplay({ balance }) {
  return (
    <div className="bg-gradient-to-br from-green-400 to-emerald-500 text-white rounded-2xl p-5 shadow-md">
      <p className="text-sm font-medium opacity-80 uppercase tracking-wide">Balance</p>
      <p className="text-4xl font-bold mt-1">${balance.toFixed(2)}</p>
    </div>
  );
}
