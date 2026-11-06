/**
 * Deterministic Test Scenarios & Presets
 */

import { SimulationScenario } from '../types/simulation';

export const SIMULATION_SCENARIOS: Record<string, SimulationScenario> = {
  SCENARIO_NORMAL_COOLING: {
    id: 'SCENARIO_NORMAL_COOLING',
    name: 'Normal Afternoon Cooling (Pune 32°C)',
    description: 'Baseline typical design condition. Chiller 01 running at 78% FLA, AHUs maintaining 14.5°C SAT.',
    weather: {
      outdoorAirTemp: 32.2,
      outdoorAirHumidity: 46.0,
      wetBulbTemp: 23.4,
      solarIrradiance: 740,
      windSpeed: 3.2,
      ambientConditionsLabel: 'Sunny & Warm',
    },
    buildingOccupancyFactor: 0.85,
  },

  SCENARIO_PEAK_SUMMER: {
    id: 'SCENARIO_PEAK_SUMMER',
    name: 'Peak Summer Heatwave (Pune 41°C)',
    description: 'High thermal stress test. Ambient temperature reaches 41°C. High cooling load across all five floors.',
    weather: {
      outdoorAirTemp: 41.2,
      outdoorAirHumidity: 28.0,
      wetBulbTemp: 26.8,
      solarIrradiance: 920,
      windSpeed: 4.5,
      ambientConditionsLabel: 'Extreme Heatwave',
    },
    buildingOccupancyFactor: 0.95,
  },

  SCENARIO_MONSOON_HUMID: {
    id: 'SCENARIO_MONSOON_HUMID',
    name: 'Monsoon High Humidity (84% RH)',
    description: 'Wet season condition. Chilled water cooling coils modulate for maximum latent dehumidification.',
    weather: {
      outdoorAirTemp: 28.5,
      outdoorAirHumidity: 84.0,
      wetBulbTemp: 26.2,
      solarIrradiance: 280,
      windSpeed: 5.1,
      ambientConditionsLabel: 'Humid Monsoon',
    },
    buildingOccupancyFactor: 0.70,
  },

  SCENARIO_NIGHT_SETBACK: {
    id: 'SCENARIO_NIGHT_SETBACK',
    name: 'Unoccupied Night Setback (22°C Night)',
    description: 'Off-peak energy conservation mode. Low cooling demand, chillers in staging setback.',
    weather: {
      outdoorAirTemp: 22.0,
      outdoorAirHumidity: 65.0,
      wetBulbTemp: 17.5,
      solarIrradiance: 0,
      windSpeed: 1.5,
      ambientConditionsLabel: 'Cool Night',
    },
    buildingOccupancyFactor: 0.05,
  },

  SCENARIO_CHILLER_TRIP: {
    id: 'SCENARIO_CHILLER_TRIP',
    name: 'Chiller CH01 VFD Overload Trip',
    description: 'Emergency test: Injects a high-pressure trip on Chiller 01. Tests operator warning and standby CH02 startup.',
    weather: {
      outdoorAirTemp: 34.0,
      outdoorAirHumidity: 45.0,
      wetBulbTemp: 24.1,
      solarIrradiance: 810,
      windSpeed: 2.8,
      ambientConditionsLabel: 'Sunny & Warm',
    },
    buildingOccupancyFactor: 0.85,
    initialFaults: [
      { equipmentId: 'CH01', faultType: 'TRIP', description: 'Compressor High Discharge Pressure Trip' },
    ],
  },

  SCENARIO_AHU_FILTER_DIRTY: {
    id: 'SCENARIO_AHU_FILTER_DIRTY',
    name: 'AHU-03 High Filter DP Warning',
    description: 'Maintenance alert test: AHU-03 filter pressure drop elevated to 165 Pa exceeding 140 Pa warning threshold.',
    weather: {
      outdoorAirTemp: 32.0,
      outdoorAirHumidity: 48.0,
      wetBulbTemp: 23.2,
      solarIrradiance: 700,
      windSpeed: 3.0,
      ambientConditionsLabel: 'Sunny & Warm',
    },
    buildingOccupancyFactor: 0.80,
    initialFaults: [
      { equipmentId: 'AHU03', faultType: 'FILTER_CLOGGED', description: 'Secondary Bag Filter Dust Loading DP > 165 Pa' },
    ],
  },

  SCENARIO_COMM_DEGRADED: {
    id: 'SCENARIO_COMM_DEGRADED',
    name: 'BACnet / Modbus Field Bus Packet Loss',
    description: 'Industrial comm failure simulation: Degrades communication quality from GOOD to UNCERTAIN/BAD on select nodes.',
    weather: {
      outdoorAirTemp: 31.5,
      outdoorAirHumidity: 50.0,
      wetBulbTemp: 23.0,
      solarIrradiance: 680,
      windSpeed: 2.5,
      ambientConditionsLabel: 'Sunny & Warm',
    },
    buildingOccupancyFactor: 0.80,
    initialFaults: [
      { equipmentId: 'FCU04', faultType: 'COMM_LOSS', description: 'BACnet MS/TP Token Pass Timeout on Subnet 2' },
      { equipmentId: 'FCU09', faultType: 'COMM_LOSS', description: 'RS485 Bus CRC Error' },
    ],
  },
};
