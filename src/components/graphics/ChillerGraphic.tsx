/**
 * Industrial SVG Schematic: Water-Cooled Centrifugal Chiller
 * Displays dual-barrel layout (Evaporator / Condenser), compressor, and hydronic telemetry.
 */

import React from 'react';
import { useBms } from '../../context/BmsContext';
import { PointValueDisplay } from '../common/PointValueDisplay';
import { StatusBadge } from '../common/StatusBadge';

interface ChillerGraphicProps {
  chillerId: 'CH01' | 'CH02';
}

export const ChillerGraphic: React.FC<ChillerGraphicProps> = ({ chillerId }) => {
  const { getPoint, getEquipment, setSelectedEquipmentId } = useBms();

  const equip = getEquipment(chillerId);
  const isRunning = Boolean(getPoint(`${chillerId}_STATUS`)?.value);
  const chwSupply = getPoint(`${chillerId}_CHW_SUPPLY_TEMP`);
  const chwReturn = getPoint(`${chillerId}_CHW_RETURN_TEMP`);
  const cwEntering = getPoint(`${chillerId}_CW_ENTERING_TEMP`);
  const cwLeaving = getPoint(`${chillerId}_CW_LEAVING_TEMP`);
  const fla = getPoint(`${chillerId}_PERCENT_FLA`);
  const power = getPoint(`${chillerId}_ACTIVE_POWER`);
  const cop = getPoint(`${chillerId}_COP`);
  const flow = getPoint(`${chillerId}_CHW_FLOW`);

  return (
    <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-xs ${isRunning ? 'bg-emerald-600' : 'bg-slate-400'}`} />
          <h4 className="font-semibold text-slate-800 text-sm">{equip?.name || chillerId}</h4>
          <span className="font-mono text-2xs text-slate-500">[{chillerId} &bull; 500 TR Centrifugal]</span>
        </div>
        <div className="flex items-center gap-3">
          {equip && <StatusBadge state={equip.operatingState} size="sm" />}
          <button
            onClick={() => setSelectedEquipmentId(chillerId)}
            className="text-2xs text-sky-700 hover:text-sky-900 font-medium underline"
          >
            Inspect Points &rarr;
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox="0 0 680 220" className="w-full min-w-[550px] h-auto select-none font-mono text-2xs">
          {/* Compressor Motor Housing Top Center */}
          <path
            d="M 280 80 L 280 40 L 400 40 L 400 80 Z"
            fill="#334155"
            stroke="#1E293B"
            strokeWidth="2"
          />
          {/* Centrifugal Impeller Volute */}
          <circle cx="340" cy="80" r="32" fill="#475569" stroke="#0F172A" strokeWidth="2" />
          <text x="315" y="78" fill="#F8FAFC" fontSize="9" fontWeight="bold">VFD MOTOR</text>
          <text x="322" y="90" fill="#94A3B8" fontSize="8">{fla?.value ?? 0}% FLA</text>

          {/* Upper Barrel: Condenser (Heat Rejection - Amber/Warm Water) */}
          <rect
            x="140"
            y="70"
            width="400"
            height="45"
            rx="8"
            fill="#FEF3C7"
            stroke="#D97706"
            strokeWidth="2"
          />
          <text x="155" y="97" fill="#B45309" fontSize="9" fontWeight="bold">CONDENSER BARREL</text>

          {/* Lower Barrel: Evaporator (Chilled Water - Blue/Cold Water) */}
          <rect
            x="140"
            y="140"
            width="400"
            height="45"
            rx="8"
            fill="#E0F2FE"
            stroke="#0284C7"
            strokeWidth="2"
          />
          <text x="155" y="167" fill="#0369A1" fontSize="9" fontWeight="bold">EVAPORATOR BARREL</text>

          {/* Interconnecting Refrigerant Lines */}
          <line x1="240" y1="115" x2="240" y2="140" stroke="#64748B" strokeWidth="6" />
          <line x1="440" y1="115" x2="440" y2="140" stroke="#64748B" strokeWidth="6" />

          {/* CONDENSER WATER PIPING (AMBER) */}
          {/* Entering Condenser Water */}
          <path d="M 60 80 L 140 80" stroke="#D97706" strokeWidth="4" fill="none" />
          <rect x="20" y="70" width="85" height="20" fill="#FFFFFF" stroke="#D97706" strokeWidth="1" rx="1" />
          <text x="25" y="83" fill="#B45309" fontSize="8" fontWeight="bold">
            CW IN: {cwEntering?.value ?? '--'}°C
          </text>

          {/* Leaving Condenser Water to Cooling Tower */}
          <path d="M 540 80 L 620 80" stroke="#DC2626" strokeWidth="4" fill="none" />
          <rect x="575" y="70" width="90" height="20" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1" rx="1" />
          <text x="580" y="83" fill="#B91C1C" fontSize="8" fontWeight="bold">
            CW OUT: {cwLeaving?.value ?? '--'}°C
          </text>

          {/* CHILLED WATER PIPING (BLUE) */}
          {/* Entering CHW Return from Building */}
          <path d="M 60 155 L 140 155" stroke="#0284C7" strokeWidth="4" fill="none" />
          <rect x="20" y="145" width="95" height="20" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1" rx="1" />
          <text x="25" y="158" fill="#0369A1" fontSize="8" fontWeight="bold">
            CHW RET: {chwReturn?.value ?? '--'}°C
          </text>

          {/* Leaving CHW Supply to Building */}
          <path d="M 540 155 L 620 155" stroke="#2563EB" strokeWidth="4" fill="none" />
          <rect x="575" y="145" width="95" height="20" fill="#FFFFFF" stroke="#2563EB" strokeWidth="1" rx="1" />
          <text x="580" y="158" fill="#1D4ED8" fontSize="8" fontWeight="bold">
            CHW SUP: {chwSupply?.value ?? '--'}°C
          </text>
        </svg>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Power Demand</span>
          {power ? <PointValueDisplay point={power} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Efficiency (COP)</span>
          {cop ? <PointValueDisplay point={cop} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Chilled Water Flow</span>
          {flow ? <PointValueDisplay point={flow} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Full Load Amps</span>
          {fla ? <PointValueDisplay point={fla} /> : '--'}
        </div>
      </div>
    </div>
  );
};
