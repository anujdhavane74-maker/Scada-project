import { describe, it, expect } from 'vitest';
import { INITIAL_EQUIPMENT_CATALOG, INITIAL_POINTS_CATALOG } from '../config/equipmentCatalog';
import { BUILDING_HIERARCHY, YERWADA_BUILDING_CONFIG } from '../config/buildingConfig';

describe('Domain Models & Building Configuration', () => {
  it('should have correct building metadata for Yerwada Smart Building', () => {
    expect(YERWADA_BUILDING_CONFIG.name).toBe('Yerwada Smart Building');
    expect(YERWADA_BUILDING_CONFIG.location.city).toBe('Pune');
    expect(YERWADA_BUILDING_CONFIG.hvacDesignBasis.totalCoolingCapacityTR).toBe(1000);
    expect(YERWADA_BUILDING_CONFIG.hvacDesignBasis.chilledWaterLoopDesign.supplyTempC).toBe(6.7);
  });

  it('should contain the exact required equipment counts (25 HVAC + 1 IT equipment)', () => {
    const chillers = INITIAL_EQUIPMENT_CATALOG.filter(e => e.type === 'CHILLER');
    const ahus = INITIAL_EQUIPMENT_CATALOG.filter(e => e.type === 'AHU');
    const fcus = INITIAL_EQUIPMENT_CATALOG.filter(e => e.type === 'FCU');
    const pumps = INITIAL_EQUIPMENT_CATALOG.filter(e => e.type === 'PUMP');
    const coolingTowers = INITIAL_EQUIPMENT_CATALOG.filter(e => e.type === 'COOLING_TOWER');
    const itEquipment = INITIAL_EQUIPMENT_CATALOG.filter(e => e.type === 'IT_EQUIPMENT');

    expect(chillers).toHaveLength(2);
    expect(ahus).toHaveLength(5);
    expect(fcus).toHaveLength(12);
    expect(pumps).toHaveLength(4);
    expect(coolingTowers).toHaveLength(2);
    expect(itEquipment).toHaveLength(1);
    expect(itEquipment[0].id).toBe('IT-MAC-001');
    expect(itEquipment[0].name).toBe('MacBook Air M5');
    expect(INITIAL_EQUIPMENT_CATALOG).toHaveLength(26);
  });

  it('should have at least 20 temperature sensors and exactly 10 humidity sensors', () => {
    // Temperature sensors have unit '°C' and are Analog Inputs (AI)
    const tempSensors = INITIAL_POINTS_CATALOG.filter(
      p => p.type === 'AI' && p.unit === '°C'
    );
    // Humidity sensors have unit '%' and are Analog Inputs (AI) measuring relative humidity
    const humiditySensors = INITIAL_POINTS_CATALOG.filter(
      p => p.type === 'AI' && p.unit === '%' && (p.id.includes('RH') || p.id.includes('RAH') || p.id.includes('OAH'))
    );

    expect(tempSensors.length).toBeGreaterThanOrEqual(20);
    expect(humiditySensors.length).toBe(10);
  });

  it('should strictly distinguish commands from feedbacks', () => {
    // BO command points must point to feedback points and vice versa
    const fanCmd = INITIAL_POINTS_CATALOG.find(p => p.id === 'AHU01_FAN_COMMAND');
    const fanStatus = INITIAL_POINTS_CATALOG.find(p => p.id === 'AHU01_FAN_STATUS');

    expect(fanCmd).toBeDefined();
    expect(fanStatus).toBeDefined();

    expect(fanCmd?.type).toBe('BO');
    expect(fanCmd?.isWritable).toBe(true);
    expect(fanCmd?.feedbackPointId).toBe('AHU01_FAN_STATUS');

    expect(fanStatus?.type).toBe('BI');
    expect(fanStatus?.isWritable).toBe(false);
    expect(fanStatus?.commandPointId).toBe('AHU01_FAN_COMMAND');

    // Pump Command vs Status
    const pumpCmd = INITIAL_POINTS_CATALOG.find(p => p.id === 'CHWP01_COMMAND');
    const pumpStatus = INITIAL_POINTS_CATALOG.find(p => p.id === 'CHWP01_STATUS');
    expect(pumpCmd?.type).toBe('BO');
    expect(pumpStatus?.type).toBe('BI');
  });

  it('should maintain spatial hierarchy from SITE down to EQUIPMENT', () => {
    expect(BUILDING_HIERARCHY.type).toBe('SITE');
    expect(BUILDING_HIERARCHY.children?.[0].type).toBe('BUILDING');

    const floors = BUILDING_HIERARCHY.children?.[0].children;
    expect(floors?.length).toBeGreaterThanOrEqual(5);

    const b1Floor = floors?.find(f => f.id === 'LEVEL_B1');
    expect(b1Floor).toBeDefined();
    const chwSystem = b1Floor?.children?.[0];
    expect(chwSystem?.id).toBe('SYS_CHW_PLANT');
    expect(chwSystem?.children?.some(c => c.equipmentId === 'CH01')).toBe(true);
  });

  it('should separate equipment status from communication quality', () => {
    for (const eq of INITIAL_EQUIPMENT_CATALOG) {
      expect(eq.operatingState).toBeDefined();
      expect(['RUNNING', 'STOPPED', 'STARTING', 'STOPPING', 'FAULT', 'TRIPPED', 'MAINTENANCE', 'OFFLINE']).toContain(eq.operatingState);
      expect(eq.communicationQuality).toBeDefined();
      expect(['GOOD', 'UNCERTAIN', 'BAD', 'TIMEOUT']).toContain(eq.communicationQuality);
    }
  });
});
