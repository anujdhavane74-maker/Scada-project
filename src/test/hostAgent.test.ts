import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HostAgentService } from '../services/hostAgentService';
import { PointRegistry } from '../services/pointRegistry';
import { EquipmentService } from '../services/equipmentService';
import { INITIAL_POINTS_CATALOG, INITIAL_EQUIPMENT_CATALOG } from '../config/equipmentCatalog';

describe('MacBook Air M5 Host Monitoring Integration', () => {
  let hostService: HostAgentService;
  let registry: PointRegistry;
  let equipService: EquipmentService;

  beforeEach(() => {
    registry = PointRegistry.getInstance();
    registry.initialize(INITIAL_POINTS_CATALOG);
    equipService = EquipmentService.getInstance();
    equipService.initialize(INITIAL_EQUIPMENT_CATALOG);
    hostService = HostAgentService.getInstance();
  });

  afterEach(() => {
    hostService.stop();
    vi.restoreAllMocks();
  });

  it('should have all 7 required points configured in the point catalog', () => {
    const requiredPoints = [
      'MAC01_CPU_USAGE',
      'MAC01_MEMORY_USAGE',
      'MAC01_BATTERY_LEVEL',
      'MAC01_CHARGING_STATUS',
      'MAC01_THERMAL_PRESSURE',
      'MAC01_CPU_TEMP',
      'MAC01_DEVICE_ONLINE',
    ];

    for (const pid of requiredPoints) {
      const pt = registry.getPoint(pid);
      expect(pt, `Point ${pid} must be defined`).toBeDefined();
      expect(pt?.equipmentId).toBe('IT-MAC-001');
      expect(pt?.quality).toBeDefined();
      expect(pt?.timestamp).toBeDefined();
    }

    // Verify point types
    expect(registry.getPoint('MAC01_CPU_USAGE')?.type).toBe('AI');
    expect(registry.getPoint('MAC01_CPU_USAGE')?.unit).toBe('%');

    expect(registry.getPoint('MAC01_MEMORY_USAGE')?.type).toBe('AI');
    expect(registry.getPoint('MAC01_MEMORY_USAGE')?.unit).toBe('%');

    expect(registry.getPoint('MAC01_BATTERY_LEVEL')?.type).toBe('AI');
    expect(registry.getPoint('MAC01_BATTERY_LEVEL')?.unit).toBe('%');

    expect(registry.getPoint('MAC01_CHARGING_STATUS')?.type).toBe('BI');

    expect(registry.getPoint('MAC01_THERMAL_PRESSURE')?.type).toBe('AI');

    expect(registry.getPoint('MAC01_CPU_TEMP')?.type).toBe('AI');
    expect(registry.getPoint('MAC01_CPU_TEMP')?.unit).toBe('°C');

    expect(registry.getPoint('MAC01_DEVICE_ONLINE')?.type).toBe('BI');
  });

  it('should return null for CPU temperature when direct die temp is restricted on Apple Silicon', () => {
    const cpuTempPt = registry.getPoint('MAC01_CPU_TEMP');
    expect(cpuTempPt).toBeDefined();
    expect(cpuTempPt?.value).toBeNull();
    expect(cpuTempPt?.description).toContain('Restricted by macOS');
  });

  it('should successfully update points when host agent returns live metrics', async () => {
    const mockPayload = {
      device_id: 'IT-MAC-001',
      device_name: 'MacBook Air M5',
      device_type: 'IT Equipment',
      location: 'Monitoring Lab',
      integration_type: 'Local Host Monitoring Agent',
      online: true,
      timestamp: new Date().toISOString(),
      metrics: {
        cpu_usage_percent: 34.5,
        memory_usage_percent: 78.2,
        memory_available_gb: 3.5,
        memory_total_gb: 16.0,
        battery_percent: 82.0,
        is_charging: false,
        uptime_seconds: 12000,
        uptime_formatted: '3h 20m',
        thermal_pressure_level: 1,
        thermal_pressure_label: 'FAIR',
        cpu_temp_c: null,
        cpu_temp_available: false,
        cpu_temp_reason: 'Restricted to superuser',
      },
      points: {},
      agent: {
        status: 'RUNNING',
        host: '127.0.0.1',
        port: 8765,
        pid: 9999,
        python_version: '3.9.6',
      },
    };

    // Mock global fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    } as unknown as Response);

    await hostService.pollNow();

    const cpuPt = registry.getPoint('MAC01_CPU_USAGE');
    expect(cpuPt?.value).toBe(34.5);
    expect(cpuPt?.quality).toBe('GOOD');

    const memPt = registry.getPoint('MAC01_MEMORY_USAGE');
    expect(memPt?.value).toBe(78.2);
    expect(memPt?.quality).toBe('GOOD');

    const battPt = registry.getPoint('MAC01_BATTERY_LEVEL');
    expect(battPt?.value).toBe(82.0);
    expect(battPt?.quality).toBe('GOOD');

    const chargePt = registry.getPoint('MAC01_CHARGING_STATUS');
    expect(chargePt?.value).toBe(false);

    const onlinePt = registry.getPoint('MAC01_DEVICE_ONLINE');
    expect(onlinePt?.value).toBe(true);

    const macEquip = equipService.getEquipment('IT-MAC-001');
    expect(macEquip?.operatingState).toBe('RUNNING');
    expect(macEquip?.communicationQuality).toBe('GOOD');
  });

  it('should gracefully handle agent disconnect / offline status', async () => {
    // Mock fetch failure (agent stopped or connection refused)
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch (Connection Refused)'));

    await hostService.pollNow();

    const onlinePt = registry.getPoint('MAC01_DEVICE_ONLINE');
    expect(onlinePt?.value).toBe(false);

    const cpuPt = registry.getPoint('MAC01_CPU_USAGE');
    expect(cpuPt?.quality).toBe('TIMEOUT');

    const macEquip = equipService.getEquipment('IT-MAC-001');
    expect(macEquip?.operatingState).toBe('OFFLINE');
    expect(macEquip?.communicationQuality).toBe('TIMEOUT');
  });
});
