import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalDeviceConnectionService } from '../services/localDeviceConnectionService';
import { PointRegistry } from '../services/pointRegistry';
import { EquipmentService } from '../services/equipmentService';
import { INITIAL_POINTS_CATALOG, INITIAL_EQUIPMENT_CATALOG } from '../config/equipmentCatalog';

describe('Milestone 02: Cross-Platform Local Host Monitoring & Session Isolation', () => {
  let localService: LocalDeviceConnectionService;
  let registry: PointRegistry;
  let equipService: EquipmentService;

  beforeEach(() => {
    registry = PointRegistry.getInstance();
    registry.initialize(INITIAL_POINTS_CATALOG);
    equipService = EquipmentService.getInstance();
    equipService.initialize(INITIAL_EQUIPMENT_CATALOG);
    localService = LocalDeviceConnectionService.getInstance();
  });

  afterEach(() => {
    localService.disconnect(true);
    vi.restoreAllMocks();
  });

  it('rejects connection when pairing token is empty or invalid', async () => {
    const resEmpty = await localService.connect('   ');
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.error).toContain('Pairing token is required');

    // Mock 401 Unauthorized from agent
    global.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      statusText: 'Unauthorized',
    } as unknown as Response);

    const resInvalid = await localService.connect('wrong_token_1234');
    expect(resInvalid.success).toBe(false);
    expect(resInvalid.error).toContain('Authentication failed');
    expect(localService.getState().status).toBe('AUTH_FAILED');
  });

  it('successfully connects and parses Windows host telemetry', async () => {
    const mockWindowsPayload = {
      device_id: 'IT-PC-8F2B',
      device_name: 'Dell Precision 5570',
      device_type: 'IT Equipment',
      os_name: 'Microsoft Windows 11 Pro',
      location: 'Monitoring Lab',
      integration_type: 'Local Host Monitoring Agent',
      online: true,
      timestamp: new Date().toISOString(),
      metrics: {
        cpu_usage_percent: 42.1,
        memory_usage_percent: 64.0,
        memory_available_gb: 11.5,
        memory_total_gb: 32.0,
        battery_percent: 95.0,
        is_charging: true,
        has_battery: true,
        uptime_seconds: 86400,
        uptime_formatted: '1d 0h 0m',
        thermal_pressure_level: 0,
        thermal_pressure_label: 'NOMINAL',
        cpu_temp_c: null,
        cpu_temp_available: false,
        cpu_temp_reason: 'ACPI thermal zones require elevated administrator access.',
      },
      points: {},
      agent: {
        status: 'RUNNING',
        host: '127.0.0.1',
        port: 8765,
        pid: 4512,
        python_version: '3.11.2',
        auth_enabled: true,
      },
    };

    // First call is /auth/verify, second is /metrics
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/auth/verify')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            authenticated: true,
            device_id: 'IT-PC-8F2B',
            device_name: 'Dell Precision 5570',
            os_name: 'Microsoft Windows 11 Pro',
          }),
        } as unknown as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockWindowsPayload,
      } as unknown as Response);
    });

    const res = await localService.connect('valid_secret_token_12345', false);
    expect(res.success).toBe(true);

    const state = localService.getState();
    expect(state.status).toBe('CONNECTED');
    expect(state.isOnline).toBe(true);
    expect(state.deviceId).toBe('IT-PC-8F2B');
    expect(state.deviceName).toBe('Dell Precision 5570');
    expect(state.osName).toBe('Microsoft Windows 11 Pro');

    // Points updated
    const cpuPt = registry.getPoint('MAC01_CPU_USAGE');
    expect(cpuPt?.value).toBe(42.1);
    expect(cpuPt?.quality).toBe('GOOD');

    const battPt = registry.getPoint('MAC01_BATTERY_LEVEL');
    expect(battPt?.value).toBe(95.0);
  });

  it('maintains strict session isolation and does not modify central HVAC simulation equipment', async () => {
    // Verify that primary chillers and AHUs remain unchanged
    const ch01 = equipService.getEquipment('CH01');
    expect(ch01).toBeDefined();
    expect(ch01?.type).toBe('CHILLER');

    const ahu01 = equipService.getEquipment('AHU01');
    expect(ahu01).toBeDefined();
    expect(ahu01?.type).toBe('AHU');

    // Disconnect does not affect chillers or AHUs
    localService.disconnect(true);
    const ch01After = equipService.getEquipment('CH01');
    expect(ch01After?.id).toBe('CH01');
  });

  it('degrades points to TIMEOUT and marks device offline on disconnect', async () => {
    localService.disconnect(true);

    const state = localService.getState();
    expect(state.status).toBe('DISCONNECTED');
    expect(state.isOnline).toBe(false);

    const onlinePt = registry.getPoint('MAC01_DEVICE_ONLINE');
    expect(onlinePt?.value).toBe(false);

    const cpuPt = registry.getPoint('MAC01_CPU_USAGE');
    expect(cpuPt?.quality).toBe('TIMEOUT');
  });
});
