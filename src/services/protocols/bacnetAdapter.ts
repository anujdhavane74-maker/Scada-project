/**
 * BACnet/IP Protocol Adapter Interface Implementation
 * Designed for ANSI/ASHRAE Standard 135-2020 BACnet/IP Integration.
 *
 * Note: Milestone 01 establishes this typed adapter interface with clean protocol stubs.
 * Real network UDP port 47808 sockets are prepared for future hardware commissioning milestones.
 */

import { IBACnetAdapter, ProtocolConnectionStatus, PointWriteRequest, PointWriteResponse } from '../../types/protocol';
import { PointModel } from '../../types/domain';

export class BACnetIPAdapter implements IBACnetAdapter {
  public readonly protocol = 'BACNET_IP';
  public readonly name = 'BACnet/IP ISO 16484-5 Adapter';

  public readonly deviceInstance: number = 384001;
  public readonly networkNumber: number = 1001;
  public readonly macAddress: string = '192.168.100.10:47808';

  private isConnected: boolean = false;
  private listeners: Set<(point: PointModel) => void> = new Set();
  private statusListeners: Set<(status: ProtocolConnectionStatus) => void> = new Set();

  public async initialize(): Promise<void> {
    // Protocol interface initialization stub
    this.isConnected = true;
    this.notifyStatus();
  }

  public async shutdown(): Promise<void> {
    this.isConnected = false;
    this.notifyStatus();
  }

  public getConnectionStatus(): ProtocolConnectionStatus {
    return {
      protocol: 'BACNET_IP',
      isConnected: this.isConnected,
      endpoint: this.macAddress,
      lastHeartbeat: new Date().toISOString(),
      latencyMs: 12,
      packetsReceived: 0,
      packetsSent: 0,
      errorCount: 0,
      quality: this.isConnected ? 'GOOD' : 'TIMEOUT',
    };
  }

  public async readPoint(pointId: string): Promise<PointModel> {
    throw new Error(`BACnet/IP readProperty for ${pointId} requires physical BMS network controller binding.`);
  }

  public async writePoint(request: PointWriteRequest): Promise<PointWriteResponse> {
    return {
      success: false,
      pointId: request.pointId,
      appliedValue: request.value,
      timestamp: new Date().toISOString(),
      error: 'BACnet/IP writeProperty requires Milestone 02 hardware driver activation.',
    };
  }

  public async pollAllPoints(): Promise<PointModel[]> {
    return [];
  }

  public async whoIs(): Promise<{ deviceId: number; ipAddress: string }[]> {
    return [
      { deviceId: 1001, ipAddress: '192.168.100.11:47808' },
      { deviceId: 1002, ipAddress: '192.168.100.12:47808' },
      { deviceId: 2001, ipAddress: '192.168.100.21:47808' },
    ];
  }

  public async readPropertyMultiple(objectId: string, _propertyIds: number[]): Promise<Record<number, unknown>> {
    return { 85: `Simulated ReadProp for ${objectId}` };
  }

  public async writeProperty(_objectId: string, _propertyId: number, _value: unknown, _priority?: number): Promise<boolean> {
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
