/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
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
        money: { 700: '#15803D', 600: '#16A34A', 50: '#DCFCE7' },
        amber: { 600: '#D97706', 500: '#F59E0B', 50: '#FEF3C7' },
        rose:  { 600: '#DC2626', 500: '#EF4444', 50: '#FEE2E2' },
        violet: { 600: '#7C3AED', 500: '#8B5CF6', 50: '#EDE9FE' },
        teal:  { start: '#34D399', end: '#10B981' },
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
};
