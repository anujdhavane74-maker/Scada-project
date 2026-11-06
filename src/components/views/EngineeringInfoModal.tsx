/**
 * Engineering Information & Equipment Hierarchy Modal
 * Detailed technical specification of the Yerwada Smart Building BMS architecture.
 */

import React, { useState } from 'react';
import { X, Network, FolderTree, FileCode, ChevronRight, ChevronDown } from 'lucide-react';
import { BUILDING_HIERARCHY, YERWADA_BUILDING_CONFIG } from '../../config/buildingConfig';
import { BuildingHierarchyNode } from '../../types/domain';

interface EngineeringInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineeringInfoModal: React.FC<EngineeringInfoModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'NAMING' | 'CONFIG'>('HIERARCHY');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-300 rounded shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-sky-400" />
            <div>
              <h3 className="font-bold text-sm font-mono">BMS Engineering Architecture Specification</h3>
              <p className="text-2xs text-slate-400 font-sans">
                Yerwada Smart Building (YSB-PUNE-01) &bull; Standard 135 / ISO 16484-5
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 text-xs font-mono">
          <button
            onClick={() => setActiveTab('HIERARCHY')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'HIERARCHY'
                ? 'border-sky-600 text-sky-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            Equipment Hierarchy Tree
          </button>
          <button
            onClick={() => setActiveTab('NAMING')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'NAMING'
                ? 'border-sky-600 text-sky-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Point Naming Taxonomy
          </button>
          <button
            onClick={() => setActiveTab('CONFIG')}
            className={`py-2 px-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'CONFIG'
                ? 'border-sky-600 text-sky-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Building Design Basis
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans">
          {activeTab === 'HIERARCHY' && (
            <div className="space-y-3 font-mono">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-2xs">
                Spatial and operational equipment hierarchy complying with ASHRAE 223P standard for building semantic models.
              </div>
              <div className="border border-slate-200 rounded p-3 bg-white">
                <HierarchyTreeNode node={BUILDING_HIERARCHY} depth={0} />
              </div>
            </div>
          )}

          {activeTab === 'NAMING' && (
            <div className="space-y-4">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-600 text-2xs font-mono">
                Standardized point identification syntax: <code>[EQUIPMENT_ID]_[PARAMETER]_[SUFFIX]</code>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs font-mono">Point Types & Classifications</h4>
                  <ul className="space-y-1.5 text-2xs font-mono text-slate-700">
                    <li><strong className="text-blue-700">AI (Analog Input):</strong> Continuous physical sensor (Temp, Flow, DP, kW). Read-only.</li>
                    <li><strong className="text-purple-700">AO (Analog Output):</strong> Continuous control setpoint (Speed Hz, Valve %, Temp SP). Writable.</li>
                    <li><strong className="text-teal-700">BI (Binary Input):</strong> Digital feedback state (Run status, freeze stat, trip switch). Read-only.</li>
                    <li><strong className="text-amber-700">BO (Binary Output):</strong> Digital command state (Start/Stop, Enable/Disable). Writable.</li>
                  </ul>
                </div>

                <div className="p-3 border border-slate-200 rounded bg-slate-50/50 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs font-mono">Command vs Feedback Rule</h4>
                  <p className="text-2xs text-slate-600 leading-relaxed">
                    Engineering Rule: Commands and physical feedbacks must NEVER be represented as the same point.
                  </p>
                  <ul className="space-y-1 text-2xs font-mono text-slate-700">
                    <li><code>AHU01_FAN_COMMAND</code> (BO): Operator start request</li>
                    <li><code>AHU01_FAN_STATUS</code> (BI): Air differential switch feedback</li>
                    <li><code>PUMP01_COMMAND</code> (BO) vs <code>PUMP01_STATUS</code> (BI)</li>
                    <li><code>AHU01_CHW_VALVE_CMD</code> (AO) vs <code>AHU01_CHW_VALVE_POS</code> (AI)</li>
                  </ul>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
                <h4 className="font-bold text-slate-900 text-xs font-mono">Canonical Point Examples in Yerwada BMS</h4>
                <div className="grid grid-cols-2 gap-2 text-2xs font-mono text-slate-700">
                  <div><code>CH01_CHW_SUPPLY_TEMP</code> - Evaporator Leaving Temp (°C)</div>
                  <div><code>CH01_CHW_RETURN_TEMP</code> - Evaporator Entering Temp (°C)</div>
                  <div><code>AHU01_SAT</code> - Supply Air Temperature (°C)</div>
                  <div><code>AHU01_RAT</code> - Return Air Temperature (°C)</div>
                  <div><code>AHU01_FILTER_DP</code> - Bag Filter Differential (Pa)</div>
                  <div><code>WEATHER_OAT</code> - Outdoor Air Temperature (°C)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'CONFIG' && (
            <div className="space-y-3 font-mono text-2xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-800 text-xs block">Site & Location</span>
                  <div>Facility: {YERWADA_BUILDING_CONFIG.name}</div>
                  <div>Location: {YERWADA_BUILDING_CONFIG.location.area}, {YERWADA_BUILDING_CONFIG.location.city}</div>
                  <div>Coordinates: {YERWADA_BUILDING_CONFIG.location.latitude}°N, {YERWADA_BUILDING_CONFIG.location.longitude}°E</div>
                  <div>Climate Zone: {YERWADA_BUILDING_CONFIG.location.climateZone}</div>
                </div>

                <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-800 text-xs block">HVAC Plant Capacity</span>
                  <div>Total Chiller Capacity: {YERWADA_BUILDING_CONFIG.hvacDesignBasis.totalCoolingCapacityTR} TR (2 x 500 TR)</div>
                  <div>CHW Loop Design: {YERWADA_BUILDING_CONFIG.hvacDesignBasis.chilledWaterLoopDesign.supplyTempC}°C Supply / {YERWADA_BUILDING_CONFIG.hvacDesignBasis.chilledWaterLoopDesign.returnTempC}°C Return</div>
                  <div>CW Loop Design: {YERWADA_BUILDING_CONFIG.hvacDesignBasis.condenserWaterLoopDesign.enteringTempC}°C In / {YERWADA_BUILDING_CONFIG.hvacDesignBasis.condenserWaterLoopDesign.leavingTempC}°C Out</div>
                  <div>Indoor Setpoint: {YERWADA_BUILDING_CONFIG.hvacDesignBasis.indoorDesignCondition.summerCoolingTempC}°C @ {YERWADA_BUILDING_CONFIG.hvacDesignBasis.indoorDesignCondition.relativeHumidityPct}% RH</div>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5">
                <span className="font-bold text-slate-800 text-xs block">Architecture & Communications</span>
                <div>Tier 1 Network: {YERWADA_BUILDING_CONFIG.bmsArchitecture.tier1Network}</div>
                <div>Tier 2 Network: {YERWADA_BUILDING_CONFIG.bmsArchitecture.tier2Network}</div>
                <div>Commission Status: {YERWADA_BUILDING_CONFIG.bmsArchitecture.commissionStatus}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded"
          >
            Close Engineering Specification
          </button>
        </div>
      </div>
    </div>
  );
};

const HierarchyTreeNode: React.FC<{ node: BuildingHierarchyNode; depth: number }> = ({ node, depth }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-1 text-2xs font-mono">
      <div
        className="flex items-center gap-1.5 py-0.5 hover:bg-slate-50 rounded cursor-pointer select-none"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-slate-500" />
          ) : (
            <ChevronRight className="w-3 h-3 text-slate-500" />
          )
        ) : (
          <span className="w-3" />
        )}
        <span
          className={`px-1 py-0.2 rounded font-bold uppercase text-2xs ${
            node.type === 'SITE'
              ? 'bg-slate-800 text-white'
              : node.type === 'BUILDING'
              ? 'bg-sky-700 text-white'
              : node.type === 'FLOOR'
              ? 'bg-blue-100 text-blue-900'
              : node.type === 'SYSTEM'
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-purple-100 text-purple-900'
          }`}
        >
          {node.type}
        </span>
        <span className="text-slate-800 font-medium">{node.name}</span>
        {node.equipmentId && (
          <span className="text-slate-400">[{node.equipmentId}]</span>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <HierarchyTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
