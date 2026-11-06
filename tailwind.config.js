/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        industrial: {
          surface: '#FFFFFF',
          bg: '#F8FAFC',
          subtle: '#F1F5F9',
          border: '#CBD5E1',
          borderLight: '#E2E8F0',
          navy: {
            900: '#0B132B',
            800: '#0F172A',
            700: '#1E293B',
            600: '#334155',
            500: '#475569',
            400: '#64748B',
          },
          blue: {
            DEFAULT: '#0284C7',
            hover: '#0369A1',
            light: '#E0F2FE',
            accent: '#2563EB',
          },
          status: {
            running: '#16A34A',
            runningBg: '#DCFCE7',
            stopped: '#64748B',
            stoppedBg: '#F1F5F9',
            warning: '#D97706',
            warningBg: '#FEF3C7',
            alarm: '#DC2626',
            alarmBg: '#FEE2E2',
            offline: '#94A3B8',
            offlineBg: '#F8FAFC',
          },
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', 'monospace'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'industrial-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'industrial': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
