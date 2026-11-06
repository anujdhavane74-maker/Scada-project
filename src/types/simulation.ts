/**
 * Simulation Engine Types & Scenarios
 */

import { QualityCode } from './domain';

export type SimulationSpeed = 1 | 2 | 5 | 10;

export interface WeatherCondition {
  outdoorAirTemp: number;     // °C (Yerwada, Pune baseline 22°C - 38°C)
  outdoorAirHumidity: number; // % (25% dry season to 85% monsoon)
  wetBulbTemp: number;        // °C (cooling tower baseline limit)
  solarIrradiance: number;    // W/m² (0 at night to 950 at midday)
  windSpeed: number;          // m/s
  ambientConditionsLabel: string;
}

export type ScenarioPresetId =
  | 'SCENARIO_NORMAL_COOLING'
  | 'SCENARIO_PEAK_SUMMER'
  | 'SCENARIO_MONSOON_HUMID'
  | 'SCENARIO_NIGHT_SETBACK'
  | 'SCENARIO_CHILLER_TRIP'
  | 'SCENARIO_AHU_FILTER_DIRTY'
  | 'SCENARIO_COMM_DEGRADED';

export interface SimulationScenario {
  id: ScenarioPresetId;
  name: string;
  description: string;
  weather: WeatherCondition;
  buildingOccupancyFactor: number; // 0.0 (empty) to 1.0 (full 2,500 people)
  initialFaults?: Array<{
    equipmentId: string;
    faultType: 'TRIP' | 'COMM_LOSS' | 'FILTER_CLOGGED' | 'SENSOR_DRIFT';
    description: string;
  }>;
}

export interface SimulationState {
  isRunning: boolean;
  speed: SimulationSpeed;
  tickCount: number;
  simulatedTime: string; // ISO timestamp
  timeStepSeconds: number;
  activeScenario: ScenarioPresetId;
  weather: WeatherCondition;
  injectedFaults: Map<string, string>; // equipmentId -> faultDescription
  communicationQualityOverride?: QualityCode;
}

export interface IBmsSimulator {
  start(): void;
  stop(): void;
  step(): void;
  setSpeed(speed: SimulationSpeed): void;
  loadScenario(scenarioId: ScenarioPresetId): void;
  injectFault(equipmentId: string, faultType: string): void;
  clearFault(equipmentId: string): void;
  setCommunicationQualityOverride(quality?: QualityCode): void;
  getState(): SimulationState;
  subscribe(callback: (state: SimulationState) => void): () => void;
}
