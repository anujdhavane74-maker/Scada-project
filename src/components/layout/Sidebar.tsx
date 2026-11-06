/**
 * Industrial BMS Operator Sidebar Navigation
 */

import React from 'react';
import { useBms, NavRoute } from '../../context/BmsContext';
import {
  LayoutDashboard,
  Factory,
  Building2,
  Bell,
  LineChart,
  Zap,
  Cpu,
  Wrench,
  Radio,
} from 'lucide-react';

interface NavItem {
  id: NavRoute;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeAlert?: boolean;
}

export const Sidebar: React.FC = () => {
  const { activeRoute, setActiveRoute, alarmSummary, systemSummary } = useBms();

  const navItems: NavItem[] = [
    {
      id: 'OVERVIEW',
      label: 'Overview',
      sublabel: 'Station Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'HVAC_PLANT',
      label: 'HVAC Plant',
      sublabel: 'Chillers & Towers',
      icon: Factory,
      badge: `${systemSummary.running} Active`,
    },
    {
      id: 'FLOOR_PLAN',
      label: 'Floor Plan',
      sublabel: 'Zone Distribution',
      icon: Building2,
      badge: '5 Levels',
    },
    {
      id: 'ALARMS',
      label: 'Alarms',
      sublabel: 'Event Console',
      icon: Bell,
      badge: alarmSummary.total,
      badgeAlert: alarmSummary.critical > 0,
    },
    {
      id: 'TRENDS',
      label: 'Trends',
      sublabel: 'Historical Curves',
      icon: LineChart,
    },
    {
      id: 'ENERGY',
      label: 'Energy',
      sublabel: 'Submetering & kW',
      icon: Zap,
    },
    {
      id: 'DEVICES',
      label: 'Devices',
      sublabel: 'Point Inventory',
      icon: Cpu,
      badge: systemSummary.total,
    },
    {
      id: 'COMMISSIONING',
      label: 'Commissioning',
      sublabel: 'Protocol Adapters',
      icon: Wrench,
      badge: 'Staged',
    },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-300 flex flex-col justify-between select-none shrink-0 shadow-industrial-sm">
      {/* Navigation Group */}
      <div className="py-2">
        <div className="px-3 pb-2 mb-1 border-b border-slate-200">
          <span className="font-mono text-2xs text-slate-400 uppercase tracking-wider font-semibold">
            BMS WORKSTATION
          </span>
        </div>

        <nav className="space-y-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;

            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id.toLowerCase()}`}
                onClick={() => setActiveRoute(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-left transition-all ${
                  isActive
                    ? 'bg-sky-50 text-sky-950 font-semibold border-l-3 border-sky-600 shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-sky-700' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs leading-none">{item.label}</div>
                    <div className="text-2xs text-slate-400 font-normal leading-tight mt-0.5">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`font-mono text-2xs px-1.5 py-0.5 rounded border ${
                      item.badgeAlert
                        ? 'bg-red-50 text-red-700 border-red-300 animate-pulse font-bold'
                        : isActive
                        ? 'bg-sky-100 text-sky-800 border-sky-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Diagnostic Panel */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-2xs space-y-1 font-mono">
        <div className="flex items-center justify-between text-slate-500">
          <span>Engine Status:</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
            SYNCHRONIZED
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Loop Interval:</span>
          <span className="text-slate-800">1000 ms</span>
        </div>
        <div className="flex items-center justify-between text-slate-500">
          <span>Active Points:</span>
          <span className="text-slate-800">102 Online</span>
        </div>
        <div className="pt-1 text-2xs text-slate-400 text-center">
          ISO 16484 / BACnet Standard 135
        </div>
      </div>
    </aside>
  );
};
