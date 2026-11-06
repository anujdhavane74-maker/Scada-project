import { describe, it, expect, beforeEach } from 'vitest';
import { CommandValidator } from '../services/commandValidator';
import { PointRegistry } from '../services/pointRegistry';
import { INITIAL_POINTS_CATALOG } from '../config/equipmentCatalog';

describe('CommandValidator - Safety & Interlocks', () => {
  let registry: PointRegistry;

  beforeEach(() => {
    registry = PointRegistry.getInstance();
    registry.initialize(INITIAL_POINTS_CATALOG);
  });

  it('should reject writes to read-only telemetry points (AI)', () => {
    const aiPoint = registry.getPoint('AHU01_SAT')!;
    expect(aiPoint.isWritable).toBe(false);

    const result = CommandValidator.validateCommand(aiPoint, 15.0, (id) => registry.getPoint(id));
    expect(result.isValid).toBe(false);
    expect(result.rejectionReason).toContain('read-only telemetry point');
  });

  it('should reject writes to read-only digital feedback points (BI)', () => {
    const biPoint = registry.getPoint('AHU01_FAN_STATUS')!;
    expect(biPoint.isWritable).toBe(false);

    const result = CommandValidator.validateCommand(biPoint, true, (id) => registry.getPoint(id));
    expect(result.isValid).toBe(false);
    expect(result.rejectionReason).toContain('read-only');
  });

  it('should accept valid writes within safe analog range', () => {
    const spPoint = registry.getPoint('AHU01_SAT_SP')!;
    expect(spPoint.isWritable).toBe(true);

    const result = CommandValidator.validateCommand(spPoint, 15.5, (id) => registry.getPoint(id));
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe(15.5);
  });

  it('should reject analog setpoints exceeding engineering boundaries', () => {
    const spPoint = registry.getPoint('AHU01_SAT_SP')!;
    // Point min is 12, max is 20
    const outOfBoundsHigh = CommandValidator.validateCommand(spPoint, 35.0, (id) => registry.getPoint(id));
    expect(outOfBoundsHigh.isValid).toBe(false);
    expect(outOfBoundsHigh.rejectionReason).toContain('out of safe range');

    const outOfBoundsLow = CommandValidator.validateCommand(spPoint, 8.0, (id) => registry.getPoint(id));
    expect(outOfBoundsLow.isValid).toBe(false);
  });

  it('should enforce freeze protection interlock on chilled water setpoint', () => {
    const chwSpPoint = registry.getPoint('CH01_CHW_TEMP_SP')!;
    const lowResult = CommandValidator.validateCommand(chwSpPoint, 4.2, (id) => registry.getPoint(id));
    expect(lowResult.isValid).toBe(false);
    expect(lowResult.rejectionReason).toContain('FREEZE RISK INTERLOCK');
  });

  it('should enforce chiller start interlock: requires running primary pump', () => {
    const ch01Cmd = registry.getPoint('CH01_ENABLE_CMD')!;

    // Case 1: CHWP01 is running -> Chiller start allowed
    registry.updatePoint('CHWP01_STATUS', true);
    const allowed = CommandValidator.validateCommand(ch01Cmd, true, (id) => registry.getPoint(id));
    expect(allowed.isValid).toBe(true);

    // Case 2: Both CHWP01 and CHWP02 are stopped -> Chiller start rejected by interlock
    registry.updatePoint('CHWP01_STATUS', false);
    registry.updatePoint('CHWP02_STATUS', false);
    const blocked = CommandValidator.validateCommand(ch01Cmd, true, (id) => registry.getPoint(id));
    expect(blocked.isValid).toBe(false);
    expect(blocked.rejectionReason).toContain('SAFETY INTERLOCK BLOCKED');
    expect(blocked.rejectionReason).toContain('No primary chilled water pump is currently running');
  });
});
