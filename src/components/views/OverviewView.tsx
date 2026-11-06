/**
 * Overview Dashboard View
 * Primary industrial operator workstation screen for Yerwada Smart Building.
 */

import React from 'react';
import { useBms } from '../../context/BmsContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  Power,
  Sun,
  Thermometer,
  Wifi,
} from 'lucide-react';
import { AhuGraphic } from '../graphics/AhuGraphic';
import { ChillerGraphic } from '../graphics/ChillerGraphic';
import { StatusBadge } from '../common/StatusBadge';
import { QualityBadge } from '../common/QualityBadge';

export const OverviewView: React.FC = () => {
  const {
    systemSummary,
    alarmSummary,
    simulationState,
    equipment,
    alarms,
    acknowledgeAlarm,
    setSelectedEquipmentId,
    setActiveRoute,
  } = useBms();

  const weather = simulationState.weather;

  return (
    <div className="space-y-4">
      {/* 1. TOP OPERATIONAL KPI METRICS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* Total Equipment */}
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-industrial-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Total Equipment</span>
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-slate-900">{systemSummary.total}</span>
            <span className="text-2xs text-slate-500 font-mono">Units</span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">2 Chillers, 5 AHU, 12 FCU, 6 Plant</p>
        </div>

        {/* Running Equipment */}
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-industrial-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Online & Running</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-emerald-700">{systemSummary.running}</span>
            <span className="text-2xs text-emerald-600 font-mono">
              ({Math.round((systemSummary.running / systemSummary.total) * 100)}%)
            </span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">Physical feedback verified</p>
        </div>

        {/* Stopped Equipment */}
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-industrial-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Standby / Off</span>
            <Power className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-slate-700">{systemSummary.stopped}</span>
            <span className="text-2xs text-slate-500 font-mono">Standby</span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">Ready for auto-staging</p>
        </div>

        {/* Faulted Equipment */}
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-industrial-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Tripped / Fault</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${systemSummary.faulted > 0 ? 'text-red-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl font-bold ${systemSummary.faulted > 0 ? 'text-red-700' : 'text-slate-700'}`}>
              {systemSummary.faulted}
            </span>
            <span className="text-2xs text-slate-500 font-mono">Faults</span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">Safety lockouts active</p>
        </div>

        {/* Active Alarms */}
        <div
          onClick={() => setActiveRoute('ALARMS')}
          className={`bg-white border rounded p-2.5 shadow-industrial-sm cursor-pointer hover:border-sky-400 transition-colors ${
            alarmSummary.critical > 0 ? 'border-red-300 bg-red-50/20' : 'border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Active Alarms</span>
            <Flame className={`w-3.5 h-3.5 ${alarmSummary.critical > 0 ? 'text-red-600 animate-pulse' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-mono text-xl font-bold ${alarmSummary.critical > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {alarmSummary.total}
            </span>
            <span className="text-2xs text-red-600 font-mono font-semibold">
              ({alarmSummary.critical} Crit)
            </span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">{alarmSummary.unacknowledged} Unacknowledged</p>
        </div>

        {/* Comm Quality Health */}
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-industrial-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Field Comm Health</span>
            <Wifi className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-sky-800">{systemSummary.commHealthPct}%</span>
            <span className="text-2xs text-sky-600 font-mono">Good</span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">BACnet / Modbus packet poll</p>
        </div>

        {/* Ambient Weather Station */}
        <div className="bg-white border border-slate-300 rounded p-2.5 shadow-industrial-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-mono text-2xs uppercase tracking-wider font-semibold">Yerwada Weather</span>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-slate-900">{weather.outdoorAirTemp}°C</span>
            <span className="text-2xs text-slate-500 font-mono">OAT</span>
          </div>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">
            RH: {weather.outdoorAirHumidity}% &bull; WB: {weather.wetBulbTemp}°C
          </p>
        </div>
      </div>

      {/* 2. CRITICAL ALARM BANNER (if alarms exist) */}
      {alarms.length > 0 && (
        <div className="bg-white border border-red-300 rounded p-3 shadow-industrial">
          <div className="flex items-center justify-between pb-2 border-b border-red-100 mb-2">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold text-xs uppercase tracking-wider">
                Active Station Alarms & Out-of-Limit Notifications ({alarms.length})
              </span>
            </div>
            <button
              onClick={() => setActiveRoute('ALARMS')}
              className="text-2xs text-red-700 hover:text-red-900 font-medium underline"
            >
              Open Full Alarm Console &rarr;
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {alarms.slice(0, 3).map((alarm) => (
              <div
                key={alarm.id}
                className="flex items-center justify-between p-2 rounded bg-red-50/50 border border-red-200 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-2xs px-1.5 py-0.5 rounded font-bold ${
                      alarm.severity === 'CRITICAL'
                        ? 'bg-red-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    {alarm.severity}
                  </span>
                  <span className="font-mono text-2xs font-semibold text-slate-800">
                    [{alarm.pointId}]
                  </span>
                  <span className="text-slate-700">{alarm.message}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xs text-slate-500 font-mono">
                    {new Date(alarm.timestamp).toLocaleTimeString()}
                  </span>
                  {alarm.status.includes('UNACKNOWLEDGED') ? (
                    <button
                      onClick={() => acknowledgeAlarm(alarm.id)}
                      className="px-2 py-0.5 bg-red-700 hover:bg-red-800 text-white font-medium text-2xs rounded transition-colors shadow-xs"
                    >
                      Acknowledge
                    </button>
                  ) : (
                    <span className="text-2xs text-emerald-700 font-mono font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ack
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LIVE SVG SCHEMATICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Central Chiller 01 Schematic */}
        <div>
          <ChillerGraphic chillerId="CH01" />
        </div>

        {/* Representative AHU-01 Schematic */}
        <div>
          <AhuGraphic ahuId="AHU01" />
        </div>
      </div>

      {/* 4. CRITICAL EQUIPMENT QUICK TELEMETRY GRID */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-sky-700" />
            <h4 className="font-semibold text-slate-800 text-sm">
              Critical Primary Plant Equipment Status
            </h4>
          </div>
          <button
            onClick={() => setActiveRoute('DEVICES')}
            className="text-xs text-sky-700 hover:text-sky-900 font-medium underline"
          >
            View All 25 Inventory Devices &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-500 text-2xs uppercase">
                <th className="py-2 px-3">Equipment ID</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Location</th>
                <th className="py-2 px-3">Operating State</th>
                <th className="py-2 px-3">Comm Quality</th>
                <th className="py-2 px-3">Run Hours</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipment.slice(0, 8).map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{eq.id}</td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans">{eq.name}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-2xs">{eq.location.floor} - {eq.location.zone}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge state={eq.operatingState} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <QualityBadge quality={eq.communicationQuality} />
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{eq.runHours} hrs</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedEquipmentId(eq.id)}
                      className="text-2xs text-sky-700 hover:text-sky-900 font-semibold px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                    >
                      Inspect Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
