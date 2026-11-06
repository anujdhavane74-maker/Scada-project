/**
 * Floor Plan & Zone Distribution View
 * Architectural zoning representation for Yerwada Smart Building.
 */

import React, { useState } from 'react';
import { useBms } from '../../context/BmsContext';
import { Building2, Layers, Wind } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';
import { PointValueDisplay } from '../common/PointValueDisplay';

export const FloorPlanView: React.FC = () => {
  const { getPoint, getEquipment, setSelectedEquipmentId } = useBms();
  const [activeFloor, setActiveFloor] = useState<string>('LEVEL_1');

  const floorConfigs = [
    {
      id: 'LEVEL_ROOF',
      label: 'Roof Plant Level',
      desc: 'Heat Rejection & Meteorological Deck',
      ahuId: null,
      fcuIds: [],
      specialEquip: ['CT01', 'CT02', 'WEATHER_OAT'],
    },
    {
      id: 'LEVEL_4',
      label: 'Level 4 - R&D Labs',
      desc: 'Hardware Testing Labs & Development Pods',
      ahuId: 'AHU04',
      fcuIds: ['FCU10', 'FCU11'],
      specialEquip: [],
    },
    {
      id: 'LEVEL_3',
      label: 'Level 3 - Executive',
      desc: 'Director Suites, Boardrooms, Telecom Hub',
      ahuId: 'AHU03',
      fcuIds: ['FCU07', 'FCU08', 'FCU09'],
      specialEquip: [],
    },
    {
      id: 'LEVEL_2',
      label: 'Level 2 - Engineering',
      desc: 'IT Development Pods, Training & Server Room B',
      ahuId: 'AHU02',
      fcuIds: ['FCU04', 'FCU05', 'FCU06'],
      specialEquip: [],
    },
    {
      id: 'LEVEL_1',
      label: 'Level 1 - Operations',
      desc: 'Open Workspace, Primary Data Server Room A',
      ahuId: 'AHU01',
      fcuIds: ['FCU01', 'FCU02', 'FCU03'],
      specialEquip: [],
    },
    {
      id: 'LEVEL_GF',
      label: 'Ground Floor',
      desc: 'Main Reception Atrium & Cafeteria',
      ahuId: 'AHU05',
      fcuIds: ['FCU12'],
      specialEquip: [],
    },
    {
      id: 'LEVEL_B1',
      label: 'Basement Level 1',
      desc: 'Central HVAC Energy Plant & Hydronic Pumps',
      ahuId: null,
      fcuIds: [],
      specialEquip: ['CH01', 'CH02', 'CHWP01', 'CHWP02', 'CWP01', 'CWP02'],
    },
  ];

  const currentConfig = floorConfigs.find((f) => f.id === activeFloor) || floorConfigs[4];
  const currentAhu = currentConfig.ahuId ? getEquipment(currentConfig.ahuId) : null;
  const currentSat = currentConfig.ahuId ? getPoint(`${currentConfig.ahuId}_SAT`) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-sky-700" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Yerwada Smart Building - Floor Plan Zoning & Air Distribution
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              Multi-Floor Zone Schematic &bull; ASHRAE 62.1 Indoor Air Quality Monitoring
            </p>
          </div>
        </div>
        <span className="font-mono text-2xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded border border-slate-200">
          Total Usable Area: 28,500 m²
        </span>
      </div>

      {/* Main Floor Selector & Zone Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Floor Selection Column (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-300 rounded p-2 shadow-industrial space-y-1">
          <div className="px-2 py-1.5 border-b border-slate-200 mb-1">
            <span className="font-mono text-2xs font-semibold uppercase text-slate-500 tracking-wider">
              Select Building Level
            </span>
          </div>

          {floorConfigs.map((f) => {
            const isActive = activeFloor === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFloor(f.id)}
                className={`w-full text-left p-2.5 rounded transition-all border ${
                  isActive
                    ? 'bg-sky-50 border-sky-400 font-semibold shadow-xs'
                    : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">{f.label}</span>
                  <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                </div>
                <p className="text-2xs text-slate-400 font-sans mt-0.5">{f.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Floor Zone Distribution Canvas (9 cols) */}
        <div className="lg:col-span-9 bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-bold text-slate-900 text-sm font-mono">{currentConfig.label}</h4>
              <p className="text-2xs text-slate-500">{currentConfig.desc}</p>
            </div>
            {currentAhu && (
              <div className="flex items-center gap-2 font-mono text-2xs bg-slate-50 px-2 py-1 rounded border border-slate-200">
                <Wind className="w-3.5 h-3.5 text-sky-600" />
                <span>Primary AHU: <strong>{currentAhu.id}</strong></span>
                {currentSat && <PointValueDisplay point={currentSat} compact />}
              </div>
            )}
          </div>

          {/* FCU Zone Cards */}
          {currentConfig.fcuIds.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-2xs font-semibold uppercase text-slate-500 tracking-wider">
                Individual Thermal Control Zones (Fan Coil Units)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {currentConfig.fcuIds.map((fcuId) => {
                  const eq = getEquipment(fcuId);
                  if (!eq) return null;
                  const roomTemp = getPoint(`${fcuId}_ROOM_TEMP`);
                  const tempSp = getPoint(`${fcuId}_TEMP_SP`);
                  const valveCmd = getPoint(`${fcuId}_VALVE_CMD`);
                  const zoneRh = getPoint(`${fcuId}_ZONE_RH`);

                  return (
                    <div
                      key={fcuId}
                      onClick={() => setSelectedEquipmentId(fcuId)}
                      className="p-3 bg-slate-50 border border-slate-200 rounded hover:border-sky-400 cursor-pointer transition-colors space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-800">{fcuId}</span>
                          <p className="text-2xs text-slate-600 font-sans">{eq.name}</p>
                        </div>
                        <StatusBadge state={eq.operatingState} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-2xs font-mono">
                        <div>
                          <span className="text-slate-400 block">SPACE TEMP:</span>
                          <span className="font-bold text-slate-900 text-xs">
                            {roomTemp ? <PointValueDisplay point={roomTemp} /> : '--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">ACTIVE SP:</span>
                          <span className="font-semibold text-slate-700">
                            {tempSp ? <PointValueDisplay point={tempSp} /> : '--'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-2xs font-mono text-slate-500">
                        <span>Cooling Valve: {valveCmd?.value ?? 0}%</span>
                        {zoneRh && <span>Zone RH: {zoneRh.value}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plant Level Specific Equipment */}
          {currentConfig.specialEquip.length > 0 && (
            <div className="space-y-2">
              <span className="font-mono text-2xs font-semibold uppercase text-slate-500 tracking-wider">
                Heavy Plant Infrastructure Installed on this Level
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentConfig.specialEquip.map((eqId) => {
                  const eq = getEquipment(eqId);
                  if (!eq) return null;
                  return (
                    <div
                      key={eqId}
                      onClick={() => setSelectedEquipmentId(eqId)}
                      className="p-3 bg-slate-50 border border-slate-200 rounded hover:border-sky-400 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-800">{eq.id}</span>
                        <StatusBadge state={eq.operatingState} size="sm" />
                      </div>
                      <p className="text-2xs text-slate-600">{eq.name}</p>
                      <p className="text-2xs text-slate-400 font-mono">{eq.designCapacity}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
