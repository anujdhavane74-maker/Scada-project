/**
 * Local Host Device Detail Inspector (Milestone 02)
 *
 * Displays live hardware telemetry for whoever opens the BMS simulator.
 * Automatically adapts to macOS, Windows, and Linux host agents.
 */

import React, { useState } from 'react';
import { useBms } from '../../context/BmsContext';
import {
  Laptop,
  Cpu,
  Database,
  Battery,
  BatteryCharging,
  Flame,
  Radio,
  Clock,
  RefreshCw,
  ShieldCheck,
  Unplug,
  Key,
  Info,
} from 'lucide-react';
import { PointValueDisplay } from '../common/PointValueDisplay';
import { QualityBadge, PointTypeBadge } from '../common/QualityBadge';
import { ConnectComputerModal } from './ConnectComputerModal';

export const LocalHostDeviceDetail: React.FC = () => {
  const { hostAgentState, pollHostAgent, points, disconnectHostDevice } = useBms();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const m = hostAgentState.metrics;
  const isOnline = hostAgentState.isOnline;
  const isConnected = isOnline && hostAgentState.status === 'CONNECTED';

  const deviceId = hostAgentState.deviceId || 'IT-MAC-001';
  const deviceName = hostAgentState.deviceName || 'Local Host Workstation';
  const osName = hostAgentState.osName || 'Host Operating System';

  // Points associated with host device
  const hostPoints = points.filter(
    (p) => p.equipmentId === 'IT-MAC-001' || p.equipmentId === deviceId || p.id.startsWith('MAC01_')
  );

  const getThermalBadge = (level?: number) => {
    switch (level) {
      case 0:
        return { label: 'NOMINAL', style: 'bg-emerald-50 text-emerald-700 border-emerald-300' };
      case 1:
        return { label: 'FAIR', style: 'bg-sky-50 text-sky-700 border-sky-300' };
      case 2:
        return { label: 'SERIOUS', style: 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse' };
      case 3:
        return { label: 'CRITICAL', style: 'bg-red-50 text-red-700 border-red-300 font-bold animate-ping' };
      default:
        return { label: 'UNKNOWN', style: 'bg-slate-100 text-slate-600 border-slate-300' };
    }
  };

  const thermal = getThermalBadge(m?.thermal_pressure_level);

  return (
    <div className="space-y-4">
      {/* 1. Device Header Card */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 text-sky-400 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{deviceName}</h3>
                <span className="font-mono text-2xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                  {deviceId}
                </span>
                <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                  {osName}
                </span>
                <span
                  className={`font-mono text-2xs px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                    isConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {isConnected ? 'LIVE HOST TELEMETRY' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-2xs text-slate-500 font-mono mt-0.5">
                Location: Monitoring Lab &bull; Integration: Local Host Monitoring Agent (127.0.0.1:8765)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button
                  onClick={() => disconnectHostDevice(true)}
                  className="px-2.5 py-1 text-2xs font-mono font-semibold bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 rounded transition-colors flex items-center gap-1.5"
                  title="Disconnect and clear pairing token"
                >
                  <Unplug className="w-3 h-3 text-red-600" />
                  Disconnect
                </button>
                <button
                  onClick={pollHostAgent}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 transition-colors"
                  title="Poll Host Agent Now"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-2xs rounded shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                Connect My Computer
              </button>
            )}
          </div>
        </div>

        {/* Real Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* CPU Utilization */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="flex items-center justify-between text-2xs text-slate-500 font-mono mb-1">
              <span className="flex items-center gap-1 font-semibold uppercase">
                <Cpu className="w-3.5 h-3.5 text-sky-600" /> CPU Usage
              </span>
              <span className="font-bold text-slate-800">
                {m ? `${m.cpu_usage_percent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (m?.cpu_usage_percent || 0) > 85
                    ? 'bg-red-500'
                    : (m?.cpu_usage_percent || 0) > 60
                    ? 'bg-amber-500'
                    : 'bg-sky-600'
                }`}
                style={{ width: `${Math.min(100, m?.cpu_usage_percent || 0)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-3xs text-slate-400 font-mono">
              <span>Point: MAC01_CPU_USAGE</span>
              <span>Quality: {isOnline ? 'GOOD' : 'TIMEOUT'}</span>
            </div>
          </div>

          {/* RAM Utilization */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="flex items-center justify-between text-2xs text-slate-500 font-mono mb-1">
              <span className="flex items-center gap-1 font-semibold uppercase">
                <Database className="w-3.5 h-3.5 text-indigo-600" /> Memory Usage
              </span>
              <span className="font-bold text-slate-800">
                {m ? `${m.memory_usage_percent.toFixed(1)}%` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  (m?.memory_usage_percent || 0) > 90
                    ? 'bg-red-500'
                    : (m?.memory_usage_percent || 0) > 75
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, m?.memory_usage_percent || 0)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-3xs text-slate-400 font-mono">
              <span>Avail: {m ? `${m.memory_available_gb} GB` : '--'}</span>
              <span>Total: {m ? `${m.memory_total_gb} GB` : '--'}</span>
            </div>
          </div>

          {/* Battery Status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="flex items-center justify-between text-2xs text-slate-500 font-mono mb-1">
              <span className="flex items-center gap-1 font-semibold uppercase">
                {m?.is_charging ? (
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Battery className="w-3.5 h-3.5 text-slate-600" />
                )}
                Battery State
              </span>
              <span className="font-bold text-slate-800">
                {m ? `${m.battery_percent.toFixed(0)}%` : '--'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  m?.is_charging ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
                style={{ width: `${Math.min(100, m?.battery_percent || 0)}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-3xs text-slate-400 font-mono">
              <span>{m?.is_charging ? 'AC Connected' : 'On Battery'}</span>
              <span>Point: MAC01_BATTERY_LEVEL</span>
            </div>
          </div>

          {/* Thermal Pressure State */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="flex items-center justify-between text-2xs text-slate-500 font-mono mb-1">
              <span className="flex items-center gap-1 font-semibold uppercase">
                <Flame className="w-3.5 h-3.5 text-amber-600" /> Thermal State
              </span>
              <span
                className={`text-2xs font-bold px-1.5 py-0.5 rounded border ${thermal.style}`}
              >
                {thermal.label}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-3xs text-slate-400 font-mono">
              <span>Level: {m?.thermal_pressure_level ?? '--'} (0–3)</span>
              <span>API: Native OS Interface</span>
            </div>
          </div>
        </div>

        {/* 2. Sensor Technical Limitation Note */}
        <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-blue-900 text-2xs font-mono flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-blue-800">
              Sensor Access Note ({osName})
            </span>
            <p className="text-3xs text-blue-700 leading-relaxed">
              {m?.cpu_temp_reason ||
                'Direct CPU die-temperature sensor reads require elevated kernel/root permissions. System thermal pressure is monitored natively via non-privileged OS telemetry.'}
            </p>
          </div>
        </div>

        {/* 3. Monitoring Agent Metadata Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 text-2xs font-mono text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-slate-400" />
              Agent Endpoint: <strong>127.0.0.1:8765</strong>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Auth: <strong>Pairing Token (Active)</strong>
            </span>
            <span>
              PID: <strong>{hostAgentState.agentInfo?.pid ?? '--'}</strong>
            </span>
            <span>
              Python: <strong>{hostAgentState.agentInfo?.python_version ?? '--'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3 h-3 text-slate-400" />
            Last Update:{' '}
            <strong className="text-slate-800">
              {hostAgentState.lastPollTimestamp
                ? new Date(hostAgentState.lastPollTimestamp).toLocaleTimeString()
                : 'Never'}
            </strong>
          </div>
        </div>
      </div>

      {/* 4. SCADA Point List for Host Computer */}
      <div className="bg-white border border-slate-300 rounded shadow-industrial overflow-hidden">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-xs">
              Host Monitored SCADA Points ({hostPoints.length})
            </h4>
            <p className="text-3xs text-slate-500 font-mono">
              Domain-layer registered points mapped from local agent
            </p>
          </div>
          <span className="font-mono text-2xs text-slate-500">
            Session-Isolated Local Telemetry
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-100/75 text-slate-600 text-2xs uppercase border-b border-slate-200">
              <tr>
                <th className="py-1.5 px-3">Point ID</th>
                <th className="py-1.5 px-3">Point Name</th>
                <th className="py-1.5 px-3">Type</th>
                <th className="py-1.5 px-3 text-right">Live Value</th>
                <th className="py-1.5 px-3 text-center">Quality</th>
                <th className="py-1.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {hostPoints.map((pt) => (
                <tr key={pt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-bold text-slate-900">{pt.id}</td>
                  <td className="py-2 px-3 text-slate-700">{pt.name}</td>
                  <td className="py-2 px-3">
                    <PointTypeBadge type={pt.type} />
                  </td>
                  <td className="py-2 px-3 text-right font-bold">
                    <PointValueDisplay point={pt} />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <QualityBadge quality={pt.quality} />
                  </td>
                  <td className="py-2 px-3 text-right text-slate-500 text-3xs">
                    {pt.timestamp ? new Date(pt.timestamp).toLocaleTimeString() : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Connect Modal */}
      <ConnectComputerModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
};
