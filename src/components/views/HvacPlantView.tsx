/**
 * HVAC Central Energy Plant View
 * Displays Central Chilled Water Plant (Chillers, Pumps, Cooling Towers) hydronic loop.
 */

import React from 'react';
import { useBms } from '../../context/BmsContext';
import { ChillerGraphic } from '../graphics/ChillerGraphic';
import { StatusBadge } from '../common/StatusBadge';
import { PointValueDisplay } from '../common/PointValueDisplay';
import { Factory, Wind, Droplet } from 'lucide-react';

export const HvacPlantView: React.FC = () => {
  const { getPoint, getEquipment, setSelectedEquipmentId } = useBms();

  const chwp01 = getEquipment('CHWP01');
  const chwp02 = getEquipment('CHWP02');
  const cwp01 = getEquipment('CWP01');
  const cwp02 = getEquipment('CWP02');
  const ct01 = getEquipment('CT01');
  const ct02 = getEquipment('CT02');

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-sky-700" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Basement Central Chilled Water Plant (B1) & Roof Heat Rejection
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              2 x 500 TR Centrifugal Chillers &bull; 4 x Hydronic Pumps &bull; 2 x Counterflow Cooling Towers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-2xs font-mono">
          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
            CHW LOOP: 6.7°C / 12.2°C
          </span>
          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">
            CW LOOP: 29.8°C / 35.0°C
          </span>
        </div>
      </div>

      {/* Chillers Side-by-Side Graphics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div>
          <ChillerGraphic chillerId="CH01" />
        </div>
        <div>
          <ChillerGraphic chillerId="CH02" />
        </div>
      </div>

      {/* Hydronic Pumps & Cooling Towers Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Primary Pumps Section */}
        <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Droplet className="w-4 h-4 text-sky-600" />
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono">
                Primary Chilled & Condenser Water Pumps
              </h4>
            </div>
            <span className="text-2xs font-mono text-slate-400">Basement Plant Header B1</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { eq: chwp01, cmd: 'CHWP01_COMMAND', status: 'CHWP01_STATUS', speed: 'CHWP01_SPEED_FEEDBACK', head: 'CHWP01_HEAD_DP', power: 'CHWP01_POWER' },
              { eq: chwp02, cmd: 'CHWP02_COMMAND', status: 'CHWP02_STATUS', speed: 'CHWP02_SPEED_FEEDBACK', head: 'CHWP02_HEAD_DP', power: 'CHWP02_POWER' },
              { eq: cwp01, cmd: 'CWP01_COMMAND', status: 'CWP01_STATUS', speed: 'CWP01_SPEED_FEEDBACK', head: 'CWP01_HEAD_DP', power: 'CWP01_POWER' },
              { eq: cwp02, cmd: 'CWP02_COMMAND', status: 'CWP02_STATUS', speed: 'CWP02_SPEED_FEEDBACK', head: 'CWP02_HEAD_DP', power: 'CWP02_POWER' },
            ].map((item) => {
              if (!item.eq) return null;
              const headPt = getPoint(item.head);
              const speedPt = getPoint(item.speed);
              const powerPt = getPoint(item.power);
              const cmdPt = getPoint(item.cmd);

              return (
                <div
                  key={item.eq.id}
                  onClick={() => setSelectedEquipmentId(item.eq!.id)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded hover:border-sky-400 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-800">{item.eq.id}</span>
                      <p className="text-2xs text-slate-500 font-sans">{item.eq.name}</p>
                    </div>
                    <StatusBadge state={item.eq.operatingState} size="sm" />
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/60 text-2xs font-mono">
                    <div>
                      <span className="text-slate-400 block">HEAD:</span>
                      <span className="font-semibold text-slate-800">{headPt?.value ?? 0} kPa</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">SPEED:</span>
                      <span className="font-semibold text-slate-800">{speedPt?.value ?? 0} Hz</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">POWER:</span>
                      <span className="font-semibold text-slate-800">{powerPt?.value ?? 0} kW</span>
                    </div>
                  </div>

                  {cmdPt && (
                    <div className="pt-1 flex items-center justify-between text-2xs font-mono border-t border-slate-200/40">
                      <span className="text-slate-500">Run Command:</span>
                      <PointValueDisplay point={cmdPt} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Roof Cooling Towers Section */}
        <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4 text-emerald-600" />
              <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono">
                Roof Induced Draft Cooling Towers
              </h4>
            </div>
            <span className="text-2xs font-mono text-slate-400">Roof Plant Level</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { eq: ct01, cmd: 'CT01_FAN_COMMAND', status: 'CT01_FAN_STATUS', speed: 'CT01_FAN_SPEED_FEEDBACK', basin: 'CT01_BASIN_TEMP' },
              { eq: ct02, cmd: 'CT02_FAN_COMMAND', status: 'CT02_FAN_STATUS', speed: 'CT02_FAN_SPEED_FEEDBACK', basin: 'CT02_BASIN_TEMP' },
            ].map((item) => {
              if (!item.eq) return null;
              const speedPt = getPoint(item.speed);
              const basinPt = getPoint(item.basin);
              const cmdPt = getPoint(item.cmd);

              return (
                <div
                  key={item.eq.id}
                  onClick={() => setSelectedEquipmentId(item.eq!.id)}
                  className="p-3 bg-slate-50 border border-slate-200 rounded hover:border-sky-400 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-800">{item.eq.id}</span>
                      <p className="text-2xs text-slate-500 font-sans">{item.eq.name}</p>
                    </div>
                    <StatusBadge state={item.eq.operatingState} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-2xs font-mono">
                    <div>
                      <span className="text-slate-400 block">COLD BASIN TEMP:</span>
                      <span className="font-bold text-sky-800 text-xs">{basinPt?.value ?? '--'}°C</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">FAN SPEED:</span>
                      <span className="font-semibold text-slate-800">{speedPt?.value ?? 0} Hz</span>
                    </div>
                  </div>

                  {cmdPt && (
                    <div className="pt-1 flex items-center justify-between text-2xs font-mono border-t border-slate-200/40">
                      <span className="text-slate-500">Fan Command:</span>
                      <PointValueDisplay point={cmdPt} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-blue-50/50 rounded border border-blue-100 text-2xs text-blue-900 font-mono">
            <strong>Psychrometric Approach:</strong> Cooling tower basins maintain condenser water entering temperature (29.5°C) approximately 6°C above Yerwada wet-bulb temperature (23.4°C).
          </div>
        </div>
      </div>
    </div>
  );
};
