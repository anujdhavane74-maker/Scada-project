import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SimulationEngine } from '../simulation/simulationEngine';
import { PointRegistry } from '../services/pointRegistry';
import { AlarmService } from '../services/alarmService';
import { INITIAL_POINTS_CATALOG } from '../config/equipmentCatalog';
import { WeatherModel } from '../simulation/weatherModel';

describe('SimulationEngine - Dynamic SCADA Cycle', () => {
  let engine: SimulationEngine;
  let registry: PointRegistry;
  let alarmService: AlarmService;

  beforeEach(() => {
    registry = PointRegistry.getInstance();
    registry.initialize(INITIAL_POINTS_CATALOG);
    alarmService = AlarmService.getInstance();
    engine = SimulationEngine.getInstance();
    engine.stop();
  });

  afterEach(() => {
    engine.stop();
  });

  it('should generate valid Pune diurnal weather conditions', () => {
    const midday = WeatherModel.calculateWeather(14.5, 32.0);
    expect(midday.outdoorAirTemp).toBeGreaterThan(30.0);
    expect(midday.wetBulbTemp).toBeLessThan(midday.outdoorAirTemp);
    expect(midday.solarIrradiance).toBeGreaterThan(600);

    const night = WeatherModel.calculateWeather(2.0, 32.0);
    expect(night.outdoorAirTemp).toBeLessThan(midday.outdoorAirTemp);
    expect(night.solarIrradiance).toBe(0);
  });

  it('should advance tick count on step()', () => {
    const beforeState = engine.getState();
    engine.step();
    const afterState = engine.getState();
    expect(afterState.tickCount).toBe(beforeState.tickCount + 1);
  });

  it('should calculate chiller thermal dynamics when running', () => {
    // Ensure primary pumps and chiller 01 are commanded ON
    registry.updatePoint('CHWP01_COMMAND', true);
    registry.updatePoint('CH01_ENABLE_CMD', true);

    engine.step();

    const supplyTemp = registry.getPoint('CH01_CHW_SUPPLY_TEMP');
    const returnTemp = registry.getPoint('CH01_CHW_RETURN_TEMP');
    const power = registry.getPoint('CH01_ACTIVE_POWER');
    const cop = registry.getPoint('CH01_COP');

    expect(Number(supplyTemp?.value)).toBeCloseTo(6.7, 0); // Near 6.7°C setpoint
    expect(Number(returnTemp?.value)).toBeGreaterThan(Number(supplyTemp?.value)); // Delta T > 0
    expect(Number(power?.value)).toBeGreaterThan(150); // Compressor consuming power
    expect(Number(cop?.value)).toBeGreaterThan(4.5); // High COP
  });

  it('should correctly handle fault injection and clear fault', () => {
    // Inject TRIP on CH01
    engine.injectFault('CH01', 'TRIP');

    const ch01Status = registry.getPoint('CH01_STATUS');
    const ch01Alarm = registry.getPoint('CH01_FAULT_ALARM');

    expect(ch01Status?.value).toBe(false);
    expect(ch01Alarm?.value).toBe(true);

    // Verify alarm was raised in AlarmService
    const activeAlarms = alarmService.getActiveAlarms();
    const found = activeAlarms.some(a => a.pointId === 'CH01_FAULT_ALARM');
    expect(found).toBe(true);

    // Clear fault
    engine.clearFault('CH01');
    const clearedAlarm = registry.getPoint('CH01_FAULT_ALARM');
    expect(clearedAlarm?.value).toBe(false);
  });

  it('should load deterministic scenarios', () => {
    engine.loadScenario('SCENARIO_PEAK_SUMMER');
    const state = engine.getState();
    expect(state.activeScenario).toBe('SCENARIO_PEAK_SUMMER');
    expect(state.weather.outdoorAirTemp).toBeGreaterThan(40.0);
  });
});
