/**
 * Protocol Adapter Architecture Interfaces
 * Provides clean abstractions for future BACnet/IP, Modbus TCP, and MQTT adapters.
 */

import { PointModel, QualityCode } from './domain';

export type ProtocolType = 'SIMULATOR' | 'BACNET_IP' | 'MODBUS_TCP';

export interface ProtocolConnectionStatus {
  protocol: ProtocolType;
  isConnected: boolean;
  endpoint: string;
  lastHeartbeat: string;
  latencyMs: number;
  packetsReceived: number;
  packetsSent: number;
  errorCount: number;
  quality: QualityCode;
}

export interface PointWriteRequest {
  pointId: string;
  value: number | boolean | string;
  priority?: number; // BACnet 16-level priority array (default 8: Manual Operator)
  operatorId: string;
}

export interface PointWriteResponse {
  success: boolean;
  pointId: string;
  appliedValue: number | boolean | string | null;
  timestamp: string;
  error?: string;
}

export interface IProtocolAdapter {
  readonly protocol: ProtocolType;
  readonly name: string;

  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getConnectionStatus(): ProtocolConnectionStatus;

  readPoint(pointId: string): Promise<PointModel>;
  writePoint(request: PointWriteRequest): Promise<PointWriteResponse>;
  pollAllPoints(): Promise<PointModel[]>;

  onPointUpdate(callback: (point: PointModel) => void): () => void;
  onConnectionChange(callback: (status: ProtocolConnectionStatus) => void): () => void;
}

// BACnet/IP Specific Adapter Interface (Standard 135)
export interface IBACnetAdapter extends IProtocolAdapter {
  protocol: 'BACNET_IP';
  deviceInstance: number;
  networkNumber: number;
  macAddress: string;
  whoIs(): Promise<{ deviceId: number; ipAddress: string }[]>;
  readPropertyMultiple(objectId: string, propertyIds: number[]): Promise<Record<number, unknown>>;
  writeProperty(objectId: string, propertyId: number, value: unknown, priority?: number): Promise<boolean>;
}

// Modbus TCP Specific Adapter Interface
export interface IModbusAdapter extends IProtocolAdapter {
  protocol: 'MODBUS_TCP';
  host: string;
  port: number;
  unitId: number;
  readHoldingRegisters(address: number, count: number): Promise<number[]>;
  writeHoldingRegister(address: number, value: number): Promise<boolean>;
  readCoils(address: number, count: number): Promise<boolean[]>;
  writeCoil(address: number, state: boolean): Promise<boolean>;
}
