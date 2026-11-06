/**
 * Local Device Connection Service (Milestone 02)
 *
 * Connects the browser session directly to the user's local hardware monitoring agent (127.0.0.1:8765).
 * - Enforces pairing token authentication
 * - Detects platform (macOS / Windows / Linux) and persistent device ID
 * - Session-isolated (never leaks telemetry across browser sessions)
 * - Detects browser Private Network Access / Mixed Content blocks and provides clear diagnostics
 */

import { PointRegistry } from './pointRegistry';
import { EquipmentService } from './equipmentService';

export interface HostMetrics {
  cpu_usage_percent: number;
  memory_usage_percent: number;
  memory_available_gb: number;
  memory_total_gb: number;
  battery_percent: number;
  is_charging: boolean;
  has_battery?: boolean;
  uptime_seconds: number;
  uptime_formatted: string;
  thermal_pressure_level: number;
  thermal_pressure_label: string;
  cpu_temp_c: number | null;
  cpu_temp_available: boolean;
  cpu_temp_reason: string;
}

export interface HostAgentPayload {
  device_id: string;
  device_name: string;
  device_type: string;
  os_name?: string;
  location: string;
  integration_type: string;
  online: boolean;
  timestamp: string;
  metrics: HostMetrics;
  points?: Record<string, any>;
  agent: {
    status: string;
    host: string;
    port: number;
    pid: number;
    python_version: string;
    auth_enabled?: boolean;
  };
}

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'PROBING'
  | 'AUTHENTICATING'
  | 'CONNECTED'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT';

export interface LocalDeviceState {
  status: ConnectionStatus;
  isOnline: boolean;
  deviceId: string;
  deviceName: string;
  osName: string;
  location: string;
  token: string | null;
  lastPollTimestamp: string | null;
  metrics: HostMetrics | null;
  agentInfo: HostAgentPayload['agent'] | null;
  errorMessage: string | null;
  diagnosticHint: string | null;
  pollIntervalMs: number;
}

export type LocalDeviceListener = (state: LocalDeviceState) => void;

const STORAGE_KEY_TOKEN = 'yerwada_bms_agent_token';
const STORAGE_KEY_URL = 'yerwada_bms_agent_url';

export class LocalDeviceConnectionService {
  private static instance: LocalDeviceConnectionService;
  private endpointUrl: string = 'http://127.0.0.1:8765';
  private pollIntervalMs: number = 2000;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private registry: PointRegistry;
  private equipmentService: EquipmentService;

  private state: LocalDeviceState = {
    status: 'DISCONNECTED',
    isOnline: false,
    deviceId: 'IT-MAC-001',
    deviceName: 'Local Host Workstation',
    osName: 'Unknown OS',
    location: 'Monitoring Lab',
    token: null,
    lastPollTimestamp: null,
    metrics: null,
    agentInfo: null,
    errorMessage: null,
    diagnosticHint: null,
    pollIntervalMs: 2000,
  };

  private listeners: Set<LocalDeviceListener> = new Set();

  private constructor() {
    this.registry = PointRegistry.getInstance();
    this.equipmentService = EquipmentService.getInstance();

    // Check for saved token in localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const savedUrl = localStorage.getItem(STORAGE_KEY_URL);
      if (savedUrl) this.endpointUrl = savedUrl;
      if (savedToken) {
        this.state.token = savedToken;
      }
    }
  }

  public static getInstance(): LocalDeviceConnectionService {
    if (!LocalDeviceConnectionService.instance) {
      LocalDeviceConnectionService.instance = new LocalDeviceConnectionService();
    }
    return LocalDeviceConnectionService.instance;
  }

  public getStoredToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(STORAGE_KEY_TOKEN);
    }
    return null;
  }

  public setEndpointUrl(url: string): void {
    this.endpointUrl = url.trim().replace(/\/+$/, '');
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_URL, this.endpointUrl);
    }
  }

  public getEndpointUrl(): string {
    return this.endpointUrl;
  }

  public async connect(
    token: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string; diagnostic?: string }> {
    const cleanToken = token.trim();
    if (!cleanToken) {
      return { success: false, error: 'Pairing token is required.' };
    }

    this.state = {
      ...this.state,
      status: 'AUTHENTICATING',
      errorMessage: null,
      diagnosticHint: null,
    };
    this.notify();

    try {
      // 1. Verify token with agent endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${this.endpointUrl}/auth/verify`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Agent-Token': cleanToken,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        this.state = {
          ...this.state,
          status: 'AUTH_FAILED',
          isOnline: false,
          errorMessage: 'Authentication failed: Invalid local pairing token.',
          diagnosticHint: 'Check the token printed in your terminal or in agent/pairing_token.txt.',
        };
        this.notify();
        return { success: false, error: this.state.errorMessage || 'Authentication failed' };
      }

      if (!res.ok) {
        throw new Error(`Agent returned HTTP status ${res.status}: ${res.statusText}`);
      }

      const verifyData = await res.json();

      // Successfully authenticated
      this.state.token = cleanToken;
      if (remember && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY_TOKEN, cleanToken);
      }

      if (verifyData.device_id) this.state.deviceId = verifyData.device_id;
      if (verifyData.device_name) this.state.deviceName = verifyData.device_name;
      if (verifyData.os_name) this.state.osName = verifyData.os_name;

      // Start periodic telemetry polling
      this.startPolling();
      await this.pollNow();

      return { success: true };
    } catch (err: unknown) {
      const errMessage = (err as Error).message || 'Failed to connect to local agent';
      const diagnostic = this.analyzeNetworkError(err as Error);

      this.state = {
        ...this.state,
        status: 'NETWORK_ERROR',
        isOnline: false,
        errorMessage: errMessage,
        diagnosticHint: diagnostic,
      };
      this.notify();
      return { success: false, error: errMessage, diagnostic };
    }
  }

  public disconnect(clearStored: boolean = false): void {
    this.stopPolling();

    if (clearStored && typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }

    const now = new Date().toISOString();

    this.state = {
      ...this.state,
      status: 'DISCONNECTED',
      isOnline: false,
      token: clearStored ? null : this.state.token,
      errorMessage: null,
      diagnosticHint: null,
      lastPollTimestamp: now,
    };

    // Update point registry to indicate agent is offline
    this.registry.updatePoint('MAC01_DEVICE_ONLINE', false, 'GOOD', now);
    this.degradeTelemetryPoints(now, 'TIMEOUT');
    this.equipmentService.setEquipmentState('IT-MAC-001', 'OFFLINE', 'TIMEOUT');
    if (this.state.deviceId !== 'IT-MAC-001') {
      this.equipmentService.setEquipmentState(this.state.deviceId, 'OFFLINE', 'TIMEOUT');
    }

    this.notify();
  }

  public startPolling(): void {
    if (this.timerId) return;
    this.pollNow();
    this.timerId = setInterval(() => this.pollNow(), this.pollIntervalMs);
  }

  public stopPolling(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public async pollNow(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const headers: Record<string, string> = { Accept: 'application/json' };
      if (this.state.token) {
        headers['X-Agent-Token'] = this.state.token;
      }

      const res = await fetch(`${this.endpointUrl}/metrics`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 401 || res.status === 403) {
        this.handleFailure('Pairing token rejected by agent (HTTP 401).', 'AUTH_FAILED');
        return;
      }

      if (!res.ok) {
        throw new Error(`Agent HTTP Error ${res.status}: ${res.statusText}`);
      }

      const data: HostAgentPayload = await res.json();
      this.handleSuccess(data);
    } catch (err: unknown) {
      this.handleFailure((err as Error).message || 'Connection refused on 127.0.0.1:8765', 'TIMEOUT');
    }
  }

  public async probeAgent(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const res = await fetch(`${this.endpointUrl}/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const hData = await res.json();
        if (hData.device_id) this.state.deviceId = hData.device_id;
        if (hData.device_name) this.state.deviceName = hData.device_name;
        if (hData.os_name) this.state.osName = hData.os_name;

        // Found agent, awaiting pairing token
        this.state = {
          ...this.state,
          status: 'DISCONNECTED',
          errorMessage: 'Local agent detected on 127.0.0.1:8765. Pairing token required.',
        };
        this.notify();
      }
    } catch {
      // Agent not running or unreachable
    }
  }

  private handleSuccess(data: HostAgentPayload): void {
    const now = new Date().toISOString();
    const m = data.metrics;

    this.state = {
      ...this.state,
      status: 'CONNECTED',
      isOnline: true,
      deviceId: data.device_id || this.state.deviceId,
      deviceName: data.device_name || this.state.deviceName,
      osName: data.os_name || this.state.osName,
      location: data.location || 'Monitoring Lab',
      lastPollTimestamp: now,
      metrics: m,
      agentInfo: data.agent,
      errorMessage: null,
      diagnosticHint: null,
    };

    // 1. Inject live host telemetry into PointRegistry for standard points
    this.registry.updatePoint('MAC01_CPU_USAGE', m.cpu_usage_percent, 'GOOD', now);
    this.registry.updatePoint('MAC01_MEMORY_USAGE', m.memory_usage_percent, 'GOOD', now);
    this.registry.updatePoint('MAC01_BATTERY_LEVEL', m.battery_percent, 'GOOD', now);
    this.registry.updatePoint('MAC01_CHARGING_STATUS', m.is_charging, 'GOOD', now);
    this.registry.updatePoint('MAC01_THERMAL_PRESSURE', m.thermal_pressure_level, 'GOOD', now);
    this.registry.updatePoint('MAC01_CPU_TEMP', m.cpu_temp_c, m.cpu_temp_available ? 'GOOD' : 'UNCERTAIN', now);
    this.registry.updatePoint('MAC01_DEVICE_ONLINE', true, 'GOOD', now);

    // 2. If device has custom ID, update equipment model
    this.equipmentService.setEquipmentState('IT-MAC-001', 'RUNNING', 'GOOD');
    if (this.state.deviceId !== 'IT-MAC-001') {
      this.equipmentService.setEquipmentState(this.state.deviceId, 'RUNNING', 'GOOD');
    }

    this.notify();
  }

  private handleFailure(reason: string, status: ConnectionStatus = 'TIMEOUT'): void {
    const now = new Date().toISOString();

    this.state = {
      ...this.state,
      status,
      isOnline: false,
      lastPollTimestamp: now,
      errorMessage: reason,
      diagnosticHint: this.analyzeNetworkError(new Error(reason)),
    };

    // Mark agent offline point
    this.registry.updatePoint('MAC01_DEVICE_ONLINE', false, 'GOOD', now);

    // Degrade telemetry quality flags to TIMEOUT
    this.degradeTelemetryPoints(now, 'TIMEOUT');

    // Set equipment model to OFFLINE
    this.equipmentService.setEquipmentState('IT-MAC-001', 'OFFLINE', 'TIMEOUT');
    if (this.state.deviceId !== 'IT-MAC-001') {
      this.equipmentService.setEquipmentState(this.state.deviceId, 'OFFLINE', 'TIMEOUT');
    }

    this.notify();
  }

  private degradeTelemetryPoints(timestamp: string, quality: 'TIMEOUT' | 'BAD'): void {
    const macPointIds = [
      'MAC01_CPU_USAGE',
      'MAC01_MEMORY_USAGE',
      'MAC01_BATTERY_LEVEL',
      'MAC01_CHARGING_STATUS',
      'MAC01_THERMAL_PRESSURE',
      'MAC01_CPU_TEMP',
    ];

    for (const pid of macPointIds) {
      const pt = this.registry.getPoint(pid);
      if (pt) {
        this.registry.updatePoint(pid, pt.value, quality, timestamp);
      }
    }
  }

  private analyzeNetworkError(_err: Error): string {
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

    if (isHttps) {
      return (
        'Browser Security (Mixed Content / PNA): You are accessing this BMS over HTTPS, while your monitoring agent ' +
        'is running on local HTTP (127.0.0.1:8765). To permit local device telemetry: click the site settings / lock icon ' +
        'in your address bar, enable "Insecure content: Allow" (or Private Network Access) for this site, and reload.'
      );
    }

    return (
      'Local Agent Unreachable: Ensure the Python monitoring agent is running locally on your computer. ' +
      'Run "./agent/start_macos.sh" (macOS) or ".\\agent\\scripts\\start_windows.ps1" (Windows) in your terminal.'
    );
  }

  public getState(): LocalDeviceState {
    return { ...this.state };
  }

  public subscribe(listener: LocalDeviceListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const s = this.getState();
    for (const l of this.listeners) {
      try {
        l(s);
      } catch (e) {
        console.error('Error in LocalDevice listener:', e);
      }
    }
  }
}
