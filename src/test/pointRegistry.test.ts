import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointRegistry } from '../services/pointRegistry';
import { INITIAL_POINTS_CATALOG } from '../config/equipmentCatalog';

describe('PointRegistry - Centralized Point Management', () => {
  let registry: PointRegistry;

  beforeEach(() => {
    registry = PointRegistry.getInstance();
    registry.initialize(INITIAL_POINTS_CATALOG);
  });

  it('should retrieve a point by its unique identifier', () => {
    const pt = registry.getPoint('CH01_CHW_SUPPLY_TEMP');
    expect(pt).toBeDefined();
    expect(pt?.equipmentId).toBe('CH01');
    expect(pt?.unit).toBe('°C');
  });

  it('should retrieve all points belonging to a specific piece of equipment', () => {
    const ahuPoints = registry.getPointsByEquipment('AHU01');
    expect(ahuPoints.length).toBeGreaterThan(0);
    expect(ahuPoints.every(p => p.equipmentId === 'AHU01')).toBe(true);
    expect(ahuPoints.some(p => p.id === 'AHU01_SAT')).toBe(true);
    expect(ahuPoints.some(p => p.id === 'AHU01_FAN_COMMAND')).toBe(true);
  });

  it('should update point value and notify subscribers', () => {
    const listener = vi.fn();
    const unsubscribe = registry.subscribe(listener);

    registry.updatePoint('AHU01_SAT', 16.2, 'GOOD');

    expect(listener).toHaveBeenCalled();
    const updated = registry.getPoint('AHU01_SAT');
    expect(updated?.value).toBe(16.2);
    expect(updated?.quality).toBe('GOOD');

    unsubscribe();
    registry.updatePoint('AHU01_SAT', 17.0, 'GOOD');
    expect(listener).toHaveBeenCalledTimes(1); // No further call after unsub
  });

  it('should support batch updates for high-speed simulation ticks', () => {
    registry.batchUpdate([
      { id: 'AHU01_SAT', value: 15.0 },
      { id: 'AHU01_RAT', value: 23.5 },
      { id: 'CH01_CHW_FLOW', value: 65.0 },
    ]);

    expect(registry.getPoint('AHU01_SAT')?.value).toBe(15.0);
    expect(registry.getPoint('AHU01_RAT')?.value).toBe(23.5);
    expect(registry.getPoint('CH01_CHW_FLOW')?.value).toBe(65.0);
  });
});
