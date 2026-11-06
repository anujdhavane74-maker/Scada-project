/**
 * BMS Historical & Real-Time Trend Analysis View
 * Visualizes continuous telemetry using industrial time-series charts.
 */

import React, { useState, useEffect } from 'react';
import { useBms } from '../../context/BmsContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { LineChart as ChartIcon, RefreshCw } from 'lucide-react';

interface TelemetrySample {
  time: string;
  sat: number;
  satSp: number;
  chwSupply: number;
  chwReturn: number;
  powerKw: number;
  outdoorTemp: number;
}

export const TrendsView: React.FC = () => {
  const { getPoint, simulationState } = useBms();
  const [history, setHistory] = useState<TelemetrySample[]>([]);

  useEffect(() => {
    const sat = Number(getPoint('AHU01_SAT')?.value || 14.5);
    const satSp = Number(getPoint('AHU01_SAT_SP')?.value || 14.5);
    const chwSupply = Number(getPoint('CH01_CHW_SUPPLY_TEMP')?.value || 6.8);
    const chwReturn = Number(getPoint('CH01_CHW_RETURN_TEMP')?.value || 12.1);
    const powerKw = Number(getPoint('CH01_ACTIVE_POWER')?.value || 280);
    const outdoorTemp = simulationState.weather.outdoorAirTemp;

    const sample: TelemetrySample = {
      time: new Date().toLocaleTimeString(),
      sat,
      satSp,
      chwSupply,
      chwReturn,
      powerKw,
      outdoorTemp,
    };

    setHistory((prev) => {
      const next = [...prev, sample];
      return next.slice(-25); // Keep rolling 25 data points
    });
  }, [simulationState.tickCount, getPoint, simulationState.weather.outdoorAirTemp]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-sky-700" />
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Real-Time SCADA Telemetry & Trend Analysis
            </h3>
            <p className="text-2xs text-slate-500 font-mono">
              Rolling 25-sample telemetry window &bull; Real-time thermodynamic response
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-2xs font-mono text-slate-500">
          <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
          <span>Sampling Interval: 1s &bull; Buffer: {history.length} samples</span>
        </div>
      </div>

      {/* Chart 1: AHU Temperature Loop (SAT vs Setpoint vs Ambient) */}
      <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h4 className="font-semibold text-slate-800 text-xs font-mono uppercase">
              AHU-01 Supply Air Temperature Loop (°C)
            </h4>
            <p className="text-2xs text-slate-500">
              Supply Air Temperature (SAT) tracking 14.5°C setpoint against outdoor ambient temperature
            </p>
          </div>
          <span className="font-mono text-2xs text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            Control Loop: PID Feedback
          </span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis domain={[10, 40]} tick={{ fontSize: 10, fill: '#64748B' }} unit="°C" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', borderRadius: 4, border: 'none', color: '#fff', fontSize: 11 }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
              <Line type="monotone" dataKey="outdoorTemp" name="Outdoor Ambient (OAT)" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sat" name="Supply Air Temp (AHU01_SAT)" stroke="#0284C7" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="stepAfter" dataKey="satSp" name="SAT Setpoint (14.5°C)" stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Primary Chiller 01 Evaporator Temperatures & Power Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CHW Supply & Return */}
        <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-2">
          <div className="pb-2 border-b border-slate-200">
            <h4 className="font-semibold text-slate-800 text-xs font-mono uppercase">
              Chiller 01 Chilled Water Loop (°C)
            </h4>
            <p className="text-2xs text-slate-500">Supply (CH01_CHW_SUPPLY_TEMP) vs Return (CH01_CHW_RETURN_TEMP)</p>
          </div>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis domain={[4, 18]} tick={{ fontSize: 9, fill: '#64748B' }} unit="°C" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: 4, color: '#fff', fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="chwReturn" name="CHW Return (Entering)" stroke="#D97706" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="chwSupply" name="CHW Supply (Leaving)" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chiller Power Demand */}
        <div className="bg-white border border-slate-300 rounded p-4 shadow-industrial space-y-2">
          <div className="pb-2 border-b border-slate-200">
            <h4 className="font-semibold text-slate-800 text-xs font-mono uppercase">
              Chiller 01 Electrical Power Demand (kW)
            </h4>
            <p className="text-2xs text-slate-500">Real power consumption drawn by compressor motor</p>
          </div>
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 15, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748B' }} />
                <YAxis domain={[0, 450]} tick={{ fontSize: 9, fill: '#64748B' }} unit="kW" />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderRadius: 4, color: '#fff', fontSize: 10 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="powerKw" name="Chiller Active Power (kW)" stroke="#16A34A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
