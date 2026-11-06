/**
 * Yerwada Smart Building - BMS Domain Layer Types
 * Standards compliant: ANSI/ASHRAE Standard 135 (BACnet), ISO 16484-5 (BACS)
 */

export type EquipmentType =
  | 'CHILLER'
  | 'AHU'
  | 'FCU'
  | 'PUMP'
  | 'COOLING_TOWER'
  | 'TEMPERATURE_SENSOR'
  | 'HUMIDITY_SENSOR'
  | 'FLOW_METER'
  | 'POWER_METER'
  | 'IT_EQUIPMENT';

export type EquipmentOperatingState =
  | 'STOPPED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'FAULT'
  | 'TRIPPED'
  | 'MAINTENANCE'
  | 'OFFLINE';

export type PointType =
  | 'AI'  // Analog Input (Sensor measurement: temperature, humidity, pressure, power)
  | 'AO'  // Analog Output (Command setpoint: valve %, VFD Hz, setpoint temp)
  | 'BI'  // Binary Input (Digital feedback: run status, trip, filter dp switch)
  | 'BO'; // Binary Output (Digital command: start/stop, enable/disable)

export type EngineeringUnit =
  | '°C'
  | '°F'
  | '%'
  | 'Pa'
  | 'kPa'
  | 'bar'
  | 'Hz'
  | 'kW'
  | 'kWh'
  | 'L/s'
  | 'm³/h'
  | 'TR'      // Tons of Refrigeration
  | 'COP'     // Coefficient of Performance
  | 'rpm'
  | 'A'       // Amperes
  | 'V'       // Volts
  | 'hrs'
  | 'ppm'
  | 'none';

export type QualityCode =
  | 'GOOD'
  | 'UNCERTAIN'
  | 'BAD'
  | 'TIMEOUT';

export type AlarmSeverity =
  | 'CRITICAL'   // Immediate danger to equipment or life-safety
  | 'WARNING'    // Out of normal operating envelope
  | 'INFO';      // State change or maintenance advisory

export type AlarmStatus =
  | 'ACTIVE_UNACKNOWLEDGED'
  | 'ACTIVE_ACKNOWLEDGED'
  | 'CLEARED_UNACKNOWLEDGED'
  | 'CLEARED_ACKNOWLEDGED';

export interface AlarmThresholds {
  lowLow?: number;   // Critical Low (e.g. freeze stat)
  low?: number;      // Low Warning
  high?: number;     // High Warning
  highHigh?: number; // Critical High (e.g. high pressure trip)
  deadband?: number; // Hysteresis prevent chatter
}

export interface PointModel<T = number | boolean | string | null> {
  id: string;               // e.g. "AHU01_SAT"
  equipmentId: string;      // e.g. "AHU01"
  name: string;             // e.g. "Supply Air Temperature"
  type: PointType;          // AI, AO, BI, BO
  value: T;                 // Current value
  unit: EngineeringUnit;    // Engineering unit
  min: number;              // Physical/logical min
  max: number;              // Physical/logical max
  timestamp: string;        // ISO 8601 timestamp
  quality: QualityCode;     // GOOD, UNCERTAIN, BAD, TIMEOUT
  isWritable: boolean;      // True for AO and BO
  alarmThresholds?: AlarmThresholds;
  description: string;
  category: 'TELEMETRY' | 'COMMAND' | 'FEEDBACK' | 'SETPOINT' | 'ALARM_POINT';
  // Engineering rule: Distinguish actual feedback from requested commands
  feedbackPointId?: string; // If this is a command point, what is its physical feedback point
  commandPointId?: string;  // If this is a feedback point, what command controls it
}

export interface EquipmentModel {
  id: string;                      // e.g. "CH01"
  name: string;                    // e.g. "Water-Cooled Centrifugal Chiller 1"
  type: EquipmentType;
  location: {
    floor: string;                 // e.g. "Basement Level 1"
    zone: string;                  // e.g. "Central Plant Room B1"
    building: string;              // "Yerwada Smart Building"
  };
  designCapacity?: string;         // e.g. "500 TR / 1758 kW"
  operatingState: EquipmentOperatingState;
  communicationQuality: QualityCode;
  runHours: number;
  maintenanceIntervalHours: number;
  associatedPointIds: string[];    // All points tied to this equipment
  parentEquipmentId?: string;      // Hierarchy: e.g. FCU -> AHU or Pump -> Chiller Plant
  integrationType?: 'SIMULATED' | 'LOCAL_HOST_AGENT';
  metadata: {
    manufacturer?: string;
    modelNumber?: string;
    commissionDate?: string;
    protocolAddress?: string;     // e.g. "BACnet Dev 1001" or "Modbus ID 1, Reg 40001"
  };
}

export interface BuildingHierarchyNode {
  id: string;
  name: string;
  type: 'SITE' | 'BUILDING' | 'FLOOR' | 'SYSTEM' | 'EQUIPMENT';
  children?: BuildingHierarchyNode[];
  equipmentId?: string;
}

export interface AlarmEvent {
  id: string;
  pointId: string;
  equipmentId: string;
  pointName: string;
  severity: AlarmSeverity;
  status: AlarmStatus;
  message: string;
  triggerValue: number | boolean | string | null;
  triggerLimit?: number;
  timestamp: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  clearedAt?: string;
}

export interface CommandAuditRecord {
  id: string;
  timestamp: string;
  pointId: string;
  equipmentId: string;
  previousValue: number | boolean | string | null;
  requestedValue: number | boolean | string | null;
  operator: string;
  status: 'ACCEPTED' | 'REJECTED' | 'EXECUTING' | 'VERIFIED' | 'MISMATCH_FAULT';
  rejectionReason?: string;
}
