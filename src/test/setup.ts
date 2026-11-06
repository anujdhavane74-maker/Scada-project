import '@testing-library/jest-dom';

// Standard jsdom ResizeObserver mock for Recharts ResponsiveContainer
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
