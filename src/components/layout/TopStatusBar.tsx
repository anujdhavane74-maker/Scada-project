/**
 * Industrial Top Status Bar
 * Displays building telemetry, simulation engine state, active alarms, and live system clock.
 */

import React, { useState, useEffect } from 'react';
import { useBms } from '../../context/BmsContext';
import { Play, Pause, FastForward, StepForward, AlertCircle, Info, ShieldCheck, Wifi } from 'lucide-react';
import { ScenarioPresetId, SimulationSpeed } from '../../types/simulation';
import { SIMULATION_SCENARIOS } from '../../simulation/scenarios';

interface TopStatusBarProps {
  onOpenEngineeringInfo: () => void;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({ onOpenEngineeringInfo }) => {
  const {
    simulationState,
    toggleSimulation,
    stepSimulation,
    setSimulationSpeed,
    loadScenario,
    alarmSummary,
    systemSummary,
    setActiveRoute,
  } = useBms();

  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatIST = (d: Date) => {
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' IST';
  };

  return (
    <header className="bg-white border-b border-slate-300 px-4 py-2 flex flex-wrap items-center justify-between text-xs select-none gap-3 shadow-industrial-sm">
      {/* Left: Building Identification */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center font-mono font-bold text-sky-400 text-xs">
            YSB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-sm tracking-tight leading-none">
                Yerwada Smart Building
              </h1>
              <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                YSB-PUNE-01
              </span>
            </div>
            <p className="text-2xs text-slate-500 font-mono">
              Yerwada, Pune &bull; 18.55°N 73.88°E &bull; Grade-A Commercial BMS
            </p>
          </div>
        </div>

        {/* Global Comm Quality Badge */}
        <div
          className={`flex items-center gap-1.5 font-mono text-2xs px-2 py-0.5 rounded border ${
            systemSummary.commHealthPct === 100
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-300'
          }`}
          title="Communication Quality across BACnet and Modbus networks"
        >
          <Wifi className="w-3 h-3" />
          <span>COMM: {systemSummary.commHealthPct}% HEALTHY</span>
        </div>
      </div>

      {/* Center: Simulation Controls */}
      <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-2xs font-semibold text-slate-700">
            {simulationState.isRunning ? 'SIM RUNNING' : 'SIM PAUSED'}
          </span>
          <span className="font-mono text-2xs text-slate-400">
            [TICK: {simulationState.tickCount}]
          </span>
        </div>

        {/* Play/Pause & Step Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSimulation}
            className="p-1 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            title={simulationState.isRunning ? 'Pause Simulation' : 'Run Simulation'}
          >
            {simulationState.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
          </button>
          <button
            onClick={stepSimulation}
            disabled={simulationState.isRunning}
            className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-700 transition-colors"
            title="Step One Simulation Tick"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 border-l border-r border-slate-300 px-1.5">
          <FastForward className="w-3 h-3 text-slate-400 mr-0.5" />
          {([1, 2, 5, 10] as SimulationSpeed[]).map((spd) => (
            <button
              key={spd}
              onClick={() => setSimulationSpeed(spd)}
              className={`px-1.5 py-0.5 font-mono text-2xs rounded ${
                simulationState.speed === spd
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Scenario Selector */}
        <div className="flex items-center gap-1">
          <label htmlFor="scenario-select" className="text-2xs text-slate-500 uppercase font-mono">Scenario:</label>
          <select
            id="scenario-select"
            value={simulationState.activeScenario}
            onChange={(e) => loadScenario(e.target.value as ScenarioPresetId)}
            className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-2xs font-mono text-slate-700 focus:outline-none"
          >
            {Object.entries(SIMULATION_SCENARIOS).map(([key, sc]) => (
              <option key={key} value={key}>
                {sc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Alarms, Time, Operator Profile, Eng Info */}
      <div className="flex items-center gap-3">
        {/* Active Alarms Pill */}
        <button
          onClick={() => setActiveRoute('ALARMS')}
          className={`flex items-center gap-1.5 px-2 py-1 rounded border font-mono text-2xs transition-all ${
            alarmSummary.critical > 0
              ? 'bg-red-50 text-red-700 border-red-300 animate-pulse font-bold'
              : alarmSummary.total > 0
              ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}
          title="Click to open Alarms Console"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>
            {alarmSummary.total} ALARMS ({alarmSummary.critical} CRIT)
          </span>
        </button>

        {/* Engineering Info Hierarchy Button */}
        <button
          onClick={onOpenEngineeringInfo}
          className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 text-2xs font-medium transition-colors"
          title="Open Engineering Hierarchy & Point Taxonomy"
        >
          <Info className="w-3.5 h-3.5 text-sky-700" />
          <span>Eng Info</span>
        </button>

        {/* Clock & Operator */}
        <div className="text-right border-l border-slate-200 pl-3">
          <div className="font-mono text-2xs text-slate-800 font-medium">
            {formatIST(clock)}
          </div>
          <div className="flex items-center gap-1 text-2xs text-slate-500 font-mono justify-end">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>E. Rane (BMS-L3)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
