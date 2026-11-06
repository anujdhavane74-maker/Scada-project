/**
 * Centralized Point Registry
 * Single Source of Truth for all SCADA telemetry, commands, and feedbacks.
 */

import { PointModel, QualityCode } from '../types/domain';
import { INITIAL_POINTS_CATALOG } from '../config/equipmentCatalog';

export type PointListener = (updatedPoint: PointModel) => void;

export class PointRegistry {
  private static instance: PointRegistry;
  private pointsMap: Map<string, PointModel> = new Map();
  private equipmentPointsIndex: Map<string, string[]> = new Map();
  private listeners: Set<PointListener> = new Set();

  private constructor() {
    this.initialize(INITIAL_POINTS_CATALOG);
  }

  public static getInstance(): PointRegistry {
    if (!PointRegistry.instance) {
      PointRegistry.instance = new PointRegistry();
    }
    return PointRegistry.instance;
  }

  /**
   * Reset or re-seed registry (used for tests or scenario resets)
   */
  public initialize(initialPoints: PointModel[]): void {
    this.pointsMap.clear();
    this.equipmentPointsIndex.clear();

    for (const point of initialPoints) {
      // Store deep clone so mutations are isolated
      this.pointsMap.set(point.id, { ...point });

      const equipList = this.equipmentPointsIndex.get(point.equipmentId) || [];
      equipList.push(point.id);
      this.equipmentPointsIndex.set(point.equipmentId, equipList);
    }
  }

  public getPoint(pointId: string): PointModel | undefined {
    const pt = this.pointsMap.get(pointId);
    return pt ? { ...pt } : undefined;
  }

  public getAllPoints(): PointModel[] {
    return Array.from(this.pointsMap.values()).map(p => ({ ...p }));
  }

  public getPointsByEquipment(equipmentId: string): PointModel[] {
    const pointIds = this.equipmentPointsIndex.get(equipmentId) || [];
    return pointIds
      .map(id => this.pointsMap.get(id))
      .filter((p): p is PointModel => p !== undefined)
      .map(p => ({ ...p }));
  }

  /**
   * Update point value and quality code
   */
  public updatePoint(
    pointId: string,
    value: number | boolean | string | null,
    quality: QualityCode = 'GOOD',
    timestamp?: string
  ): PointModel | undefined {
    const current = this.pointsMap.get(pointId);
    if (!current) return undefined;

    const updated: PointModel = {
      ...current,
      value,
      quality,
      timestamp: timestamp || new Date().toISOString(),
    };

    this.pointsMap.set(pointId, updated);
    this.notifyListeners(updated);
    return { ...updated };
  }

  /**
   * Batch update points for simulation performance
   */
  public batchUpdate(updates: Array<{ id: string; value: number | boolean | string | null; quality?: QualityCode }>): void {
    const now = new Date().toISOString();
    for (const u of updates) {
      const current = this.pointsMap.get(u.id);
      if (current) {
        const updated: PointModel = {
          ...current,
          value: u.value,
          quality: u.quality || current.quality,
          timestamp: now,
        };
        this.pointsMap.set(u.id, updated);
        this.notifyListeners(updated);
      }
    }
  }

  public subscribe(listener: PointListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(point: PointModel): void {
    for (const listener of this.listeners) {
      try {
        listener(point);
      } catch (err) {
        console.error("Error in point listener:", err);
      }
    }
  }
}
