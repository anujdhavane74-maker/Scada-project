/**
 * BMS Event & Command Audit Logger
 * Maintains non-repudiation audit trails of all operator setpoint changes,
 * start/stop commands, safety interlocks, and system state transitions.
 */

import { CommandAuditRecord } from '../types/domain';

export class EventLogger {
  private static instance: EventLogger;
  private logs: CommandAuditRecord[] = [];
  private listeners: Set<(logs: CommandAuditRecord[]) => void> = new Set();

  private constructor() {}

  public static getInstance(): EventLogger {
    if (!EventLogger.instance) {
      EventLogger.instance = new EventLogger();
    }
    return EventLogger.instance;
  }

  public logCommand(record: Omit<CommandAuditRecord, 'id' | 'timestamp'>): CommandAuditRecord {
    const fullRecord: CommandAuditRecord = {
      ...record,
      id: `CMD_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(fullRecord);
    if (this.logs.length > 500) {
      this.logs.pop();
    }

    this.notify();
    return fullRecord;
  }

  public getRecentLogs(limit: number = 50): CommandAuditRecord[] {
    return this.logs.slice(0, limit);
  }

  public subscribe(listener: (logs: CommandAuditRecord[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const slice = this.getRecentLogs();
    for (const listener of this.listeners) {
      listener(slice);
    }
  }
}
