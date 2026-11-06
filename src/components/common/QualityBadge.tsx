/**
 * Industrial Point Quality & Type Badges
 */

import React from 'react';
import { PointType, QualityCode } from '../../types/domain';

export const QualityBadge: React.FC<{ quality: QualityCode; compact?: boolean }> = ({ quality, compact = false }) => {
  const getStyle = () => {
    switch (quality) {
      case 'GOOD':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'UNCERTAIN':
        return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
      case 'BAD':
        return 'bg-red-50 text-red-800 border-red-200 font-bold';
      case 'TIMEOUT':
      default:
        return 'bg-slate-100 text-slate-500 border-slate-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-2xs uppercase border rounded px-1.5 py-0.5 tracking-wider ${getStyle()}`}
      title={`Communication Quality: ${quality}`}
    >
      <span
        className={`w-1 h-1 rounded-full ${
          quality === 'GOOD'
            ? 'bg-emerald-500'
            : quality === 'UNCERTAIN'
            ? 'bg-amber-500'
            : quality === 'BAD'
            ? 'bg-red-500'
            : 'bg-slate-400'
        }`}
      />
      {!compact && quality}
    </span>
  );
};

export const PointTypeBadge: React.FC<{ type: PointType }> = ({ type }) => {
  const getStyle = () => {
    switch (type) {
      case 'AI':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AO':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BI':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'BO':
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const getFullLabel = () => {
    switch (type) {
      case 'AI': return 'AI (Analog In)';
      case 'AO': return 'AO (Analog Out)';
      case 'BI': return 'BI (Binary In)';
      case 'BO': return 'BO (Binary Out)';
    }
  };

  return (
    <span
      className={`inline-flex items-center font-mono font-medium text-2xs uppercase border rounded px-1.5 py-0.5 ${getStyle()}`}
      title={getFullLabel()}
    >
      {type}
    </span>
  );
};
