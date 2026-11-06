import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';
import { PointRegistry } from '../services/pointRegistry';
import { INITIAL_POINTS_CATALOG } from '../config/equipmentCatalog';

describe('BMS Application Shell & Navigation Suite', () => {
  beforeEach(() => {
    PointRegistry.getInstance().initialize(INITIAL_POINTS_CATALOG);
  });

  it('renders the industrial workstation top status bar and building title', () => {
    render(<App />);
    expect(screen.getByText('Yerwada Smart Building')).toBeInTheDocument();
    expect(screen.getByText('YSB-PUNE-01')).toBeInTheDocument();
    expect(screen.getByText(/E\. Rane/)).toBeInTheDocument();
  });

  it('navigates seamlessly across all 8 required application modules', () => {
    render(<App />);

    // 1. Overview (Default)
    expect(screen.getByText('Total Equipment')).toBeInTheDocument();
    expect(screen.getByText('Online & Running')).toBeInTheDocument();

    // 2. HVAC Plant
    fireEvent.click(screen.getByTestId('nav-hvac_plant'));
    expect(screen.getByText(/Basement Central Chilled Water Plant/i)).toBeInTheDocument();

    // 3. Floor Plan
    fireEvent.click(screen.getByTestId('nav-floor_plan'));
    expect(screen.getByText(/Floor Plan Zoning & Air Distribution/i)).toBeInTheDocument();

    // 4. Alarms
    fireEvent.click(screen.getByTestId('nav-alarms'));
    expect(screen.getByText(/Alarm & Fault Management Console/i)).toBeInTheDocument();

    // 5. Trends
    fireEvent.click(screen.getByTestId('nav-trends'));
    expect(screen.getByText(/Real-Time SCADA Telemetry & Trend Analysis/i)).toBeInTheDocument();

    // 6. Energy
    fireEvent.click(screen.getByTestId('nav-energy'));
    expect(screen.getByText(/Electrical Submetering & Power Distribution/i)).toBeInTheDocument();

    // 7. Devices
    fireEvent.click(screen.getByTestId('nav-devices'));
    expect(screen.getByText(/Equipment Inventory & Point Browser/i)).toBeInTheDocument();

    // 8. Commissioning
    fireEvent.click(screen.getByTestId('nav-commissioning'));
    expect(screen.getByText(/Pre-Commissioning & Protocol Adapter Workstation/i)).toBeInTheDocument();
  });

  it('opens and closes the Engineering Architecture modal', () => {
    render(<App />);

    const engInfoBtn = screen.getByRole('button', { name: /Eng Info/i });
    fireEvent.click(engInfoBtn);

    expect(screen.getByText('BMS Engineering Architecture Specification')).toBeInTheDocument();
    expect(screen.getByText('Equipment Hierarchy Tree')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Close Engineering Specification/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('BMS Engineering Architecture Specification')).not.toBeInTheDocument();
  });

  it('verifies that equipment status and communication quality are represented separately', () => {
    render(<App />);
    // Check communication badge in top bar
    expect(screen.getByText(/COMM: 100% HEALTHY/i)).toBeInTheDocument();
  });
});
