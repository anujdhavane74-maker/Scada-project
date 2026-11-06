/**
 * Industrial SVG Schematic: Air Handling Unit (AHU)
 * Displays airflow path, mixing box, filter DP, cooling coil valve, and supply fan with live telemetry.
 */

import React from 'react';
import { useBms } from '../../context/BmsContext';
import { PointValueDisplay } from '../common/PointValueDisplay';
import { StatusBadge } from '../common/StatusBadge';

interface AhuGraphicProps {
  ahuId?: string;
}

export const AhuGraphic: React.FC<AhuGraphicProps> = ({ ahuId = 'AHU01' }) => {
  const { getPoint, getEquipment, setSelectedEquipmentId } = useBms();

  const equipment = getEquipment(ahuId);
  const fanStatus = Boolean(getPoint(`${ahuId}_FAN_STATUS`)?.value);
  const fanSpeed = getPoint(`${ahuId}_FAN_SPEED_FEEDBACK`);
  const sat = getPoint(`${ahuId}_SAT`);
  const rat = getPoint(`${ahuId}_RAT`);
  const rah = getPoint(`${ahuId}_RAH`);
  const valvePos = getPoint(`${ahuId}_CHW_VALVE_POS`);
  const filterDp = getPoint(`${ahuId}_FILTER_DP`);
  const staticPress = getPoint(`${ahuId}_STATIC_PRESS`);

  return (
    <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial">
      {/* Schematic Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-sky-600 rounded-xs" />
          <h4 className="font-semibold text-slate-800 text-sm">{equipment?.name || ahuId}</h4>
          <span className="font-mono text-2xs text-slate-500">[{ahuId} &bull; {equipment?.designCapacity}]</span>
        </div>
        <div className="flex items-center gap-3">
          {equipment && <StatusBadge state={equipment.operatingState} size="sm" />}
          <button
            onClick={() => setSelectedEquipmentId(ahuId)}
            className="text-2xs text-sky-700 hover:text-sky-900 font-medium underline"
          >
            Inspect All Points &rarr;
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 760 260"
          className="w-full min-w-[650px] h-auto select-none font-mono text-2xs"
        >
          {/* Main AHU Housing Enclosure */}
          <rect
            x="40"
            y="40"
            width="680"
            height="170"
            fill="#F8FAFC"
            stroke="#64748B"
            strokeWidth="2"
            rx="2"
          />

          {/* Section Dividers */}
          <line x1="160" y1="40" x2="160" y2="210" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="280" y1="40" x2="280" y2="210" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="440" y1="40" x2="440" y2="210" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="580" y1="40" x2="580" y2="210" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Airflow Direction Indicators */}
          {fanStatus && (
            <g stroke="#0284C7" strokeWidth="2" fill="none">
              <path d="M 10 125 L 40 125" markerEnd="url(#arrow)" className="animate-bms-flow" />
              <path d="M 720 125 L 755 125" markerEnd="url(#arrow)" className="animate-bms-flow" />
            </g>
          )}

          {/* 1. MIXING BOX SECTION */}
          <g>
            <text x="50" y="55" fill="#475569" fontSize="9" fontWeight="bold">MIXING PLENUM</text>
            {/* Outdoor air damper */}
            <rect x="42" y="80" width="16" height="90" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
            <line x1="50" y1="85" x2="50" y2="165" stroke="#0284C7" strokeWidth="2" />
            <text x="65" y="125" fill="#64748B" fontSize="8">OA DAMPER 25%</text>

            {/* Return air connection top */}
            <path d="M 100 40 L 100 15 L 140 15 L 140 40" fill="none" stroke="#64748B" strokeWidth="1.5" />
            <text x="95" y="10" fill="#475569" fontSize="8" fontWeight="bold">RETURN AIR</text>
          </g>

          {/* 2. FILTER SECTION */}
          <g>
            <text x="170" y="55" fill="#475569" fontSize="9" fontWeight="bold">FILTER BANK</text>
            {/* V-bank filters */}
            <polyline points="210,65 225,95 210,125 225,155 210,185" fill="none" stroke="#334155" strokeWidth="3" />
            <polyline points="225,65 240,95 225,125 240,155 225,185" fill="none" stroke="#64748B" strokeWidth="2" />

            {/* Filter DP Tag */}
            <rect x="175" y="195" width="85" height="18" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" rx="1" />
            <text x="180" y="207" fill="#0F172A" fontSize="8" fontWeight="bold">
              DP: {filterDp?.value ?? '--'} Pa
            </text>
          </g>

          {/* 3. COOLING COIL SECTION */}
          <g>
            <text x="290" y="55" fill="#475569" fontSize="9" fontWeight="bold">CHW COOLING COIL</text>

            {/* Serpenting Cooling Coil */}
            <rect x="330" y="65" width="22" height="120" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
            <line x1="335" y1="70" x2="335" y2="180" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="4 2" />
            <line x1="345" y1="70" x2="345" y2="180" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="4 2" />

            {/* Modulating Valve & Chilled Water Lines */}
            <path d="M 341 40 L 341 18 L 380 18" fill="none" stroke="#0284C7" strokeWidth="2" />
            {/* 2-Way Valve Icon */}
            <polygon points="370,12 370,24 380,18" fill="#0284C7" />
            <polygon points="390,12 390,24 380,18" fill="#0284C7" />
            <rect x="368" y="2" width="24" height="8" fill="#334155" rx="1" />

            {/* Valve Position Badge */}
            <rect x="295" y="195" width="120" height="18" fill="#FFFFFF" stroke="#0284C7" strokeWidth="1" rx="1" />
            <text x="300" y="207" fill="#0369A1" fontSize="8" fontWeight="bold">
              VALVE: {valvePos?.value ?? '--'}%
            </text>
          </g>

          {/* 4. SUPPLY FAN SECTION */}
          <g>
            <text x="450" y="55" fill="#475569" fontSize="9" fontWeight="bold">SUPPLY AIR FAN</text>

            {/* Centrifugal Scroll Casing */}
            <circle cx="510" cy="125" r="45" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />

            {/* Rotating Impeller Blades */}
            <g className={fanStatus ? 'animate-bms-spin' : ''} style={{ transformOrigin: '510px 125px' }}>
              <circle cx="510" cy="125" r="10" fill="#0F172A" />
              <line x1="510" y1="85" x2="510" y2="165" stroke="#475569" strokeWidth="4" />
              <line x1="470" y1="125" x2="550" y2="125" stroke="#475569" strokeWidth="4" />
              <line x1="482" y1="97" x2="538" y2="153" stroke="#475569" strokeWidth="3" />
              <line x1="482" y1="153" x2="538" y2="97" stroke="#475569" strokeWidth="3" />
            </g>

            {/* Fan Status Indicator Light */}
            <circle cx="560" cy="70" r="4" fill={fanStatus ? '#16A34A' : '#64748B'} />
            <text x="460" y="195" fill="#334155" fontSize="8">
              SPEED: {fanSpeed?.value ?? 0} Hz
            </text>
          </g>

          {/* 5. DISCHARGE & SENSORS SECTION */}
          <g>
            <text x="590" y="55" fill="#475569" fontSize="9" fontWeight="bold">SUPPLY DISCHARGE</text>

            {/* Static Pressure Tap */}
            <line x1="620" y1="125" x2="620" y2="95" stroke="#64748B" strokeWidth="1.5" />
            <circle cx="620" cy="95" r="3" fill="#0284C7" />
            <text x="630" y="98" fill="#475569" fontSize="8">SP: {staticPress?.value ?? '--'} Pa</text>

            {/* SAT Sensor Probe */}
            <line x1="660" y1="125" x2="660" y2="145" stroke="#DC2626" strokeWidth="1.5" />
            <circle cx="660" cy="145" r="3" fill="#DC2626" />
            <rect x="635" y="155" width="80" height="20" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1" rx="1" />
            <text x="640" y="168" fill="#991B1B" fontSize="9" fontWeight="bold">
              SAT: {sat?.value ?? '--'}°C
            </text>
          </g>
        </svg>
      </div>

      {/* Telemetry Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 pt-3 border-t border-slate-200 text-xs">
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Supply Temp (SAT)</span>
          {sat ? <PointValueDisplay point={sat} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Return Temp (RAT)</span>
          {rat ? <PointValueDisplay point={rat} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Return Humidity</span>
          {rah ? <PointValueDisplay point={rah} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">Filter Pressure Drop</span>
          {filterDp ? <PointValueDisplay point={filterDp} /> : '--'}
        </div>
        <div className="bg-slate-50 p-2 rounded border border-slate-200">
          <span className="text-2xs text-slate-500 block uppercase">CHW Valve Position</span>
          {valvePos ? <PointValueDisplay point={valvePos} /> : '--'}
        </div>
      </div>
    </div>
  );
};
