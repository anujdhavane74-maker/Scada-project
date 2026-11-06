/**
 * Internal Simulation Protocol Adapter
 * Active driver for Milestone 01. Connects presentation components to the PointRegistry.
 */

import { IProtocolAdapter, ProtocolConnectionStatus, PointWriteRequest, PointWriteResponse } from '../../types/protocol';
import { PointModel } from '../../types/domain';
import { PointRegistry } from '../pointRegistry';
import { CommandValidator } from '../commandValidator';
import { EventLogger } from '../eventLogger';

export class SimulatorAdapter implements IProtocolAdapter {
  public readonly protocol = 'SIMULATOR';
  public readonly name = 'Internal High-Fidelity Physics Simulator';

  private registry: PointRegistry;
  private logger: EventLogger;
  private isConnected: boolean = true;
  private packetsRx: number = 0;
  private packetsTx: number = 0;
  private listeners: Set<(point: PointModel) => void> = new Set();
  private statusListeners: Set<(status: ProtocolConnectionStatus) => void> = new Set();

  constructor(registry?: PointRegistry, logger?: EventLogger) {
    this.registry = registry || PointRegistry.getInstance();
    this.logger = logger || EventLogger.getInstance();
  }

  public async initialize(): Promise<void> {
    this.isConnected = true;
    this.registry.subscribe((point) => {
      this.packetsRx++;
      for (const listener of this.listeners) {
        listener(point);
      }
    });
    this.notifyStatus();
  }

  public async shutdown(): Promise<void> {
    this.isConnected = false;
    this.notifyStatus();
  }

  public getConnectionStatus(): ProtocolConnectionStatus {
    return {
      protocol: 'SIMULATOR',
      isConnected: this.isConnected,
      endpoint: 'sim://yerwada-building.local/engine',
      lastHeartbeat: new Date().toISOString(),
      latencyMs: 1.2,
      packetsReceived: this.packetsRx,
      packetsSent: this.packetsTx,
      errorCount: 0,
      quality: 'GOOD',
    };
  }

  public async readPoint(pointId: string): Promise<PointModel> {
    this.packetsRx++;
    const pt = this.registry.getPoint(pointId);
    if (!pt) {
      throw new Error(`Point [${pointId}] not found in PointRegistry.`);
    }
    return pt;
  }

  public async writePoint(request: PointWriteRequest): Promise<PointWriteResponse> {
    this.packetsTx++;
    const targetPoint = this.registry.getPoint(request.pointId);
    if (!targetPoint) {
      return {
        success: false,
        pointId: request.pointId,
        appliedValue: request.value,
        timestamp: new Date().toISOString(),
        error: `Point [${request.pointId}] does not exist in registry.`,
      };
    }

    // Safety and Interlock Validation
    const validation = CommandValidator.validateCommand(
      targetPoint,
      request.value,
      (id) => this.registry.getPoint(id)
    );

    if (!validation.isValid) {
      this.logger.logCommand({
        pointId: request.pointId,
        equipmentId: targetPoint.equipmentId,
        previousValue: targetPoint.value,
        requestedValue: request.value,
        operator: request.operatorId,
        status: 'REJECTED',
        rejectionReason: validation.rejectionReason,
      });

      return {
        success: false,
        pointId: request.pointId,
        appliedValue: targetPoint.value,
        timestamp: new Date().toISOString(),
        error: validation.rejectionReason,
      };
    }

    // Apply validated value to registry
    const finalVal = validation.sanitizedValue !== undefined ? validation.sanitizedValue : request.value;
    this.registry.updatePoint(request.pointId, finalVal, 'GOOD');

    this.logger.logCommand({
      pointId: request.pointId,
      equipmentId: targetPoint.equipmentId,
      previousValue: targetPoint.value,
      requestedValue: finalVal,
      operator: request.operatorId,
      status: 'ACCEPTED',
    });

    return {
      success: true,
      pointId: request.pointId,
      appliedValue: finalVal,
      timestamp: new Date().toISOString(),
    };
  }

  public async pollAllPoints(): Promise<PointModel[]> {
    this.packetsRx += this.registry.getAllPoints().length;
    return this.registry.getAllPoints();
  }

  public onPointUpdate(callback: (point: PointModel) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public onConnectionChange(callback: (status: ProtocolConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus(): void {
    const s = this.getConnectionStatus();
    for (const l of this.statusListeners) l(s);
  }
}
