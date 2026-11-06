# Yerwada Smart Building — BMS Simulator (Milestone 01)

An engineering-grade, browser-based Building Management System (BMS) operator workstation and SCADA simulator for a Grade-A commercial IT office facility in **Yerwada, Pune, India**.

This project demonstrates industrial Building Automation Systems (BAS) engineering principles, standards-compliant point management (ANSI/ASHRAE Standard 135 / ISO 16484-5), clean protocol adapter architectures for future BACnet/IP and Modbus TCP integration, and real-time physical simulation.

---

## Technical Stack

- **Framework**: React 19 + TypeScript (Strict Mode)
- **Bundler & Tooling**: Vite 6, Tailwind CSS
- **Visualization**: Recharts, SVG Equipment Schematics, Lucide React
- **Test Framework**: Vitest 3, React Testing Library, JSDOM
- **Design System**: Industrial Light Workstation Theme (dense engineering readouts, clean white surfaces, dark navy typography, precision status badges)

---

## Equipment Inventory (Centralized Configuration)

The facility inventory comprises exactly 25 primary equipment units and over 100 SCADA points:

| Equipment Category | Count | IDs | Description | Location |
| :--- | :--- | :--- | :--- | :--- |
| **Water-Cooled Centrifugal Chillers** | 2 | `CH01`, `CH02` | 500 TR (1,758 kW) VFD Centrifugal Units | Basement Level 1 (Central Energy Plant) |
| **Air Handling Units (AHU)** | 5 | `AHU01` to `AHU05` | VAV & CAV Modular Units with PICV Chilled Water Coils | Level 1, Level 2, Level 3, Level 4, Ground Floor |
| **Primary Chilled Water Pumps** | 2 | `CHWP01`, `CHWP02` | 65 L/s @ 220 kPa (45 kW) End-Suction Pumps | Basement Level 1 |
| **Condenser Water Pumps** | 2 | `CWP01`, `CWP02` | 85 L/s @ 180 kPa (37 kW) Pumps | Basement Level 1 |
| **Induced Draft Cooling Towers** | 2 | `CT01`, `CT02` | 600 TR Heat Rejection Counterflow Towers | Roof Plant Deck |
| **Fan Coil Units (FCU)** | 12 | `FCU01` to `FCU12` | 4-Pipe Chilled Water FCUs (1,200 CFM) | Distributed Across Floors (Server Rooms, Labs, Suites) |
| **IT Equipment (Host Monitored)** | 1 | `IT-MAC-001` | MacBook Air M5 (Apple M5 SoC, 16 GB Unified Memory) | Ground Floor (Monitoring Lab) |
| **Primary Temperature Sensors** | 21 | `WEATHER_OAT`, `CH01_*`, etc. | 100Ω Platinum RTD & 10K NTC Thermistors | Plant, Air Streams, Weather Station |
| **Primary Humidity Sensors** | 10 | `WEATHER_OAH`, `AHU01_RAH`, etc. | Capacitive Thin-Film Hygrometers | Return Air Ducts, Weather Station, Server Rooms |

---

## Core Engineering Principles Enforced

### 1. Command vs. Feedback Distinction
In adherence to industrial SCADA standards, command points and physical feedback points are strictly separated:
- **`AHU01_FAN_COMMAND`** (Binary Output `BO`, Writable): Operator start/stop request.
- **`AHU01_FAN_STATUS`** (Binary Input `BI`, Read-only): Physical confirmation from differential pressure switch.
- **`AHU01_CHW_VALVE_CMD`** (Analog Output `AO`, 0–100%): Output voltage to PICV actuator.
- **`AHU01_CHW_VALVE_POS`** (Analog Input `AI`, 0–100%): Actual potentiometer position feedback from valve actuator.
- **Command-Feedback Mismatch Detection**: If a command is issued and status fails to respond within expected tolerance, an automatic `COMMAND_MISMATCH_FAULT` alarm is raised.

### 2. Safety Interlocks & Range Validation
Control commands are validated prior to execution:
- **Chiller Start Interlock**: Chillers `CH01` or `CH02` cannot be commanded ON unless at least one primary chilled water pump (`CHWP01` or `CHWP02`) has confirmed physical run status and proof of flow.
- **Evaporator Freeze Protection**: Chilled water setpoints (`CH01_CHW_TEMP_SP`) are hard-blocked below 5.0°C.
- **Supply Air Setpoint Boundaries**: SAT setpoints must remain within ASHRAE comfort bounds (12.0°C to 24.0°C).
- **Read-Only Telemetry Protection**: Any attempt to write to `AI` or `BI` points is rejected by BMS policy.

### 3. Protocol Adapter Architecture
Clean, typed protocol adapters decouple domain logic from transport protocols:
- `IProtocolAdapter`: Base driver interface.
- `SimulatorAdapter`: Active driver executing local thermodynamic equations.
- `BACnetIPAdapter`: Pre-wired ANSI/ASHRAE Standard 135 Annex J UDP/IP Port 47808 interface ready for Milestone 02 controller commissioning.
- `ModbusTCPAdapter`: Pre-wired Port 502 gateway interface for electrical meters and VFD registers.

---

## Project Structure

```
src/
├── config/
│   ├── buildingConfig.ts      # Building metadata, spatial tree, design specifications
│   └── equipmentCatalog.ts    # Centralized equipment definitions and point registry catalog
├── context/
│   └── BmsContext.tsx         # Unified React context (telemetry, simulator, commands, alarms)
├── services/
│   ├── pointRegistry.ts       # Central single-source-of-truth point repository
│   ├── equipmentService.ts    # Operational state computation and comm health rollup
│   ├── alarmService.ts        # ISA-18.2 threshold monitoring and mismatch detection
│   ├── commandValidator.ts    # Safety interlocks and boundary validation
│   ├── eventLogger.ts         # Non-repudiation audit trail for operator actions
│   └── protocols/
│       ├── protocolAdapter.ts # Base adapter manager and factory
│       ├── simulatorAdapter.ts# Active simulation adapter
│       ├── bacnetAdapter.ts   # Staged BACnet/IP ISO 16484-5 interface
│       └── modbusAdapter.ts   # Staged Modbus TCP interface
├── simulation/
│   ├── simulationEngine.ts    # Real-time thermodynamic, hydraulic, and airflow physics cycle
│   ├── weatherModel.ts        # ASHRAE 169 diurnal cycle for Yerwada, Pune
│   └── scenarios.ts           # Deterministic test scenarios (Heatwave, Chiller Trip, etc.)
├── types/
│   ├── domain.ts              # Equipment, Point, State, Quality, Alarm interfaces
│   ├── protocol.ts            # IBACnetAdapter, IModbusAdapter, IProtocolAdapter
│   └── simulation.ts          # SimulationState, WeatherCondition, ScenarioPreset
├── components/
│   ├── common/
│   │   ├── StatusBadge.tsx    # Equipment state indicator (RUNNING, STOPPED, FAULT, TRIPPED)
│   │   ├── QualityBadge.tsx   # GOOD, UNCERTAIN, BAD, TIMEOUT badges
│   │   ├── PointValueDisplay.tsx # Engineering value readout with unit & override button
│   │   └── CommandDialog.tsx  # Interlock-checked setpoint override modal
│   ├── graphics/
│   │   ├── AhuGraphic.tsx     # Industrial SVG schematic of AHU with live animated fan & dampers
│   │   └── ChillerGraphic.tsx # Industrial SVG schematic of Chiller with live CW/CHW temps
│   ├── layout/
│   │   ├── AppShell.tsx       # Main workstation frame
│   │   ├── TopStatusBar.tsx   # Top engineering status bar with simulation controls
│   │   └── Sidebar.tsx        # 8-module operator workstation navigation
│   └── views/
│       ├── OverviewView.tsx   # Primary operator dashboard
│       ├── DevicesView.tsx    # Equipment inventory and point inspector drawer
│       ├── HvacPlantView.tsx  # Central chiller plant and roof tower schematics
│       ├── FloorPlanView.tsx  # Architectural floor-by-floor zoning matrix
│       ├── AlarmsView.tsx     # ISA-18.2 Alarm & Fault Management Console
│       ├── TrendsView.tsx     # Recharts real-time telemetry curves
│       ├── EnergyView.tsx     # Substation power submetering breakdown
│       ├── CommissioningView.tsx # Protocol adapter heartbeat & audit trail
│       └── EngineeringInfoModal.tsx # Spatial hierarchy tree and point naming guide
└── test/
    ├── domain.test.ts         # Equipment counts, point types, command/feedback pairs
    ├── commandValidator.test.ts # Safety interlocks, freeze prevention, writability
    ├── pointRegistry.test.ts  # Singleton repository, indexing, updates, batching
    ├── simulationEngine.test.ts # Diurnal weather, thermodynamic cycle, fault injection
    └── navigation.test.tsx    # AppShell rendering, all 8 navigation routes, modal states
```

---

## Quality Gates Verification

Run the test suite and verification commands:

```bash
# 1. Run TypeScript type checks (0 errors)
npm run lint

# 2. Run all frontend unit tests (33/33 passing)
npm test

# 3. Run Python cross-platform agent unit tests (7/7 passing)
./agent/venv/bin/python3 agent/test_agent.py

# 4. Compile production build
npm run build
```

---

## Milestone 02: Vercel Deployment & Cross-Platform Host Monitoring

In Milestone 02, the Yerwada Smart Building BMS is prepared for public Vercel deployment while enabling users on any computer (macOS, Windows, Linux) to stream their own machine's hardware telemetry securely into their browser session.

### Architecture & Session Isolation

```
                                  PUBLIC CLOUD (VERCEL)
                     ┌────────────────────────────────────────────────┐
                     │          Vercel Production CDN (HTTPS)         │
                     │   • Hosts React 19 Frontend Assets (SPA)       │
                     │   • Executes Client-Side Simulation Physics    │
                     │   • 0 Client Telemetry Stored in Cloud / DB    │
                     └───────────────────────┬────────────────────────┘
                                             │
                       Browsers load website │ (Independent Sessions)
                     ┌───────────────────────┴────────────────────────┐
                     │                                                │
                     ▼                                                ▼
         USER 1 (MacBook Air / macOS)                      USER 2 (Windows PC / Dell XPS)
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│ Browser Session 1                            │  │ Browser Session 2                            │
│ • Runs local thermodynamic simulation        │  │ • Runs local thermodynamic simulation        │
│ • Connects to: http://127.0.0.1:8765         │  │ • Connects to: http://127.0.0.1:8765         │
│ • Displays MacBook Telemetry & Points        │  │ • Displays Windows PC Telemetry & Points     │
└──────────────────────┬───────────────────────┘  └──────────────────────┬───────────────────────┘
                       │ Loopback HTTP + PNA                             │ Loopback HTTP + PNA
                       ▼                                                 ▼
┌──────────────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│ Local Python Agent (127.0.0.1:8765)          │  │ Local Python Agent (127.0.0.1:8765)          │
│ • PID: Generated on launch                   │  │ • PID: Generated on launch                   │
│ • Persistent ID: IT-MAC-XXXX                 │  │ • Persistent ID: IT-PC-YYYY                  │
│ • Pairing Token: Stored in pairing_token.txt │  │ • Pairing Token: Stored in pairing_token.txt │
│ • Native macOS NSProcessInfo Thermal State   │  │ • Windows ACPI / WMI Thermal Interface       │
└──────────────────────────────────────────────┘  └──────────────────────────────────────────────┘
```

### Agent Directory Structure

```
agent/
├── main.py                     # FastAPI daemon, CORS policy, PNA middleware, endpoints
├── requirements.txt            # Python dependencies (fastapi, uvicorn, psutil)
├── platform/
│   ├── base.py                 # Abstract PlatformProvider interface
│   ├── macos.py                # macOS NSProcessInfo thermalState & Apple Silicon bounds
│   └── windows.py              # Windows ACPI WMI queries & psutil telemetry
├── services/
│   ├── metrics.py              # System metrics collection & SCADA point synthesis
│   └── thermal.py              # Thermal pressure level mapping (0-3: NOMINAL..CRITICAL)
├── security/
│   └── authentication.py       # Persistent device ID, pairing token HMAC, CORS origins
└── scripts/
    ├── start_macos.sh          # macOS background daemon launcher
    ├── stop_macos.sh           # macOS agent shutdown script
    ├── start_windows.ps1       # Windows PowerShell background daemon launcher
    └── stop_windows.ps1        # Windows PowerShell shutdown script
```

### Startup Instructions

#### On macOS:
```bash
# 1. Start agent
./agent/start_macos.sh

# 2. View generated pairing token
cat agent/pairing_token.txt

# 3. Stop agent
./agent/stop_macos.sh
```

#### On Windows:
```powershell
# 1. Start agent (Run in PowerShell)
.\agent\scripts\start_windows.ps1

# 2. View generated pairing token
Get-Content agent\pairing_token.txt

# 3. Stop agent
.\agent\scripts\stop_windows.ps1
```

### Deploying to Vercel

1. Push this repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. Vercel automatically detects the Vite framework settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy. Vercel utilizes the included [`vercel.json`](./vercel.json) for Single Page Application rewrite routing.

> [!NOTE]
> When accessing the BMS on HTTPS (e.g. `https://yerwada-bms.vercel.app`), modern browsers enforce Private Network Access (PNA) security policies on loopback (`http://127.0.0.1:8765`). If telemetry is initially blocked, click the site settings / lock icon in the browser address bar, set **Insecure content** to **Allow**, and reload. The in-app **Connect My Computer** modal includes step-by-step diagnostic guidance.
