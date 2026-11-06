/**
 * Command & Setpoint Override Dialog
 * Provides safety-validated control inputs for writable points.
 */

import React, { useState } from 'react';
import { useBms } from '../../context/BmsContext';
import { X, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PointTypeBadge } from './QualityBadge';

export const CommandDialog: React.FC = () => {
  const { commandModalPoint, closeCommandModal, writePoint } = useBms();
  const [val, setVal] = useState<string | number | boolean>(() => {
    return commandModalPoint && commandModalPoint.value !== null ? commandModalPoint.value : '';
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!commandModalPoint) return null;

  const isBoolean = commandModalPoint.type === 'BO';
  const point = commandModalPoint;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await writePoint(point.id, val);
      if (!res.success) {
        setErrorMsg(res.error || 'Command failed interlock validation.');
      } else {
        setSuccessMsg(`Command successfully applied to [${point.id}].`);
        setTimeout(() => {
          closeCommandModal();
        }, 1200);
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Execution error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded shadow-xl max-w-md w-full overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PointTypeBadge type={point.type} />
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{point.name}</h3>
              <p className="font-mono text-2xs text-slate-500">{point.id} &bull; Equip: {point.equipmentId}</p>
            </div>
          </div>
          <button
            onClick={closeCommandModal}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Validation Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Current Feedback:</span>
              <span className="font-mono font-medium text-slate-900">
                {String(point.value)} {point.unit !== 'none' ? point.unit : ''}
              </span>
            </div>
            {point.type === 'AO' && (
              <div className="flex justify-between text-slate-600">
                <span>Safe Range:</span>
                <span className="font-mono font-medium text-slate-900">
                  {point.min} to {point.max} {point.unit}
                </span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Operator Level:</span>
              <span className="font-mono text-sky-700 font-semibold">BMS Engineer L3 (Authorized)</span>
            </div>
          </div>

          {/* Input field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              {isBoolean ? 'Desired Operating Command' : `New Setpoint (${point.unit})`}
            </label>

            {isBoolean ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVal(true)}
                  className={`py-2 text-xs font-semibold rounded border transition-colors ${
                    val === true
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  START / ENABLE (1)
                </button>
                <button
                  type="button"
                  onClick={() => setVal(false)}
                  className={`py-2 text-xs font-semibold rounded border transition-colors ${
                    val === false
                      ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  STOP / DISABLE (0)
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min={point.min}
                  max={point.max}
                  value={String(val)}
                  onChange={(e) => setVal(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded font-mono text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                />
                <span className="absolute right-3 top-2 text-xs text-slate-400 font-mono">
                  {point.unit}
                </span>
              </div>
            )}
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Safety Interlock Rejection</p>
                <p className="text-2xs mt-0.5 text-red-600">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={closeCommandModal}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded shadow-xs transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Confirm & Execute
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
