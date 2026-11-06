/**
 * BMS Unified Application Context
 * Bridges domain services, simulation engine, protocol adapters, and UI components.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AlarmEvent, CommandAuditRecord, EquipmentModel, PointModel, QualityCode } from '../types/domain';
import { ScenarioPresetId, SimulationSpeed, SimulationState } from '../types/simulation';
import { ProtocolConnectionStatus } from '../types/protocol';
import { PointRegistry } from '../services/pointRegistry';
import { AlarmService } from '../services/alarmService';
import { EquipmentService } from '../services/equipmentService';
import { EventLogger } from '../services/eventLogger';
import { SimulationEngine } from '../simulation/simulationEngine';
import { ProtocolAdapterManager } from '../services/protocols/protocolAdapter';
import { BACnetIPAdapter } from '../services/protocols/bacnetAdapter';
import { ModbusTCPAdapter } from '../services/protocols/modbusAdapter';
import { SimulatorAdapter } from '../services/protocols/simulatorAdapter';
import { HostAgentService, HostAgentState } from '../services/hostAgentService';

export type NavRoute =
  | 'OVERVIEW'
  | 'HVAC_PLANT'
  | 'FLOOR_PLAN'
  | 'ALARMS'
  | 'TRENDS'
  | 'ENERGY'
  | 'DEVICES'
  | 'COMMISSIONING';

export interface BmsContextType {
  // Navigation & View state
  activeRoute: NavRoute;
  setActiveRoute: (route: NavRoute) => void;
  selectedEquipmentId: string | null;
  setSelectedEquipmentId: (id: string | null) => void;
  commandModalPoint: PointModel | null;
  openCommandModal: (point: PointModel) => void;
  closeCommandModal: () => void;

  // Domain Telemetry & Models
  points: PointModel[];
  getPoint: (id: string) => PointModel | undefined;
  equipment: EquipmentModel[];
  getEquipment: (id: string) => EquipmentModel | undefined;
  alarms: AlarmEvent[];
  alarmSummary: { total: number; critical: number; warning: number; unacknowledged: number };
  systemSummary: { total: number; running: number; stopped: number; faulted: number; offline: number; commHealthPct: number };
  commandLogs: CommandAuditRecord[];

  // Simulation Controls
  simulationState: SimulationState;
  toggleSimulation: () => void;
  stepSimulation: () => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  loadScenario: (scenario: ScenarioPresetId) => void;
  injectFault: (equipmentId: string, faultType: string) => void;
  clearFault: (equipmentId: string) => void;
  setCommQualityOverride: (quality?: QualityCode) => void;

  // Command & Alarm Actions
  writePoint: (pointId: string, value: number | boolean | string) => Promise<{ success: boolean; error?: string }>;
  acknowledgeAlarm: (alarmId: string) => void;
  acknowledgeAllAlarms: () => void;

  // Protocol Infrastructure
  protocolStatuses: ProtocolConnectionStatus[];
  refreshProtocols: () => void;

  // Real Local Host Monitoring Agent
  hostAgentState: HostAgentState;
  pollHostAgent: () => void;
  connectHostDevice: (token: string, remember?: boolean) => Promise<{ success: boolean; error?: string; diagnostic?: string }>;
  disconnectHostDevice: (clearStored?: boolean) => void;
}

const BmsContext = createContext<BmsContextType | null>(null);

export const BmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Services Singletons
  const registry = useMemo(() => PointRegistry.getInstance(), []);
  const alarmService = useMemo(() => AlarmService.getInstance(), []);
  const equipmentService = useMemo(() => EquipmentService.getInstance(), []);
  const eventLogger = useMemo(() => EventLogger.getInstance(), []);
  const simulator = useMemo(() => SimulationEngine.getInstance(), []);
  const protocolManager = useMemo(() => ProtocolAdapterManager.getInstance(), []);
  const hostAgentService = useMemo(() => HostAgentService.getInstance(), []);

  // Initialize Protocol Adapters
  const [simulatorAdapter] = useState(() => new SimulatorAdapter(registry, eventLogger));
  const [bacnetAdapter] = useState(() => new BACnetIPAdapter());
  const [modbusAdapter] = useState(() => new ModbusTCPAdapter());

  useEffect(() => {
    protocolManager.registerAdapter(simulatorAdapter);
    protocolManager.registerAdapter(bacnetAdapter);
    protocolManager.registerAdapter(modbusAdapter);
    protocolManager.setActiveProtocol('SIMULATOR');

    simulatorAdapter.initialize();
    bacnetAdapter.initialize();
    modbusAdapter.initialize();
  }, [protocolManager, simulatorAdapter, bacnetAdapter, modbusAdapter]);

  // Reactive State
  const [activeRoute, setActiveRoute] = useState<NavRoute>('OVERVIEW');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [commandModalPoint, setCommandModalPoint] = useState<PointModel | null>(null);

  const [points, setPoints] = useState<PointModel[]>(() => registry.getAllPoints());
  const [equipment, setEquipment] = useState<EquipmentModel[]>(() => equipmentService.getAllEquipment());
  const [alarms, setAlarms] = useState<AlarmEvent[]>(() => alarmService.getActiveAlarms());
  const [commandLogs, setCommandLogs] = useState<CommandAuditRecord[]>(() => eventLogger.getRecentLogs());
  const [simulationState, setSimulationState] = useState<SimulationState>(() => simulator.getState());
  const [protocolStatuses, setProtocolStatuses] = useState<ProtocolConnectionStatus[]>(() => protocolManager.getAllStatuses());
  const [hostAgentState, setHostAgentState] = useState<HostAgentState>(() => hostAgentService.getState());

  // Subscribe to changes
  useEffect(() => {
    hostAgentService.start();
    const unsubHost = hostAgentService.subscribe((hState) => {
      setHostAgentState(hState);
      setPoints(registry.getAllPoints());
      setEquipment(equipmentService.getAllEquipment());
    });

    const unsubSim = simulator.subscribe((state) => {
      setSimulationState(state);
      setPoints(registry.getAllPoints());
      setEquipment(equipmentService.getAllEquipment());
      setAlarms(alarmService.getActiveAlarms());
    });

    const unsubAlarms = alarmService.subscribe((list) => {
      setAlarms([...list]);
    });

    const unsubLogs = eventLogger.subscribe((logs) => {
      setCommandLogs([...logs]);
    });

    const unsubPoints = registry.subscribe((updatedPoint) => {
      setPoints(prev => prev.map(p => p.id === updatedPoint.id ? updatedPoint : p));
    });

    return () => {
      unsubHost();
      hostAgentService.stop();
      unsubSim();
      unsubAlarms();
      unsubLogs();
      unsubPoints();
    };
  }, [hostAgentService, simulator, registry, alarmService, equipmentService, eventLogger]);

  // Derived summaries
  const alarmSummary = useMemo(() => alarmService.getAlarmSummary(), [alarms, alarmService]);
  const systemSummary = useMemo(() => equipmentService.getSystemSummary(), [equipment, equipmentService]);

  // Handlers
  const openCommandModal = useCallback((point: PointModel) => {
    setCommandModalPoint(point);
  }, []);

  const closeCommandModal = useCallback(() => {
    setCommandModalPoint(null);
  }, []);

  const writePoint = useCallback(async (pointId: string, value: number | boolean | string) => {
    const res = await simulatorAdapter.writePoint({
      pointId,
      value,
      operatorId: 'Operator E. Rane (Eng-L3)',
    });
    setPoints(registry.getAllPoints());
    return { success: res.success, error: res.error };
  }, [simulatorAdapter, registry]);

  const acknowledgeAlarm = useCallback((alarmId: string) => {
    alarmService.acknowledgeAlarm(alarmId, 'Operator E. Rane (Eng-L3)');
    setAlarms(alarmService.getActiveAlarms());
  }, [alarmService]);

  const acknowledgeAllAlarms = useCallback(() => {
    alarmService.acknowledgeAll('Operator E. Rane (Eng-L3)');
    setAlarms(alarmService.getActiveAlarms());
  }, [alarmService]);

  const toggleSimulation = useCallback(() => {
    if (simulationState.isRunning) {
      simulator.stop();
    } else {
      simulator.start();
    }
  }, [simulator, simulationState.isRunning]);

  const stepSimulation = useCallback(() => {
    simulator.step();
  }, [simulator]);

  const setSimulationSpeed = useCallback((spd: SimulationSpeed) => {
    simulator.setSpeed(spd);
  }, [simulator]);

  const loadScenario = useCallback((sc: ScenarioPresetId) => {
    simulator.loadScenario(sc);
  }, [simulator]);

  const injectFault = useCallback((equipId: string, faultType: string) => {
    simulator.injectFault(equipId, faultType);
  }, [simulator]);

  const clearFault = useCallback((equipId: string) => {
    simulator.clearFault(equipId);
  }, [simulator]);

  const setCommQualityOverride = useCallback((q?: QualityCode) => {
    simulator.setCommunicationQualityOverride(q);
  }, [simulator]);

  const refreshProtocols = useCallback(() => {
    setProtocolStatuses(protocolManager.getAllStatuses());
  }, [protocolManager]);

  const getPoint = useCallback((id: string) => registry.getPoint(id), [registry]);
  const getEquipment = useCallback((id: string) => equipmentService.getEquipment(id), [equipmentService]);

  const contextValue: BmsContextType = {
    activeRoute,
    setActiveRoute,
    selectedEquipmentId,
    setSelectedEquipmentId,
    commandModalPoint,
    openCommandModal,
    closeCommandModal,
    points,
    getPoint,
    equipment,
    getEquipment,
    alarms,
    alarmSummary,
    systemSummary,
    commandLogs,
    simulationState,
    toggleSimulation,
    stepSimulation,
    setSimulationSpeed,
    loadScenario,
    injectFault,
    clearFault,
    setCommQualityOverride,
    writePoint,
    acknowledgeAlarm,
    acknowledgeAllAlarms,
    protocolStatuses,
    refreshProtocols,
    hostAgentState,
    pollHostAgent: useCallback(() => hostAgentService.pollNow(), [hostAgentService]),
    connectHostDevice: useCallback(
      (token: string, remember?: boolean) => hostAgentService.connect(token, remember),
      [hostAgentService]
    ),
    disconnectHostDevice: useCallback(
      (clearStored?: boolean) => hostAgentService.disconnect(clearStored),
      [hostAgentService]
    ),
  };

  return (
    <BmsContext.Provider value={contextValue}>
      {children}
    </BmsContext.Provider>
  );
};

export const useBms = (): BmsContextType => {
  const context = useContext(BmsContext);
  if (!context) {
    throw new Error('useBms must be used within a BmsProvider');
  }
  return context;
};
