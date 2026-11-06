/**
 * BMS Commissioning & Protocol Adapter Diagnostic View
 * Details future BACnet/IP and Modbus TCP integration architecture.
 */

import React from 'react';
import { useBms } from '../../context/BmsContext';
import { Wrench, Network, AlertCircle, RefreshCw, FileText } from 'lucide-react';

export const CommissioningView: React.FC = () => {
  const { protocolStatuses, refreshProtocols, commandLogs } = useBms();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Pre-Commissioning & Protocol Adapter Workstation
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              Milestone 01 Architecture &bull; Clean Protocol Adapter Stubs &bull; Audit Trail
            </p>
          </div>
        </div>

        <button
          onClick={refreshProtocols}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs font-medium text-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Refresh Driver Heartbeat
        </button>
      </div>

      {/* Protocol Architecture Disclaimer Callout */}
      <div className="p-3 bg-amber-50/70 border border-amber-300 rounded text-xs text-amber-900 space-y-1">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>BMS Engineering Specification Notice (Milestone 01)</span>
        </div>
        <p className="text-2xs leading-relaxed text-amber-800">
          This system is an educational simulation of the Yerwada Smart Building. It is not connected to physical building hardware controllers.
          The domain layer provides clean, typed protocol adapter interfaces (<code className="font-mono bg-amber-100/80 px-1 py-0.2 rounded">IBACnetAdapter</code>, <code className="font-mono bg-amber-100/80 px-1 py-0.2 rounded">IModbusAdapter</code>)
          to ensure zero-code refactoring when Milestone 02 hardware drivers are commissioned.
        </p>
      </div>

      {/* Protocol Adapter Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {protocolStatuses.map((adapter) => {
          const isActive = adapter.protocol === 'SIMULATOR';

          return (
            <div
              key={adapter.protocol}
              className={`p-3.5 bg-white border rounded shadow-industrial-sm space-y-2.5 ${
                isActive ? 'border-sky-500 ring-1 ring-sky-500/20' : 'border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className={`w-4 h-4 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                  <span className="font-mono font-bold text-xs text-slate-800">{adapter.protocol}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded font-mono text-2xs font-semibold ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-slate-100 text-slate-500 border border-slate-300'
                  }`}
                >
                  {isActive ? 'ACTIVE DRIVER' : 'STAGED INTERFACE'}
                </span>
              </div>

              <div className="space-y-1 font-mono text-2xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Endpoint / Binding:</span>
                  <span className="text-slate-800">{adapter.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Latency:</span>
                  <span className="text-slate-800">{adapter.latencyMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Telemetry Packets:</span>
                  <span className="text-slate-800">{adapter.packetsReceived} RX / {adapter.packetsSent} TX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver Quality:</span>
                  <span className="text-emerald-700 font-bold">{adapter.quality}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-2xs text-slate-500 font-sans">
                {adapter.protocol === 'SIMULATOR' && 'Physics-based thermal, hydraulic, and electrical cycle engine.'}
                {adapter.protocol === 'BACNET_IP' && 'ASHRAE 135 Annex J UDP/IP Port 47808 Controller Interface (Pre-wired).'}
                {adapter.protocol === 'MODBUS_TCP' && 'Substation energy meter & VFD RS485-to-Ethernet gateway (Pre-wired).'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Operator Command Audit Trail */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-700" />
            <h4 className="font-semibold text-slate-800 text-xs font-mono uppercase">
              Operator Command & Safety Interlock Audit Trail ({commandLogs.length} Records)
            </h4>
          </div>
          <span className="text-2xs text-slate-400 font-mono">
            Non-repudiation event log
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-2xs uppercase">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Point ID</th>
                <th className="py-2 px-3">Equipment</th>
                <th className="py-2 px-3">Requested Value</th>
                <th className="py-2 px-3">Operator</th>
                <th className="py-2 px-3">Interlock Status</th>
                <th className="py-2 px-3 text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commandLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                    No operator commands logged in this session yet. Try commanding equipment in the Devices view.
                  </td>
                </tr>
              ) : (
                commandLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2 px-3 text-slate-500 text-2xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-slate-800">{log.pointId}</td>
                    <td className="py-2 px-3 text-slate-600">{log.equipmentId}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{String(log.requestedValue)}</td>
                    <td className="py-2 px-3 text-slate-500 text-2xs">{log.operator}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${
                          log.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-2xs text-slate-500">
                      {log.rejectionReason || 'Validated successfully'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
