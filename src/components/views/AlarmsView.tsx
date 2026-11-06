/**
 * BMS Alarms & Event Management Console
 */

import React, { useState } from 'react';
import { useBms } from '../../context/BmsContext';
import { Bell, AlertTriangle, CheckCircle2, Filter, CheckCheck } from 'lucide-react';
import { AlarmSeverity } from '../../types/domain';

export const AlarmsView: React.FC = () => {
  const { alarms, alarmSummary, acknowledgeAlarm, acknowledgeAllAlarms, setSelectedEquipmentId } = useBms();
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlarmSeverity>('ALL');

  const filteredAlarms = alarms.filter((a) => {
    if (severityFilter === 'ALL') return true;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-4">
      {/* Console Header */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Alarm & Fault Management Console
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              ISA-18.2 / ANSI Standard Alarm Management Lifecycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {alarmSummary.unacknowledged > 0 && (
            <button
              onClick={acknowledgeAllAlarms}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Acknowledge All ({alarmSummary.unacknowledged})
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-slate-500 block font-semibold">Total Active Alarms</span>
          <span className="text-xl font-bold font-mono text-slate-900">{alarmSummary.total}</span>
        </div>
        <div className="bg-white border border-red-200 bg-red-50/20 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-red-700 block font-semibold">Critical Alarms (HH / Trip)</span>
          <span className="text-xl font-bold font-mono text-red-700">{alarmSummary.critical}</span>
        </div>
        <div className="bg-white border border-amber-200 bg-amber-50/20 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-amber-700 block font-semibold">Warning Alerts (H / L)</span>
          <span className="text-xl font-bold font-mono text-amber-700">{alarmSummary.warning}</span>
        </div>
        <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-slate-500 block font-semibold">Unacknowledged</span>
          <span className="text-xl font-bold font-mono text-slate-800">{alarmSummary.unacknowledged}</span>
        </div>
      </div>

      {/* Alarms Table */}
      <div className="bg-white border border-slate-300 rounded shadow-industrial overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-2xs font-mono">
            <span className="text-slate-500 uppercase font-semibold flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Filter Severity:
            </span>
            {(['ALL', 'CRITICAL', 'WARNING'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  severityFilter === sev
                    ? 'bg-slate-800 text-white font-bold border-slate-900'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
          <span className="text-2xs text-slate-400 font-mono">
            Auto-refreshing live alarm stream
          </span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 text-2xs text-slate-600 uppercase">
              <tr>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Point ID</th>
                <th className="py-2.5 px-3">Equipment</th>
                <th className="py-2.5 px-3">Alarm Message</th>
                <th className="py-2.5 px-3">Value</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlarms.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono text-xs">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    No active alarms matching current criteria. All HVAC plant operating in normal envelope.
                  </td>
                </tr>
              ) : (
                filteredAlarms.map((alarm) => {
                  const isCrit = alarm.severity === 'CRITICAL';
                  const isUnack = alarm.status.includes('UNACKNOWLEDGED');

                  return (
                    <tr
                      key={alarm.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCrit ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-bold ${
                            isCrit
                              ? 'bg-red-600 text-white animate-pulse'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5" />
                          {alarm.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-2xs whitespace-nowrap">
                        {new Date(alarm.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{alarm.pointId}</td>
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => setSelectedEquipmentId(alarm.equipmentId)}
                          className="text-sky-700 hover:text-sky-900 underline font-medium"
                        >
                          {alarm.equipmentId}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-sans text-xs">
                        {alarm.message}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {String(alarm.triggerValue)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-2xs ${
                            isUnack
                              ? 'bg-red-100 text-red-800 font-semibold border border-red-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {alarm.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {isUnack ? (
                          <button
                            onClick={() => acknowledgeAlarm(alarm.id)}
                            className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white text-2xs rounded font-semibold transition-colors shadow-xs"
                          >
                            Ack
                          </button>
                        ) : (
                          <span className="text-2xs text-emerald-700 font-medium">Ack'd</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
