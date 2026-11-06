/**
 * Building Energy & Power Submetering View
 */

import React from 'react';
import { useBms } from '../../context/BmsContext';
import { Zap } from 'lucide-react';

export const EnergyView: React.FC = () => {
  const { getPoint, simulationState } = useBms();

  const ch01Power = Number(getPoint('CH01_ACTIVE_POWER')?.value || 0);
  const ch02Power = Number(getPoint('CH02_ACTIVE_POWER')?.value || 0);
  const chwp01Power = Number(getPoint('CHWP01_POWER')?.value || 0);
  const chwp02Power = Number(getPoint('CHWP02_POWER')?.value || 0);
  const cwp01Power = Number(getPoint('CWP01_POWER')?.value || 0);
  const cwp02Power = Number(getPoint('CWP02_POWER')?.value || 0);

  // AHU fan power estimated ~15 kW per running unit
  const ahuFanTotal = 5 * 14.2;
  // FCU power estimated ~0.35 kW per running unit
  const fcuFanTotal = 12 * 0.35;
  // Lighting & Base Plug Load based on occupancy factor
  const baseLoad = 120 + (simulationState.weather.solarIrradiance > 0 ? 85 : 30);

  const totalKw = Number((ch01Power + ch02Power + chwp01Power + chwp02Power + cwp01Power + cwp02Power + ahuFanTotal + fcuFanTotal + baseLoad).toFixed(1));
  const chillerPlantTotal = Number((ch01Power + ch02Power + chwp01Power + chwp02Power + cwp01Power + cwp02Power).toFixed(1));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Electrical Submetering & Power Distribution (Modbus TCP)
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              BMS Main Incomer 11kV/415V Substation &bull; Modbus Gateway 192.168.100.200
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-2xs font-mono">
          <span className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded border border-emerald-300 font-bold">
            BUILDING TOTAL: {totalKw} kW
          </span>
        </div>
      </div>

      {/* Energy KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-slate-500 block font-semibold">Total Building Demand</span>
          <span className="text-xl font-bold font-mono text-slate-900">{totalKw} kW</span>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">Peak Demand Window: 14:00 - 16:00</p>
        </div>
        <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-slate-500 block font-semibold">Central Plant Demand</span>
          <span className="text-xl font-bold font-mono text-sky-800">{chillerPlantTotal} kW</span>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">{(chillerPlantTotal / totalKw * 100).toFixed(0)}% of total building load</p>
        </div>
        <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-slate-500 block font-semibold">Air Distribution (AHU+FCU)</span>
          <span className="text-xl font-bold font-mono text-slate-800">{(ahuFanTotal + fcuFanTotal).toFixed(1)} kW</span>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">5 VAV AHUs + 12 Zone FCUs</p>
        </div>
        <div className="bg-white border border-slate-300 rounded p-3 shadow-industrial-sm">
          <span className="text-2xs font-mono uppercase text-slate-500 block font-semibold">Lighting & Plug Loads</span>
          <span className="text-xl font-bold font-mono text-slate-800">{baseLoad.toFixed(1)} kW</span>
          <p className="text-2xs text-slate-400 font-mono mt-0.5">Commercial tenant IT load</p>
        </div>
      </div>

      {/* Submetering Breakdown Matrix */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-3">
        <h4 className="font-semibold text-slate-800 text-xs font-mono uppercase pb-2 border-b border-slate-200">
          Substation 415V Feeder Breaker Telemetry
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 text-2xs uppercase">
                <th className="py-2 px-3">Feeder ID</th>
                <th className="py-2 px-3">Load Description</th>
                <th className="py-2 px-3">Modbus Address</th>
                <th className="py-2 px-3">Operating Power (kW)</th>
                <th className="py-2 px-3">Power Factor</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { feeder: 'FDR-01', desc: 'Chiller 01 VFD Compressor Motor', addr: 'Reg 40001 (Unit 1)', kw: ch01Power, pf: 0.96, active: ch01Power > 0 },
                { feeder: 'FDR-02', desc: 'Chiller 02 VFD Compressor Motor (Standby)', addr: 'Reg 40001 (Unit 2)', kw: ch02Power, pf: 0.96, active: ch02Power > 0 },
                { feeder: 'FDR-03', desc: 'Primary CHW Pumps Header (CHWP01 & 02)', addr: 'Reg 40010 (Unit 3)', kw: chwp01Power + chwp02Power, pf: 0.92, active: true },
                { feeder: 'FDR-04', desc: 'Condenser Water Pumps Header (CWP01 & 02)', addr: 'Reg 40020 (Unit 3)', kw: cwp01Power + cwp02Power, pf: 0.91, active: true },
                { feeder: 'FDR-05', desc: 'Roof Cooling Towers Fan VFDs (CT01 & 02)', addr: 'Reg 40030 (Unit 4)', kw: 18.5, pf: 0.89, active: true },
                { feeder: 'FDR-06', desc: 'Air Handling Units VAV Panel (AHU01 to AHU05)', addr: 'Reg 40040 (Unit 5)', kw: ahuFanTotal, pf: 0.94, active: true },
                { feeder: 'FDR-07', desc: 'Fan Coil Units Sub-Panel (FCU01 to FCU12)', addr: 'Reg 40050 (Unit 5)', kw: fcuFanTotal, pf: 0.88, active: true },
                { feeder: 'FDR-08', desc: 'Commercial Office Lighting & Server Base Load', addr: 'Reg 40060 (Unit 6)', kw: baseLoad, pf: 0.98, active: true },
              ].map((row) => (
                <tr key={row.feeder} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3 font-bold text-slate-900">{row.feeder}</td>
                  <td className="py-2 px-3 text-slate-700 font-sans">{row.desc}</td>
                  <td className="py-2 px-3 text-slate-400 text-2xs">{row.addr}</td>
                  <td className="py-2 px-3 font-bold text-slate-900">{row.kw.toFixed(1)} kW</td>
                  <td className="py-2 px-3 text-slate-600">{row.pf.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`px-1.5 py-0.5 rounded text-2xs font-semibold ${
                        row.active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {row.active ? 'ENERGIZED' : 'OPEN / OFF'}
                    </span>
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
