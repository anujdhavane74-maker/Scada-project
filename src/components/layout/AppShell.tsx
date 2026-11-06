/**
 * BMS Operator Workstation Main Application Shell
 */

import React, { useState } from 'react';
import { useBms } from '../../context/BmsContext';
import { TopStatusBar } from './TopStatusBar';
import { Sidebar } from './Sidebar';
import { OverviewView } from '../views/OverviewView';
import { DevicesView } from '../views/DevicesView';
import { HvacPlantView } from '../views/HvacPlantView';
import { FloorPlanView } from '../views/FloorPlanView';
import { AlarmsView } from '../views/AlarmsView';
import { TrendsView } from '../views/TrendsView';
import { EnergyView } from '../views/EnergyView';
import { CommissioningView } from '../views/CommissioningView';
import { CommandDialog } from '../common/CommandDialog';
import { EngineeringInfoModal } from '../views/EngineeringInfoModal';

export const AppShell: React.FC = () => {
  const { activeRoute } = useBms();
  const [isEngInfoOpen, setIsEngInfoOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeRoute) {
      case 'OVERVIEW':
        return <OverviewView />;
      case 'HVAC_PLANT':
        return <HvacPlantView />;
      case 'FLOOR_PLAN':
        return <FloorPlanView />;
      case 'ALARMS':
        return <AlarmsView />;
      case 'TRENDS':
        return <TrendsView />;
      case 'ENERGY':
        return <EnergyView />;
      case 'DEVICES':
        return <DevicesView />;
      case 'COMMISSIONING':
        return <CommissioningView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      {/* Top Engineering Status Bar */}
      <TopStatusBar onOpenEngineeringInfo={() => setIsEngInfoOpen(true)} />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 bg-slate-100">
          <div className="max-w-[1600px] mx-auto pb-10">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {/* Dialogs and Overlays */}
      <CommandDialog />
      <EngineeringInfoModal
        isOpen={isEngInfoOpen}
        onClose={() => setIsEngInfoOpen(false)}
      />
    </div>
  );
};
