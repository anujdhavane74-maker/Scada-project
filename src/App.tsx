/**
 * Root Application Component
 */

import React from 'react';
import { BmsProvider } from './context/BmsContext';
import { AppShell } from './components/layout/AppShell';

export const App: React.FC = () => {
  return (
    <BmsProvider>
      <AppShell />
    </BmsProvider>
  );
};

export default App;
