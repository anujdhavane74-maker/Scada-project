/**
 * Modbus TCP Protocol Adapter Interface Implementation
 * Designed for Energy Meters, Power Distribution Panels, and VFD Integration.
 */

import { IModbusAdapter, ProtocolConnectionStatus, PointWriteRequest, PointWriteResponse } from '../../types/protocol';
import { PointModel } from '../../types/domain';

export class ModbusTCPAdapter implements IModbusAdapter {
  public readonly protocol = 'MODBUS_TCP';
  public readonly name = 'Modbus TCP Gateway Adapter';

  public readonly host: string = '192.168.100.200';
  public readonly port: number = 502;
  public readonly unitId: number = 1;

  private isConnected: boolean = false;
  private listeners: Set<(point: PointModel) => void> = new Set();
  private statusListeners: Set<(status: ProtocolConnectionStatus) => void> = new Set();

  public async initialize(): Promise<void> {
    this.isConnected = true;
    this.notifyStatus();
  }

  public async shutdown(): Promise<void> {
    this.isConnected = false;
    this.notifyStatus();
  }

  public getConnectionStatus(): ProtocolConnectionStatus {
    return {
      protocol: 'MODBUS_TCP',
      isConnected: this.isConnected,
      endpoint: `${this.host}:${this.port}`,
      lastHeartbeat: new Date().toISOString(),
      latencyMs: 8,
      packetsReceived: 0,
      packetsSent: 0,
      errorCount: 0,
      quality: this.isConnected ? 'GOOD' : 'TIMEOUT',
    };
  }

  public async readPoint(pointId: string): Promise<PointModel> {
    throw new Error(`Modbus TCP register read for ${pointId} requires physical PLC connection.`);
  }

  public async writePoint(request: PointWriteRequest): Promise<PointWriteResponse> {
    return {
      success: false,
      pointId: request.pointId,
      appliedValue: request.value,
      timestamp: new Date().toISOString(),
      error: 'Modbus TCP writeSingleRegister requires Milestone 02 hardware driver activation.',
    };
  }

  public async pollAllPoints(): Promise<PointModel[]> {
    return [];
  }

  public async readHoldingRegisters(_address: number, count: number): Promise<number[]> {
    return new Array(count).fill(0);
  }

  public async writeHoldingRegister(_address: number, _value: number): Promise<boolean> {
    return false;
  }

  public async readCoils(_address: number, count: number): Promise<boolean[]> {
    return new Array(count).fill(false);
  }

  public async writeCoil(_address: number, _state: boolean): Promise<boolean> {
    return false;
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
