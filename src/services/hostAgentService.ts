/**
 * Host Agent Service (Backward-Compatibility Bridge to LocalDeviceConnectionService)
 *
 * Preserves existing API and types for Milestone 01 tests and components
 * while leveraging the new secure cross-platform LocalDeviceConnectionService.
 */

import {
  LocalDeviceConnectionService,
  HostMetrics,
  HostAgentPayload,
  LocalDeviceState,
  ConnectionStatus,
} from './localDeviceConnectionService';

export type { HostMetrics, HostAgentPayload, ConnectionStatus };

export interface HostAgentState {
  isOnline: boolean;
  lastPollTimestamp: string | null;
  metrics: HostMetrics | null;
  agentInfo: HostAgentPayload['agent'] | null;
  errorMessage: string | null;
  pollIntervalMs: number;
  status?: ConnectionStatus;
  deviceId?: string;
  deviceName?: string;
  osName?: string;
  diagnosticHint?: string | null;
}

export type HostAgentListener = (state: HostAgentState) => void;

export class HostAgentService {
  private static instance: HostAgentService;
  private localDeviceService: LocalDeviceConnectionService;
  private listeners: Set<HostAgentListener> = new Set();

  private constructor() {
    this.localDeviceService = LocalDeviceConnectionService.getInstance();
    this.localDeviceService.subscribe((ldState) => {
      this.notify(ldState);
    });
  }

  public static getInstance(): HostAgentService {
    if (!HostAgentService.instance) {
      HostAgentService.instance = new HostAgentService();
    }
    return HostAgentService.instance;
  }

  public start(): void {
    const token = this.localDeviceService.getStoredToken();
    if (token) {
      this.localDeviceService.connect(token, true);
    } else {
      this.localDeviceService.startPolling();
    }
  }

  public stop(): void {
    this.localDeviceService.stopPolling();
  }

  public getState(): HostAgentState {
    const s = this.localDeviceService.getState();
    return {
      isOnline: s.isOnline,
      lastPollTimestamp: s.lastPollTimestamp,
      metrics: s.metrics,
      agentInfo: s.agentInfo,
      errorMessage: s.errorMessage,
      pollIntervalMs: s.pollIntervalMs,
      status: s.status,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      osName: s.osName,
      diagnosticHint: s.diagnosticHint,
    };
  }

  public async pollNow(): Promise<void> {
    return this.localDeviceService.pollNow();
  }

  public async connect(token: string, remember: boolean = true) {
    return this.localDeviceService.connect(token, remember);
  }

  public disconnect(clearStored: boolean = false): void {
    this.localDeviceService.disconnect(clearStored);
  }

  public subscribe(listener: HostAgentListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(s: LocalDeviceState): void {
    const mappedState: HostAgentState = {
      isOnline: s.isOnline,
      lastPollTimestamp: s.lastPollTimestamp,
      metrics: s.metrics,
      agentInfo: s.agentInfo,
      errorMessage: s.errorMessage,
      pollIntervalMs: s.pollIntervalMs,
      status: s.status,
      deviceId: s.deviceId,
      deviceName: s.deviceName,
      osName: s.osName,
      diagnosticHint: s.diagnosticHint,
    };

    for (const l of this.listeners) {
      try {
        l(mappedState);
      } catch (e) {
        console.error('Error in HostAgent listener:', e);
      }
    }
  }
}
