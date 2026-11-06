/**
 * Industrial Equipment Operating State Badge
 */

import React from 'react';
import { EquipmentOperatingState } from '../../types/domain';

interface StatusBadgeProps {
  state: EquipmentOperatingState;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ state, size = 'md' }) => {
  const getBadgeStyle = (s: EquipmentOperatingState) => {
    switch (s) {
      case 'RUNNING':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-500/20';
      case 'STOPPED':
        return 'bg-slate-100 text-slate-600 border-slate-300 ring-slate-400/20';
      case 'STARTING':
      case 'STOPPING':
        return 'bg-sky-50 text-sky-700 border-sky-300 ring-sky-500/20 animate-pulse';
      case 'FAULT':
        return 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-500/20';
      case 'TRIPPED':
        return 'bg-red-50 text-red-700 border-red-300 ring-red-500/20 font-semibold';
      case 'MAINTENANCE':
        return 'bg-indigo-50 text-indigo-700 border-indigo-300 ring-indigo-500/20';
      case 'OFFLINE':
      default:
        return 'bg-slate-200 text-slate-500 border-slate-400 ring-slate-500/10';
    }
  };

  const getDotStyle = (s: EquipmentOperatingState) => {
    switch (s) {
      case 'RUNNING':
        return 'bg-emerald-500 animate-bms-pulse';
      case 'STOPPED':
        return 'bg-slate-400';
      case 'STARTING':
      case 'STOPPING':
        return 'bg-sky-500';
      case 'FAULT':
        return 'bg-amber-500';
      case 'TRIPPED':
        return 'bg-red-600 animate-ping';
      case 'MAINTENANCE':
        return 'bg-indigo-500';
      case 'OFFLINE':
      default:
        return 'bg-slate-400';
    }
  };

  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase border rounded tracking-wider shadow-industrial-sm ${
        isSmall ? 'px-1.5 py-0.5 text-2xs' : 'px-2 py-0.5 text-xs'
      } ${getBadgeStyle(state)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle(state)}`} />
      {state}
    </span>
  );
};
