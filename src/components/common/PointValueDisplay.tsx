/**
 * Point Value Display Component
 * Formats telemetry with engineering precision and affords safe operator command execution.
 */

import React from 'react';
import { PointModel } from '../../types/domain';
import { SlidersHorizontal } from 'lucide-react';
import { useBms } from '../../context/BmsContext';

interface PointValueDisplayProps {
  point: PointModel;
  showUnit?: boolean;
  highlightIfAlarm?: boolean;
  compact?: boolean;
}

export const PointValueDisplay: React.FC<PointValueDisplayProps> = ({
  point,
  showUnit = true,
  highlightIfAlarm = true,
  compact = false,
}) => {
  const { openCommandModal } = useBms();

  const formatValue = (p: PointModel) => {
    if (p.value === null || p.value === undefined) {
      if (p.id.includes('TEMP')) {
        return 'N/A (Restricted)';
      }
      return 'N/A';
    }

    if (p.id === 'MAC01_THERMAL_PRESSURE' && typeof p.value === 'number') {
      const labels = ['NOMINAL', 'FAIR', 'SERIOUS', 'CRITICAL'];
      return labels[p.value] || `LEVEL ${p.value}`;
    }

    if (typeof p.value === 'boolean') {
      if (p.type === 'BO') {
        return p.value ? 'COMMAND: START' : 'COMMAND: STOP';
      }
      return p.value ? 'RUN' : 'STOP';
    }

    if (typeof p.value === 'number') {
      if (p.unit === 'none') {
        return p.value.toString();
      }
      if (p.unit === 'COP') {
        return p.value.toFixed(2);
      }
      if (p.unit === '°C' || p.unit === 'Hz' || p.unit === 'kW' || p.unit === 'L/s' || p.unit === 'kPa') {
        return p.value.toFixed(1);
      }
      if (p.unit === 'Pa' || p.unit === 'rpm') {
        return Math.round(p.value).toString();
      }
      return p.value.toFixed(1);
    }

    return String(p.value);
  };

  const isBoolean = typeof point.value === 'boolean';
  const boolVal = Boolean(point.value);

  // Check alarm condition
  const isAlarm = highlightIfAlarm && (
    (point.category === 'ALARM_POINT' && boolVal) ||
    (typeof point.value === 'number' && point.alarmThresholds && (
      (point.alarmThresholds.highHigh !== undefined && point.value >= point.alarmThresholds.highHigh) ||
      (point.alarmThresholds.lowLow !== undefined && point.value <= point.alarmThresholds.lowLow) ||
      (point.alarmThresholds.high !== undefined && point.value >= point.alarmThresholds.high) ||
      (point.alarmThresholds.low !== undefined && point.value <= point.alarmThresholds.low)
    ))
  );

  return (
    <div className={`inline-flex items-center gap-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
      <span
        className={`font-mono font-medium tracking-tight px-1 rounded ${
          isAlarm
            ? 'bg-red-100 text-red-700 font-bold animate-pulse'
            : isBoolean
            ? boolVal
              ? 'bg-emerald-50 text-emerald-700 font-semibold'
              : 'bg-slate-100 text-slate-600'
            : 'text-slate-900'
        }`}
      >
        {formatValue(point)}
        {showUnit && point.unit !== 'none' && (
          <span className="text-slate-500 font-normal ml-0.5 text-2xs uppercase">
            {point.unit}
          </span>
        )}
      </span>

      {point.isWritable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openCommandModal(point);
          }}
          title={`Override / Setpoint Change for ${point.name}`}
          className="p-1 hover:bg-sky-100 rounded text-sky-700 hover:text-sky-900 transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
