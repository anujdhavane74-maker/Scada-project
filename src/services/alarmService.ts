/**
 * Alarm Management Service
 * Detects out-of-spec limits, command/feedback mismatches, and safety trips.
 */

import { AlarmEvent, PointModel } from '../types/domain';
import { PointRegistry } from './pointRegistry';

export class AlarmService {
  private static instance: AlarmService;
  private activeAlarms: Map<string, AlarmEvent> = new Map();
  private alarmHistory: AlarmEvent[] = [];
  private listeners: Set<(alarms: AlarmEvent[]) => void> = new Set();
  private mismatchCounters: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): AlarmService {
    if (!AlarmService.instance) {
      AlarmService.instance = new AlarmService();
    }
    return AlarmService.instance;
  }

  public getActiveAlarms(): AlarmEvent[] {
    return Array.from(this.activeAlarms.values()).sort((a, b) => {
      // Critical first, then by timestamp descending
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  public getAlarmHistory(): AlarmEvent[] {
    return [...this.alarmHistory];
  }

  public getAlarmSummary() {
    const alarms = this.getActiveAlarms();
    return {
      total: alarms.length,
      critical: alarms.filter(a => a.severity === 'CRITICAL').length,
      warning: alarms.filter(a => a.severity === 'WARNING').length,
      unacknowledged: alarms.filter(a => a.status.includes('UNACKNOWLEDGED')).length,
    };
  }

  public acknowledgeAlarm(alarmId: string, operator: string = 'Operator (BMS-L3)'): boolean {
    const alarm = this.activeAlarms.get(alarmId);
    if (!alarm) return false;

    alarm.status = 'ACTIVE_ACKNOWLEDGED';
    alarm.acknowledgedAt = new Date().toISOString();
    alarm.acknowledgedBy = operator;

    this.notify();
    return true;
  }

  public acknowledgeAll(operator: string = 'Operator (BMS-L3)'): void {
    const now = new Date().toISOString();
    for (const alarm of this.activeAlarms.values()) {
      alarm.status = 'ACTIVE_ACKNOWLEDGED';
      alarm.acknowledgedAt = now;
      alarm.acknowledgedBy = operator;
    }
    this.notify();
  }

  /**
   * Evaluate a point and its potential alarm state
   */
  public evaluatePoint(point: PointModel, registry: PointRegistry): void {
    // 1. Digital alarm contacts (BI)
    if (point.category === 'ALARM_POINT') {
      const isAlarmActive = point.value === true || point.value === 1;
      const alarmKey = `ALM_${point.id}`;

      if (isAlarmActive) {
        if (!this.activeAlarms.has(alarmKey)) {
          this.raiseAlarm({
            id: alarmKey,
            pointId: point.id,
            equipmentId: point.equipmentId,
            pointName: point.name,
            severity: point.id.includes('FREEZE') || point.id.includes('FAULT') ? 'CRITICAL' : 'WARNING',
            status: 'ACTIVE_UNACKNOWLEDGED',
            message: `Safety alarm contact active: ${point.name}`,
            triggerValue: point.value,
            timestamp: point.timestamp,
          });
        }
      } else {
        if (this.activeAlarms.has(alarmKey)) {
          this.clearAlarm(alarmKey);
        }
      }
      return;
    }

    // 2. Analog threshold alarms (AI)
    if (point.type === 'AI' && point.alarmThresholds && typeof point.value === 'number') {
      const val = point.value;
      const t = point.alarmThresholds;
      const lowLowKey = `ALM_${point.id}_LL`;
      const highHighKey = `ALM_${point.id}_HH`;
      const lowKey = `ALM_${point.id}_L`;
      const highKey = `ALM_${point.id}_H`;

      // Check High-High (Critical)
      if (t.highHigh !== undefined && val >= t.highHigh) {
        if (!this.activeAlarms.has(highHighKey)) {
          this.raiseAlarm({
            id: highHighKey,
            pointId: point.id,
            equipmentId: point.equipmentId,
            pointName: point.name,
            severity: 'CRITICAL',
            status: 'ACTIVE_UNACKNOWLEDGED',
            message: `${point.name} EXCEEDED HIGH-HIGH LIMIT (${val} ${point.unit} >= ${t.highHigh} ${point.unit})`,
            triggerValue: val,
            triggerLimit: t.highHigh,
            timestamp: point.timestamp,
          });
        }
      } else if (this.activeAlarms.has(highHighKey)) {
        const deadband = t.deadband || 0;
        if (t.highHigh !== undefined && val < t.highHigh - deadband) {
          this.clearAlarm(highHighKey);
        }
      }

      // Check High (Warning)
      if (t.high !== undefined && (t.highHigh === undefined || val < t.highHigh)) {
        if (val >= t.high) {
          if (!this.activeAlarms.has(highKey)) {
            this.raiseAlarm({
              id: highKey,
              pointId: point.id,
              equipmentId: point.equipmentId,
              pointName: point.name,
              severity: 'WARNING',
              status: 'ACTIVE_UNACKNOWLEDGED',
              message: `${point.name} exceeded high threshold (${val} ${point.unit} >= ${t.high} ${point.unit})`,
              triggerValue: val,
              triggerLimit: t.high,
              timestamp: point.timestamp,
            });
          }
        } else if (this.activeAlarms.has(highKey)) {
          const deadband = t.deadband || 0;
          if (val < t.high - deadband) {
            this.clearAlarm(highKey);
          }
        }
      }

      // Check Low-Low (Critical)
      if (t.lowLow !== undefined && val <= t.lowLow) {
        if (!this.activeAlarms.has(lowLowKey)) {
          this.raiseAlarm({
            id: lowLowKey,
            pointId: point.id,
            equipmentId: point.equipmentId,
            pointName: point.name,
            severity: 'CRITICAL',
            status: 'ACTIVE_UNACKNOWLEDGED',
            message: `${point.name} DROPPED BELOW LOW-LOW LIMIT (${val} ${point.unit} <= ${t.lowLow} ${point.unit})`,
            triggerValue: val,
            triggerLimit: t.lowLow,
            timestamp: point.timestamp,
          });
        }
      } else if (this.activeAlarms.has(lowLowKey)) {
        const deadband = t.deadband || 0;
        if (t.lowLow !== undefined && val > t.lowLow + deadband) {
          this.clearAlarm(lowLowKey);
        }
      }

      // Check Low (Warning)
      if (t.low !== undefined && (t.lowLow === undefined || val > t.lowLow)) {
        if (val <= t.low) {
          if (!this.activeAlarms.has(lowKey)) {
            this.raiseAlarm({
              id: lowKey,
              pointId: point.id,
              equipmentId: point.equipmentId,
              pointName: point.name,
              severity: 'WARNING',
              status: 'ACTIVE_UNACKNOWLEDGED',
              message: `${point.name} dropped below low threshold (${val} ${point.unit} <= ${t.low} ${point.unit})`,
              triggerValue: val,
              triggerLimit: t.low,
              timestamp: point.timestamp,
            });
          }
        } else if (this.activeAlarms.has(lowKey)) {
          const deadband = t.deadband || 0;
          if (val > t.low + deadband) {
            this.clearAlarm(lowKey);
          }
        }
      }
    }

    // 3. Command vs Feedback Mismatch Detection
    if (point.category === 'COMMAND' && point.feedbackPointId) {
      const feedback = registry.getPoint(point.feedbackPointId);
      if (feedback) {
        const mismatchKey = `MISMATCH_${point.id}`;
        const cmdVal = Boolean(point.value);
        const fbVal = Boolean(feedback.value);

        if (cmdVal !== fbVal) {
          const currentCount = (this.mismatchCounters.get(mismatchKey) || 0) + 1;
          this.mismatchCounters.set(mismatchKey, currentCount);

          // If mismatch persists for 3 or more evaluations, raise mismatch alarm
          if (currentCount >= 3 && !this.activeAlarms.has(mismatchKey)) {
            this.raiseAlarm({
              id: mismatchKey,
              pointId: point.id,
              equipmentId: point.equipmentId,
              pointName: point.name,
              severity: 'CRITICAL',
              status: 'ACTIVE_UNACKNOWLEDGED',
              message: `COMMAND-FEEDBACK MISMATCH: ${point.name} requested [${cmdVal ? 'RUN' : 'STOP'}] but physical status [${fbVal ? 'RUN' : 'STOP'}] failed to respond.`,
              triggerValue: `${cmdVal} != ${fbVal}`,
              timestamp: point.timestamp,
            });
          }
        } else {
          this.mismatchCounters.delete(mismatchKey);
          if (this.activeAlarms.has(mismatchKey)) {
            this.clearAlarm(mismatchKey);
          }
        }
      }
    }
  }

  private raiseAlarm(alarm: AlarmEvent): void {
    this.activeAlarms.set(alarm.id, alarm);
    this.alarmHistory.unshift({ ...alarm });
    if (this.alarmHistory.length > 200) {
      this.alarmHistory.pop();
    }
    this.notify();
  }

  private clearAlarm(alarmId: string): void {
    const alarm = this.activeAlarms.get(alarmId);
    if (alarm) {
      alarm.status = 'CLEARED_ACKNOWLEDGED';
      alarm.clearedAt = new Date().toISOString();
      this.activeAlarms.delete(alarmId);
      this.notify();
    }
  }

  public subscribe(listener: (alarms: AlarmEvent[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const list = this.getActiveAlarms();
    for (const listener of this.listeners) {
      listener(list);
    }
  }
}
