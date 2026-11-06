/**
 * Central BMS Simulation Engine
 * Simulates thermal dynamics, hydronics, airflow, and control loop responses.
 */

import { IBmsSimulator, ScenarioPresetId, SimulationSpeed, SimulationState, WeatherCondition } from '../types/simulation';
import { QualityCode } from '../types/domain';
import { PointRegistry } from '../services/pointRegistry';
import { AlarmService } from '../services/alarmService';
import { EquipmentService } from '../services/equipmentService';
import { WeatherModel } from './weatherModel';
import { SIMULATION_SCENARIOS } from './scenarios';

export class SimulationEngine implements IBmsSimulator {
  private static instance: SimulationEngine;
  private registry: PointRegistry;
  private alarmService: AlarmService;
  private equipmentService: EquipmentService;

  private isRunning: boolean = true;
  private speed: SimulationSpeed = 1;
  private tickCount: number = 0;
  private simulatedHour: number = 14.5; // Starts at 14:30 IST afternoon peak
  private activeScenario: ScenarioPresetId = 'SCENARIO_NORMAL_COOLING';
  private injectedFaults: Map<string, string> = new Map();
  private commQualityOverride?: QualityCode;

  private timerId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: SimulationState) => void> = new Set();

  private constructor() {
    this.registry = PointRegistry.getInstance();
    this.alarmService = AlarmService.getInstance();
    this.equipmentService = EquipmentService.getInstance();
    this.start();
  }

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  public start(): void {
    if (this.timerId) return;
    this.isRunning = true;
    const intervalMs = Math.max(100, Math.round(1000 / this.speed));
    this.timerId = setInterval(() => this.tick(), intervalMs);
    this.notify();
  }

  public stop(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
    this.notify();
  }

  public step(): void {
    this.tick();
  }

  public setSpeed(speed: SimulationSpeed): void {
    this.speed = speed;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  public loadScenario(scenarioId: ScenarioPresetId): void {
    const sc = SIMULATION_SCENARIOS[scenarioId];
    if (!sc) return;

    this.activeScenario = scenarioId;
    this.injectedFaults.clear();
    this.commQualityOverride = undefined;

    if (sc.initialFaults) {
      for (const f of sc.initialFaults) {
        this.injectFault(f.equipmentId, f.faultType);
      }
    }

    if (scenarioId === 'SCENARIO_COMM_DEGRADED') {
      this.setCommunicationQualityOverride('UNCERTAIN');
    }

    this.step();
    this.notify();
  }

  public injectFault(equipmentId: string, faultType: string): void {
    this.injectedFaults.set(equipmentId, faultType);

    // Apply immediate fault states
    if (faultType === 'TRIP' && equipmentId === 'CH01') {
      this.registry.updatePoint('CH01_FAULT_ALARM', true);
      this.registry.updatePoint('CH01_STATUS', false);
    } else if (faultType === 'FILTER_CLOGGED' && equipmentId === 'AHU03') {
      this.registry.updatePoint('AHU03_FILTER_DP', 168.0);
    } else if (faultType === 'COMM_LOSS') {
      const pts = this.registry.getPointsByEquipment(equipmentId);
      for (const p of pts) {
        this.registry.updatePoint(p.id, p.value, 'BAD');
      }
    }

    this.step();
  }

  public clearFault(equipmentId: string): void {
    this.injectedFaults.delete(equipmentId);

    if (equipmentId === 'CH01') {
      this.registry.updatePoint('CH01_FAULT_ALARM', false);
    } else if (equipmentId === 'AHU03') {
      this.registry.updatePoint('AHU03_FILTER_DP', 85.0);
    }

    // Restore quality
    const pts = this.registry.getPointsByEquipment(equipmentId);
    for (const p of pts) {
      this.registry.updatePoint(p.id, p.value, 'GOOD');
    }

    this.step();
  }

  public setCommunicationQualityOverride(quality?: QualityCode): void {
    this.commQualityOverride = quality;
    if (quality) {
      const allPts = this.registry.getAllPoints();
      for (const p of allPts) {
        this.registry.updatePoint(p.id, p.value, quality);
      }
    }
  }

  public getState(): SimulationState {
    const weather = this.getCurrentWeather();
    return {
      isRunning: this.isRunning,
      speed: this.speed,
      tickCount: this.tickCount,
      simulatedTime: new Date(Date.now() + (this.tickCount * 1000 * this.speed)).toISOString(),
      timeStepSeconds: 1,
      activeScenario: this.activeScenario,
      weather,
      injectedFaults: new Map(this.injectedFaults),
      communicationQualityOverride: this.commQualityOverride,
    };
  }

  public subscribe(callback: (state: SimulationState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    const s = this.getState();
    for (const l of this.listeners) l(s);
  }

  private getCurrentWeather(): WeatherCondition {
    const scenario = SIMULATION_SCENARIOS[this.activeScenario];
    if (scenario && this.activeScenario !== 'SCENARIO_NORMAL_COOLING') {
      return scenario.weather;
    }
    // Dynamic diurnal calculation based on simulated hour
    return WeatherModel.calculateWeather(this.simulatedHour, 32.0);
  }

  /**
   * Deterministic Simulation Tick Loop
   */
  private tick(): void {
    this.tickCount++;
    this.simulatedHour = (this.simulatedHour + (0.01 * this.speed)) % 24;
    const weather = this.getCurrentWeather();

    // 1. Update Weather Station Points
    this.registry.updatePoint('WEATHER_OAT', weather.outdoorAirTemp, this.commQualityOverride || 'GOOD');
    this.registry.updatePoint('WEATHER_OAH', weather.outdoorAirHumidity, this.commQualityOverride || 'GOOD');
    this.registry.updatePoint('WEATHER_WET_BULB', weather.wetBulbTemp, this.commQualityOverride || 'GOOD');

    // 2. Chilled Water Pumps Simulation
    this.simulatePumps('CHWP01', 'CHWP01_COMMAND', 'CHWP01_STATUS', 'CHWP01_SPEED_CMD', 'CHWP01_SPEED_FEEDBACK', 'CHWP01_HEAD_DP', 'CHWP01_POWER');
    this.simulatePumps('CHWP02', 'CHWP02_COMMAND', 'CHWP02_STATUS', 'CHWP02_SPEED_CMD', 'CHWP02_SPEED_FEEDBACK', 'CHWP02_HEAD_DP', 'CHWP02_POWER');
    this.simulatePumps('CWP01', 'CWP01_COMMAND', 'CWP01_STATUS', 'CWP01_SPEED_CMD', 'CWP01_SPEED_FEEDBACK', 'CWP01_HEAD_DP', 'CWP01_POWER');
    this.simulatePumps('CWP02', 'CWP02_COMMAND', 'CWP02_STATUS', 'CWP02_SPEED_CMD', 'CWP02_SPEED_FEEDBACK', 'CWP02_HEAD_DP', 'CWP02_POWER');

    // 3. Cooling Towers Simulation
    this.simulateCoolingTower('CT01', weather.wetBulbTemp);
    this.simulateCoolingTower('CT02', weather.wetBulbTemp);

    // 4. Chillers Simulation (CH01 & CH02)
    this.simulateChiller('CH01');
    this.simulateChiller('CH02');

    // 5. Air Handling Units Simulation (AHU01 to AHU05)
    for (const ahuId of ['AHU01', 'AHU02', 'AHU03', 'AHU04', 'AHU05']) {
      this.simulateAhu(ahuId, weather.outdoorAirTemp);
    }

    // 6. Fan Coil Units Simulation (FCU01 to FCU12)
    for (let i = 1; i <= 12; i++) {
      const fcuId = `FCU${i < 10 ? '0' + i : i}`;
      this.simulateFcu(fcuId, weather.outdoorAirTemp);
    }

    // 7. Evaluate alarms across all points
    for (const pt of this.registry.getAllPoints()) {
      this.alarmService.evaluatePoint(pt, this.registry);
    }

    // 8. Refresh equipment operating states and comm quality
    this.equipmentService.refreshAllStates(this.registry);

    this.notify();
  }

  private simulatePumps(
    _equipId: string,
    cmdId: string,
    statusId: string,
    speedCmdId: string,
    speedFbId: string,
    headDpId: string,
    powerId: string
  ): void {
    const cmd = Boolean(this.registry.getPoint(cmdId)?.value);
    const speedCmd = Number(this.registry.getPoint(speedCmdId)?.value || 0);

    // Realistic startup feedback propagation
    this.registry.updatePoint(statusId, cmd, this.commQualityOverride || 'GOOD');

    if (cmd) {
      // Speed feedback tracks command with minor dynamic noise (+-0.1 Hz)
      const noise = (Math.sin(this.tickCount * 0.3) * 0.1);
      const currentSpeed = Number(Math.max(20, Math.min(50, speedCmd + noise)).toFixed(1));
      this.registry.updatePoint(speedFbId, currentSpeed, this.commQualityOverride || 'GOOD');

      // Differential head pressure = (speed / 50)^2 * 220 kPa
      const head = Number(((currentSpeed / 50) ** 2 * 218 + (Math.sin(this.tickCount * 0.5) * 1.5)).toFixed(1));
      this.registry.updatePoint(headDpId, head, this.commQualityOverride || 'GOOD');

      // Electrical power = (speed / 50)^3 * 42 kW
      const power = Number(((currentSpeed / 50) ** 3 * 38.5).toFixed(1));
      this.registry.updatePoint(powerId, power, this.commQualityOverride || 'GOOD');
    } else {
      this.registry.updatePoint(speedFbId, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(headDpId, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(powerId, 0.0, this.commQualityOverride || 'GOOD');
    }
  }

  private simulateCoolingTower(ctId: string, wetBulb: number): void {
    const cmd = Boolean(this.registry.getPoint(`${ctId}_FAN_COMMAND`)?.value);
    const speedCmd = Number(this.registry.getPoint(`${ctId}_FAN_SPEED_CMD`)?.value || 0);

    this.registry.updatePoint(`${ctId}_FAN_STATUS`, cmd, this.commQualityOverride || 'GOOD');

    if (cmd) {
      const speedFb = Number((speedCmd + (Math.sin(this.tickCount * 0.2) * 0.1)).toFixed(1));
      this.registry.updatePoint(`${ctId}_FAN_SPEED_FEEDBACK`, speedFb, this.commQualityOverride || 'GOOD');

      // Cold basin temp = Wet Bulb + Approach (approach drops from 6°C to 3.5°C as fan speed increases)
      const approach = 7.0 - (speedFb / 50) * 3.5;
      const basinTemp = Number((wetBulb + approach + (Math.sin(this.tickCount * 0.1) * 0.1)).toFixed(1));
      this.registry.updatePoint(`${ctId}_BASIN_TEMP`, basinTemp, this.commQualityOverride || 'GOOD');
    } else {
      this.registry.updatePoint(`${ctId}_FAN_SPEED_FEEDBACK`, 0.0, this.commQualityOverride || 'GOOD');
      // Natural equilibrium towards ambient
      this.registry.updatePoint(`${ctId}_BASIN_TEMP`, Number((wetBulb + 6.5).toFixed(1)), this.commQualityOverride || 'GOOD');
    }
  }

  private simulateChiller(chId: string): void {
    const isTripped = this.injectedFaults.get(chId) === 'TRIP';
    const enableCmd = Boolean(this.registry.getPoint(`${chId}_ENABLE_CMD`)?.value);
    const tempSp = Number(this.registry.getPoint(`${chId}_CHW_TEMP_SP`)?.value || 6.7);

    // Hard trip interlock
    if (isTripped) {
      this.registry.updatePoint(`${chId}_FAULT_ALARM`, true);
      this.registry.updatePoint(`${chId}_STATUS`, false);
      this.registry.updatePoint(`${chId}_PERCENT_FLA`, 0.0);
      this.registry.updatePoint(`${chId}_ACTIVE_POWER`, 0.0);
      this.registry.updatePoint(`${chId}_COP`, 0.0);
      this.registry.updatePoint(`${chId}_CHW_FLOW`, 0.0);
      return;
    }

    this.registry.updatePoint(`${chId}_STATUS`, enableCmd, this.commQualityOverride || 'GOOD');

    if (enableCmd) {
      // Flow established from pumps
      const flow = Number((63.5 + Math.sin(this.tickCount * 0.1) * 0.5).toFixed(1));
      this.registry.updatePoint(`${chId}_CHW_FLOW`, flow, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_EVAP_DP`, 58.2, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_COND_DP`, 64.0, this.commQualityOverride || 'GOOD');

      // Supply temp tracks setpoint
      const supplyTemp = Number((tempSp + Math.sin(this.tickCount * 0.2) * 0.15).toFixed(1));
      const returnTemp = Number((supplyTemp + 5.3 + (Math.sin(this.tickCount * 0.15) * 0.2)).toFixed(1));
      this.registry.updatePoint(`${chId}_CHW_SUPPLY_TEMP`, supplyTemp, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_CHW_RETURN_TEMP`, returnTemp, this.commQualityOverride || 'GOOD');

      // Condenser water from cooling tower
      const ctBasin = Number(this.registry.getPoint('CT01_BASIN_TEMP')?.value || 29.5);
      const cwEntering = Number((ctBasin + 0.3).toFixed(1));
      const cwLeaving = Number((cwEntering + 5.1).toFixed(1));
      this.registry.updatePoint(`${chId}_CW_ENTERING_TEMP`, cwEntering, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_CW_LEAVING_TEMP`, cwLeaving, this.commQualityOverride || 'GOOD');

      // FLA and Power
      const fla = Number((76.5 + Math.sin(this.tickCount * 0.25) * 2.0).toFixed(1));
      const powerKw = Number((280 + Math.sin(this.tickCount * 0.25) * 8.0).toFixed(1));
      const cop = Number((5.55 + Math.sin(this.tickCount * 0.1) * 0.1).toFixed(2));
      this.registry.updatePoint(`${chId}_PERCENT_FLA`, fla, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_ACTIVE_POWER`, powerKw, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_COP`, cop, this.commQualityOverride || 'GOOD');
    } else {
      this.registry.updatePoint(`${chId}_CHW_FLOW`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_PERCENT_FLA`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_ACTIVE_POWER`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_COP`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_CHW_SUPPLY_TEMP`, 24.5, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${chId}_CHW_RETURN_TEMP`, 24.5, this.commQualityOverride || 'GOOD');
    }
  }

  private simulateAhu(ahuId: string, outdoorTemp: number): void {
    const fanCmd = Boolean(this.registry.getPoint(`${ahuId}_FAN_COMMAND`)?.value);
    const fanSpeedCmd = Number(this.registry.getPoint(`${ahuId}_FAN_SPEED_CMD`)?.value || 45.0);
    const valveCmd = Number(this.registry.getPoint(`${ahuId}_CHW_VALVE_CMD`)?.value || 58.0);
    const satSp = Number(this.registry.getPoint(`${ahuId}_SAT_SP`)?.value || 14.5);

    this.registry.updatePoint(`${ahuId}_FAN_STATUS`, fanCmd, this.commQualityOverride || 'GOOD');

    if (fanCmd) {
      this.registry.updatePoint(`${ahuId}_FAN_SPEED_FEEDBACK`, fanSpeedCmd, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${ahuId}_CHW_VALVE_POS`, valveCmd, this.commQualityOverride || 'GOOD');

      // Supply Air Temp converges to Setpoint via valve modulation
      const sat = Number((satSp + Math.sin(this.tickCount * 0.15) * 0.2).toFixed(1));
      const rat = Number((23.2 + Math.sin(this.tickCount * 0.1) * 0.3).toFixed(1));
      this.registry.updatePoint(`${ahuId}_SAT`, sat, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${ahuId}_RAT`, rat, this.commQualityOverride || 'GOOD');

      const staticPress = Number((280 + Math.sin(this.tickCount * 0.4) * 5.0).toFixed(1));
      this.registry.updatePoint(`${ahuId}_STATIC_PRESS`, staticPress, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${ahuId}_AIRFLOW`, 4850, this.commQualityOverride || 'GOOD');

      // Filter DP Check (AHU03 has elevated filter unless cleared)
      if (this.injectedFaults.get(ahuId) === 'FILTER_CLOGGED') {
        this.registry.updatePoint(`${ahuId}_FILTER_DP`, 168.0, this.commQualityOverride || 'GOOD');
      }
    } else {
      this.registry.updatePoint(`${ahuId}_FAN_SPEED_FEEDBACK`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${ahuId}_STATIC_PRESS`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${ahuId}_AIRFLOW`, 0.0, this.commQualityOverride || 'GOOD');
      this.registry.updatePoint(`${ahuId}_SAT`, Number((outdoorTemp - 3.0).toFixed(1)), this.commQualityOverride || 'GOOD');
    }
  }

  private simulateFcu(fcuId: string, outdoorTemp: number): void {
    const cmd = Boolean(this.registry.getPoint(`${fcuId}_FAN_COMMAND`)?.value);
    const sp = Number(this.registry.getPoint(`${fcuId}_TEMP_SP`)?.value || 23.0);
    const currentTemp = Number(this.registry.getPoint(`${fcuId}_ROOM_TEMP`)?.value || sp);

    this.registry.updatePoint(`${fcuId}_FAN_STATUS`, cmd, this.commQualityOverride || 'GOOD');

    if (cmd) {
      // Room temp smoothly settles towards setpoint (+- 0.2°C)
      const diff = sp - currentTemp;
      const step = diff * 0.1 + (Math.sin(this.tickCount * 0.2) * 0.05);
      const newTemp = Number((currentTemp + step).toFixed(1));
      this.registry.updatePoint(`${fcuId}_ROOM_TEMP`, newTemp, this.commQualityOverride || 'GOOD');
    } else {
      // Passive thermal drift towards ambient
      const drift = (outdoorTemp - currentTemp) * 0.02;
      const newTemp = Number((currentTemp + drift).toFixed(1));
      this.registry.updatePoint(`${fcuId}_ROOM_TEMP`, newTemp, this.commQualityOverride || 'GOOD');
    }
  }
}
