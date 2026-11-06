/**
 * Yerwada Smart Building - Centralized Building Configuration
 * Location: Yerwada, Pune, Maharashtra, India (Simulated Environment)
 */

import { BuildingHierarchyNode } from '../types/domain';

export interface BuildingMetadata {
  name: string;
  code: string;
  client: string;
  facilityType: string;
  location: {
    area: string;
    city: string;
    state: string;
    country: string;
    latitude: number;
    longitude: number;
    elevationMeters: number;
    climateZone: string;
  };
  physicalSpecifications: {
    grossFloorAreaSqM: number;
    usableAreaSqM: number;
    floorsAboveGrade: number;
    floorsBelowGrade: number;
    designOccupancy: number;
    operatingHours: string;
  };
  hvacDesignBasis: {
    totalCoolingCapacityTR: number;
    chilledWaterLoopDesign: {
      supplyTempC: number;
      returnTempC: number;
      deltaTC: number;
      designHeadKPa: number;
    };
    condenserWaterLoopDesign: {
      enteringTempC: number;
      leavingTempC: number;
      deltaTC: number;
      designHeadKPa: number;
    };
    indoorDesignCondition: {
      summerCoolingTempC: number;
      relativeHumidityPct: number;
    };
  };
  bmsArchitecture: {
    tier1Network: string; // BACnet/IP Backbone over 1Gbps Fiber
    tier2Network: string; // BACnet MS/TP & Modbus RTU/TCP RS485 loops
    simulatorVersion: string;
    commissionStatus: string;
  };
}

export const YERWADA_BUILDING_CONFIG: BuildingMetadata = {
  name: "Yerwada Smart Building",
  code: "YSB-PUNE-01",
  client: "Tech Park Yerwada Operations Ltd.",
  facilityType: "Grade-A Commercial IT / Corporate Office",
  location: {
    area: "Yerwada Tech Zone, Airport Road",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    latitude: 18.5529,
    longitude: 73.8797,
    elevationMeters: 560,
    climateZone: "Composite / Tropical Wet & Dry (ASHRAE 169 Zone 1B)",
  },
  physicalSpecifications: {
    grossFloorAreaSqM: 35000,
    usableAreaSqM: 28500,
    floorsAboveGrade: 4,
    floorsBelowGrade: 1, // Basement Plant Room
    designOccupancy: 2500,
    operatingHours: "07:00 - 21:00 IST (Mon-Sat)",
  },
  hvacDesignBasis: {
    totalCoolingCapacityTR: 1000, // 2 x 500 TR Water-Cooled Chillers (N+1 redundancy on pumps)
    chilledWaterLoopDesign: {
      supplyTempC: 6.7, // 44°F standard
      returnTempC: 12.2, // 54°F standard
      deltaTC: 5.5,
      designHeadKPa: 220,
    },
    condenserWaterLoopDesign: {
      enteringTempC: 32.0,
      leavingTempC: 37.0,
      deltaTC: 5.0,
      designHeadKPa: 180,
    },
    indoorDesignCondition: {
      summerCoolingTempC: 23.5,
      relativeHumidityPct: 50.0,
    },
  },
  bmsArchitecture: {
    tier1Network: "BACnet/IP (ISO 16484-5) over Ethernet Subnet 192.168.100.0/24",
    tier2Network: "Modbus TCP Gateway 192.168.100.200 (Energy Meters, Chiller Panels)",
    simulatorVersion: "v1.0.0-M01-ENG",
    commissionStatus: "SIMULATION / PRE-COMMISSIONING TESTING MODE",
  },
};

/**
 * Spatial & System Hierarchy Node Tree
 */
export const BUILDING_HIERARCHY: BuildingHierarchyNode = {
  id: "SITE_YERWADA",
  name: "Yerwada Tech Campus",
  type: "SITE",
  children: [
    {
      id: "BLD_01",
      name: "Yerwada Smart Building",
      type: "BUILDING",
      children: [
        {
          id: "LEVEL_B1",
          name: "Basement Level 1 - Central HVAC Energy Plant",
          type: "FLOOR",
          children: [
            {
              id: "SYS_CHW_PLANT",
              name: "Central Chilled Water Plant",
              type: "SYSTEM",
              children: [
                { id: "NODE_CH01", name: "Chiller 01 (500 TR)", type: "EQUIPMENT", equipmentId: "CH01" },
                { id: "NODE_CH02", name: "Chiller 02 (500 TR)", type: "EQUIPMENT", equipmentId: "CH02" },
                { id: "NODE_CHWP01", name: "Primary CHW Pump 01", type: "EQUIPMENT", equipmentId: "CHWP01" },
                { id: "NODE_CHWP02", name: "Primary CHW Pump 02", type: "EQUIPMENT", equipmentId: "CHWP02" },
                { id: "NODE_CWP01", name: "Condenser Water Pump 01", type: "EQUIPMENT", equipmentId: "CWP01" },
                { id: "NODE_CWP02", name: "Condenser Water Pump 02", type: "EQUIPMENT", equipmentId: "CWP02" },
              ],
            },
          ],
        },
        {
          id: "LEVEL_ROOF",
          name: "Roof Plant Level",
          type: "FLOOR",
          children: [
            {
              id: "SYS_HEAT_REJECTION",
              name: "Cooling Towers & Heat Rejection",
              type: "SYSTEM",
              children: [
                { id: "NODE_CT01", name: "Cooling Tower 01 (600 TR)", type: "EQUIPMENT", equipmentId: "CT01" },
                { id: "NODE_CT02", name: "Cooling Tower 02 (600 TR)", type: "EQUIPMENT", equipmentId: "CT02" },
              ],
            },
          ],
        },
        {
          id: "LEVEL_GF",
          name: "Ground Floor - Main Lobby & Atrium",
          type: "FLOOR",
          children: [
            {
              id: "SYS_AIR_GF",
              name: "Air Distribution Ground Floor",
              type: "SYSTEM",
              children: [
                { id: "NODE_AHU05", name: "AHU-05 (Atrium & Cafeteria)", type: "EQUIPMENT", equipmentId: "AHU05" },
                { id: "NODE_FCU12", name: "FCU-12 (Security & Main Reception)", type: "EQUIPMENT", equipmentId: "FCU12" },
              ],
            },
          ],
        },
        {
          id: "LEVEL_L1",
          name: "Level 1 - Open Workspace & Data Server Room",
          type: "FLOOR",
          children: [
            {
              id: "SYS_AIR_L1",
              name: "Air Distribution Level 1",
              type: "SYSTEM",
              children: [
                { id: "NODE_AHU01", name: "AHU-01 (Level 1 East Wing)", type: "EQUIPMENT", equipmentId: "AHU01" },
                { id: "NODE_FCU01", name: "FCU-01 (Primary Server Room A)", type: "EQUIPMENT", equipmentId: "FCU01" },
                { id: "NODE_FCU02", name: "FCU-02 (Conference Room 101)", type: "EQUIPMENT", equipmentId: "FCU02" },
                { id: "NODE_FCU03", name: "FCU-03 (Meeting Room 102)", type: "EQUIPMENT", equipmentId: "FCU03" },
              ],
            },
          ],
        },
        {
          id: "LEVEL_L2",
          name: "Level 2 - IT Development Pods & Telecom Hub",
          type: "FLOOR",
          children: [
            {
              id: "SYS_AIR_L2",
              name: "Air Distribution Level 2",
              type: "SYSTEM",
              children: [
                { id: "NODE_AHU02", name: "AHU-02 (Level 2 West Wing)", type: "EQUIPMENT", equipmentId: "AHU02" },
                { id: "NODE_FCU04", name: "FCU-04 (Secondary Server Room B)", type: "EQUIPMENT", equipmentId: "FCU04" },
                { id: "NODE_FCU05", name: "FCU-05 (Training Room 201)", type: "EQUIPMENT", equipmentId: "FCU05" },
                { id: "NODE_FCU06", name: "FCU-06 (Meeting Room 202)", type: "EQUIPMENT", equipmentId: "FCU06" },
              ],
            },
          ],
        },
        {
          id: "LEVEL_L3",
          name: "Level 3 - Executive Suites & Boardrooms",
          type: "FLOOR",
          children: [
            {
              id: "SYS_AIR_L3",
              name: "Air Distribution Level 3",
              type: "SYSTEM",
              children: [
                { id: "NODE_AHU03", name: "AHU-03 (Level 3 Executive Floor)", type: "EQUIPMENT", equipmentId: "AHU03" },
                { id: "NODE_FCU07", name: "FCU-07 (Executive Boardroom)", type: "EQUIPMENT", equipmentId: "FCU07" },
                { id: "NODE_FCU08", name: "FCU-08 (Managing Director Suite)", type: "EQUIPMENT", equipmentId: "FCU08" },
                { id: "NODE_FCU09", name: "FCU-09 (Telecom Room 301)", type: "EQUIPMENT", equipmentId: "FCU09" },
              ],
            },
          ],
        },
        {
          id: "LEVEL_L4",
          name: "Level 4 - R&D Hardware Testing Labs",
          type: "FLOOR",
          children: [
            {
              id: "SYS_AIR_L4",
              name: "Air Distribution Level 4",
              type: "SYSTEM",
              children: [
                { id: "NODE_AHU04", name: "AHU-04 (Level 4 Engineering Lab)", type: "EQUIPMENT", equipmentId: "AHU04" },
                { id: "NODE_FCU10", name: "FCU-10 (Hardware Testing Lab 401)", type: "EQUIPMENT", equipmentId: "FCU10" },
                { id: "NODE_FCU11", name: "FCU-11 (Development Pod 402)", type: "EQUIPMENT", equipmentId: "FCU11" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
