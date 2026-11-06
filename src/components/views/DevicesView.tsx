/**
 * Equipment Inventory & Point Inspector View
 * Central point explorer and equipment management console.
 */

import React, { useState, useMemo } from 'react';
import { useBms } from '../../context/BmsContext';
import { StatusBadge } from '../common/StatusBadge';
import { QualityBadge, PointTypeBadge } from '../common/QualityBadge';
import { PointValueDisplay } from '../common/PointValueDisplay';
import { Search, Filter, X, Cpu, ArrowLeftRight, Laptop, Key } from 'lucide-react';
import { MacBookHostDeviceDetail } from '../devices/MacBookHostDeviceDetail';
import { ConnectComputerModal } from '../devices/ConnectComputerModal';

export const DevicesView: React.FC = () => {
  const {
    equipment,
    points,
    selectedEquipmentId,
    setSelectedEquipmentId,
    hostAgentState,
  } = useBms();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const isConnected = hostAgentState.isOnline && hostAgentState.status === 'CONNECTED';
  const hostDeviceId = hostAgentState.deviceId || 'IT-MAC-001';
  const hostDeviceName = hostAgentState.deviceName || 'Local Host Workstation';
  const hostOsName = hostAgentState.osName || 'Local Host OS';

  // Filtered Equipment List
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const matchesSearch =
        eq.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.location.zone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'ALL' || eq.type === selectedType;
      const matchesFloor = selectedFloor === 'ALL' || eq.location.floor.includes(selectedFloor);
      const matchesState = selectedState === 'ALL' || eq.operatingState === selectedState;

      return matchesSearch && matchesType && matchesFloor && matchesState;
    });
  }, [equipment, searchQuery, selectedType, selectedFloor, selectedState]);

  // Points of currently selected equipment
  const activeEquipment = useMemo(() => {
    return equipment.find((e) => e.id === selectedEquipmentId);
  }, [equipment, selectedEquipmentId]);

  const activePoints = useMemo(() => {
    if (!selectedEquipmentId) return [];
    return points.filter((p) => p.equipmentId === selectedEquipmentId);
  }, [points, selectedEquipmentId]);

  const floors = ['ALL', 'Basement', 'Ground Floor', 'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Roof', 'Monitoring Lab'];
  const types: { label: string; value: string }[] = [
    { label: 'All Equipment (26)', value: 'ALL' },
    { label: 'Chillers (2)', value: 'CHILLER' },
    { label: 'AHUs (5)', value: 'AHU' },
    { label: 'FCUs (12)', value: 'FCU' },
    { label: 'Pumps (4)', value: 'PUMP' },
    { label: 'Cooling Towers (2)', value: 'COOLING_TOWER' },
    { label: 'IT Equipment (1)', value: 'IT_EQUIPMENT' },
  ];

  return (
    <div className="space-y-4">
      {/* Header and Filter Bar */}
      <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Equipment Inventory & Point Browser
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              25 Equipment Units &bull; 102 Centralized SCADA Points &bull; ISO 16484-5 Standards
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, description, zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-2xs font-mono">
          <span className="text-slate-500 uppercase flex items-center gap-1 font-semibold">
            <Filter className="w-3 h-3 text-slate-400" /> Filters:
          </span>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {/* Floor Filter */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            {floors.map((f) => (
              <option key={f} value={f}>
                {f === 'ALL' ? 'All Floors' : f}
              </option>
            ))}
          </select>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All States</option>
            <option value="RUNNING">RUNNING</option>
            <option value="STOPPED">STOPPED</option>
            <option value="FAULT">FAULT</option>
            <option value="TRIPPED">TRIPPED</option>
            <option value="OFFLINE">OFFLINE</option>
          </select>

          {(searchQuery || selectedType !== 'ALL' || selectedFloor !== 'ALL' || selectedState !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedType('ALL');
                setSelectedFloor('ALL');
                setSelectedState('ALL');
              }}
              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 border border-slate-300 text-2xs"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-slate-500">
            Showing <strong className="text-slate-800">{filteredEquipment.length}</strong> of {equipment.length} Units
          </div>
        </div>
      </div>

      {/* Featured Monitored Device Card: Local Computer Monitoring */}
      <div
        onClick={() => setSelectedEquipmentId(hostDeviceId)}
        className={`bg-white border rounded p-3.5 shadow-industrial-sm flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-all ${
          selectedEquipmentId === hostDeviceId || selectedEquipmentId === 'IT-MAC-001'
            ? 'border-sky-500 ring-1 ring-sky-500/20 bg-sky-50/20'
            : 'border-slate-300 hover:border-sky-400'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-slate-900 text-sky-400 flex items-center justify-center shrink-0">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">{hostDeviceName}</h4>
              <span className="font-mono text-2xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">
                {hostDeviceId}
              </span>
              <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {hostOsName}
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
                {isConnected ? 'LOCAL AGENT ACTIVE' : 'AGENT NOT PAIRED'}
              </span>
            </div>
            <p className="text-2xs text-slate-500 font-mono mt-0.5">
              {isConnected
                ? 'Live loopback telemetry (127.0.0.1:8765) &bull; Session-isolated client metrics'
                : 'Connect your computer to stream live CPU, RAM, Battery & Thermal telemetry'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {isConnected ? (
            <>
              <div className="text-right">
                <span className="text-2xs text-slate-400 block uppercase">CPU / RAM</span>
                <span className="font-bold text-slate-900">
                  {hostAgentState.metrics?.cpu_usage_percent ?? '--'}% / {hostAgentState.metrics?.memory_usage_percent ?? '--'}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xs text-slate-400 block uppercase">Battery</span>
                <span className="font-bold text-slate-900">
                  {hostAgentState.metrics?.battery_percent ?? '--'}% {hostAgentState.metrics?.is_charging ? '(Plugged)' : ''}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEquipmentId(hostDeviceId);
                }}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-2xs rounded shadow-xs transition-colors"
              >
                {selectedEquipmentId === hostDeviceId || selectedEquipmentId === 'IT-MAC-001'
                  ? 'Viewing Details'
                  : 'View Details →'}
              </button>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsConnectModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-semibold text-2xs rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              Connect My Computer
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column View: Equipment List Table (left) & Point Inspector Drawer (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Equipment Table (8 cols if inspector open, 12 if closed) */}
        <div className={`bg-white border border-slate-300 rounded shadow-industrial overflow-hidden ${selectedEquipmentId ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}`}>
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-800 uppercase tracking-wider font-mono">
              Equipment Registry Table
            </span>
            <span className="text-2xs text-slate-500 font-mono">
              Click an equipment row to inspect points
            </span>
          </div>

          <div className="overflow-x-auto max-h-[700px] overflow-y-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 shadow-xs text-2xs text-slate-600 uppercase">
                <tr>
                  <th className="py-2 px-3">Equipment ID</th>
                  <th className="py-2 px-3">Equipment Name</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Floor / Zone</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Comm Quality</th>
                  <th className="py-2 px-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 font-mono text-xs">
                      No equipment matches current search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((eq) => {
                    const isSelected = selectedEquipmentId === eq.id;
                    return (
                      <tr
                        key={eq.id}
                        onClick={() => setSelectedEquipmentId(eq.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50/80 border-l-4 border-l-sky-600'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-slate-900">{eq.id}</td>
                        <td className="py-2 px-3 text-slate-700 font-sans font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>{eq.name}</span>
                            {eq.id === 'IT-MAC-001' && (
                              <span className="font-mono text-2xs bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-300 font-semibold">
                                LIVE HOST
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-slate-500 text-2xs">{eq.type}</td>
                        <td className="py-2 px-3 text-slate-500 text-2xs">
                          {eq.location.floor} - {eq.location.zone}
                        </td>
                        <td className="py-2 px-3">
                          <StatusBadge state={eq.operatingState} size="sm" />
                        </td>
                        <td className="py-2 px-3">
                          <QualityBadge quality={eq.communicationQuality} />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <span className="font-mono text-2xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            {eq.associatedPointIds.length} pts
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Point Inspector Drawer (shown when equipment selected) */}
        {selectedEquipmentId && activeEquipment ? (
          activeEquipment.id === 'IT-MAC-001' || activeEquipment.id === hostDeviceId || activeEquipment.type === 'IT_EQUIPMENT' ? (
            <div className="lg:col-span-6 xl:col-span-5 sticky top-4">
              <MacBookHostDeviceDetail />
            </div>
          ) : (
            <div className="lg:col-span-6 xl:col-span-5 bg-white border border-slate-300 rounded shadow-industrial overflow-hidden sticky top-4">
            {/* Inspector Header */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs font-mono">{activeEquipment.id}</h4>
                    <span className="text-2xs bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-sans">
                      {activeEquipment.name}
                    </span>
                  </div>
                  <p className="text-2xs text-slate-400 font-mono">
                    {activeEquipment.metadata.protocolAddress || 'BACnet Standard 135'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEquipmentId(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Equipment Diagnostics Bar */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-3 gap-2 text-2xs font-mono">
              <div>
                <span className="text-slate-400 block">OPERATING STATE:</span>
                <StatusBadge state={activeEquipment.operatingState} size="sm" />
              </div>
              <div>
                <span className="text-slate-400 block">COMM QUALITY:</span>
                <QualityBadge quality={activeEquipment.communicationQuality} />
              </div>
              <div>
                <span className="text-slate-400 block">RUN HOURS:</span>
                <span className="text-slate-800 font-semibold">{activeEquipment.runHours} hrs</span>
              </div>
            </div>

            {/* Points List */}
            <div className="p-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                <span className="font-semibold text-xs text-slate-800 font-mono">
                  POINT TELEMETRY & COMMANDS ({activePoints.length})
                </span>
                <span className="text-2xs text-slate-400 font-mono">
                  Click slider icon to override
                </span>
              </div>

              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {activePoints.map((pt) => {
                  return (
                    <div
                      key={pt.id}
                      className="p-2 rounded border border-slate-200 hover:border-sky-300 bg-slate-50/60 transition-colors space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <PointTypeBadge type={pt.type} />
                            <span className="font-mono font-bold text-xs text-slate-800">
                              {pt.id}
                            </span>
                            {pt.isWritable && (
                              <span className="font-mono text-2xs bg-purple-50 text-purple-700 px-1 py-0.2 rounded border border-purple-200">
                                Writable
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 font-sans mt-0.5">{pt.name}</p>
                        </div>

                        {/* Live Value & Edit button */}
                        <div className="text-right">
                          <PointValueDisplay point={pt} />
                        </div>
                      </div>

                      {/* Technical metadata row */}
                      <div className="flex flex-wrap items-center justify-between gap-1 text-2xs text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <QualityBadge quality={pt.quality} compact />
                          {pt.type === 'AO' && (
                            <span>Range: [{pt.min}..{pt.max} {pt.unit}]</span>
                          )}
                          {pt.feedbackPointId && (
                            <span className="text-sky-700 flex items-center gap-0.5">
                              <ArrowLeftRight className="w-2.5 h-2.5" /> FB: {pt.feedbackPointId}
                            </span>
                          )}
                          {pt.commandPointId && (
                            <span className="text-amber-700 flex items-center gap-0.5">
                              <ArrowLeftRight className="w-2.5 h-2.5" /> CMD: {pt.commandPointId}
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 text-2xs">
                          {new Date(pt.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          )
        ) : null}
      </div>

      {/* Connect My Computer Modal */}
      <ConnectComputerModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
};
