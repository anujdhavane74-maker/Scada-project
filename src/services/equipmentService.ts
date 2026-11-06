/**
 * Equipment Management Service
 * Aggregates equipment models, calculates operational states, and handles communication health.
 */

import { EquipmentModel, EquipmentOperatingState, QualityCode } from '../types/domain';
import { INITIAL_EQUIPMENT_CATALOG } from '../config/equipmentCatalog';
import { PointRegistry } from './pointRegistry';

export class EquipmentService {
  private static instance: EquipmentService;
  private equipmentMap: Map<string, EquipmentModel> = new Map();
  private listeners: Set<(equipment: EquipmentModel[]) => void> = new Set();

  private constructor() {
    this.initialize(INITIAL_EQUIPMENT_CATALOG);
  }

  public static getInstance(): EquipmentService {
    if (!EquipmentService.instance) {
      EquipmentService.instance = new EquipmentService();
    }
    return EquipmentService.instance;
  }

  public initialize(catalog: EquipmentModel[]): void {
    this.equipmentMap.clear();
    for (const eq of catalog) {
      this.equipmentMap.set(eq.id, { ...eq });
    }
  }

  public getEquipment(id: string): EquipmentModel | undefined {
    const eq = this.equipmentMap.get(id);
    return eq ? { ...eq } : undefined;
  }

  public setEquipmentState(equipmentId: string, state: EquipmentOperatingState, quality: QualityCode): void {
    const eq = this.equipmentMap.get(equipmentId);
    if (eq) {
      eq.operatingState = state;
      eq.communicationQuality = quality;
      this.equipmentMap.set(equipmentId, eq);
      this.notify();
    }
  }

  public getAllEquipment(): EquipmentModel[] {
    return Array.from(this.equipmentMap.values()).map(e => ({ ...e }));
  }

  /**
   * Recalculate operating state and comm quality for an equipment unit based on its live points
   */
  public updateEquipmentState(equipmentId: string, registry: PointRegistry): EquipmentModel | undefined {
    const equipment = this.equipmentMap.get(equipmentId);
    if (!equipment) return undefined;

    const points = registry.getPointsByEquipment(equipmentId);
    let newState: EquipmentOperatingState = equipment.operatingState;
    let worstQuality: QualityCode = 'GOOD';

    // 1. Evaluate communication quality
    for (const pt of points) {
      if (pt.quality === 'BAD' || pt.quality === 'TIMEOUT') {
        worstQuality = pt.quality;
        break;
      } else if (pt.quality === 'UNCERTAIN') {
        worstQuality = 'UNCERTAIN';
      }
    }

    if (worstQuality === 'BAD' || worstQuality === 'TIMEOUT') {
      newState = 'OFFLINE';
    } else {
      // 2. Check for hardware trip or fault alarms
      const hasTrip = points.some(p =>
        (p.id.endsWith('_TRIP_ALARM') || p.id.endsWith('_VIBRATION_ALARM') || p.id.endsWith('_FREEZE_STAT')) &&
        p.value === true
      );
      const hasFault = points.some(p =>
        p.id.endsWith('_FAULT_ALARM') && p.value === true
      );

      if (hasTrip) {
        newState = 'TRIPPED';
      } else if (hasFault) {
        newState = 'FAULT';
      } else {
        // 3. Evaluate Running vs Stopped from physical feedback point
        const statusPoint = points.find(p =>
          p.id.endsWith('_STATUS') || p.id.endsWith('_FAN_STATUS')
        );
        const cmdPoint = points.find(p =>
          p.id.endsWith('_COMMAND') || p.id.endsWith('_ENABLE_CMD') || p.id.endsWith('_FAN_COMMAND')
        );

        if (statusPoint) {
          const isRunning = Boolean(statusPoint.value);
          const isCmdOn = cmdPoint ? Boolean(cmdPoint.value) : isRunning;

          if (isRunning) {
            newState = isCmdOn ? 'RUNNING' : 'STOPPING';
          } else {
            newState = isCmdOn ? 'STARTING' : 'STOPPED';
          }
        }
      }
    }

    equipment.operatingState = newState;
    equipment.communicationQuality = worstQuality;
    this.equipmentMap.set(equipmentId, equipment);

    return { ...equipment };
  }

  /**
   * Batch evaluate all equipment
   */
  public refreshAllStates(registry: PointRegistry): void {
    for (const eqId of this.equipmentMap.keys()) {
      this.updateEquipmentState(eqId, registry);
    }
    this.notify();
  }

  public getSystemSummary() {
    const list = this.getAllEquipment();
    const total = list.length;
    const running = list.filter(e => e.operatingState === 'RUNNING').length;
    const stopped = list.filter(e => e.operatingState === 'STOPPED').length;
    const faulted = list.filter(e => e.operatingState === 'FAULT' || e.operatingState === 'TRIPPED').length;
    const offline = list.filter(e => e.operatingState === 'OFFLINE').length;

    // Calculate comm health percentage
    const goodComm = list.filter(e => e.communicationQuality === 'GOOD').length;
    const commHealthPct = total > 0 ? Math.round((goodComm / total) * 100) : 100;

    return {
      total,
      running,
      stopped,
      faulted,
      offline,
      commHealthPct,
    };
  }

  public subscribe(listener: (equipment: EquipmentModel[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const all = this.getAllEquipment();
    for (const l of this.listeners) {
      l(all);
    }
  }
}
