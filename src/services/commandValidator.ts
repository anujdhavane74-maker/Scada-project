/**
 * Command Validation Service
 * Enforces industrial safety interlocks, range limits, and point writability checks.
 * Prevents unsafe commands from being written to equipment.
 */

import { PointModel } from '../types/domain';

export interface CommandValidationResult {
  isValid: boolean;
  rejectionReason?: string;
  interlockWarning?: string;
  sanitizedValue?: number | boolean | string;
}

export class CommandValidator {
  /**
   * Validate a command before execution
   * @param point Target point to write
   * @param requestedValue Value requested by operator
   * @param getPointById Function to query current point states for interlock verification
   */
  public static validateCommand(
    point: PointModel,
    requestedValue: number | boolean | string,
    getPointById: (id: string) => PointModel | undefined
  ): CommandValidationResult {
    // 1. Writability check
    if (!point.isWritable) {
      return {
        isValid: false,
        rejectionReason: `Point [${point.id}] is a read-only telemetry point (${point.type}). Direct writes are prohibited by BMS safety policy.`,
      };
    }

    // 2. Type-specific checks
    if (point.type === 'BO') {
      const boolVal = typeof requestedValue === 'boolean'
        ? requestedValue
        : requestedValue === 1 || requestedValue === '1' || requestedValue === 'true';

      // Chiller Start Interlock Check:
      // Chiller must NOT be started unless a primary chilled water pump is verified running and flow is established
      if ((point.id === 'CH01_ENABLE_CMD' || point.id === 'CH02_ENABLE_CMD') && boolVal === true) {
        const chwp1Status = getPointById('CHWP01_STATUS')?.value === true;
        const chwp2Status = getPointById('CHWP02_STATUS')?.value === true;

        if (!chwp1Status && !chwp2Status) {
          return {
            isValid: false,
            rejectionReason: `SAFETY INTERLOCK BLOCKED: Cannot start ${point.equipmentId}. No primary chilled water pump is currently running. Flow proof is required to protect evaporator from freezing.`,
          };
        }
      }

      return {
        isValid: true,
        sanitizedValue: boolVal,
      };
    }

    if (point.type === 'AO') {
      const numVal = Number(requestedValue);
      if (isNaN(numVal)) {
        return {
          isValid: false,
          rejectionReason: `Invalid analog value '${requestedValue}'. Expected a numeric engineering value.`,
        };
      }

      // Chilled water setpoint safety interlock: prevent evaporator freezing
      if (point.id.includes('CHW_TEMP_SP') && numVal < 5.0) {
        return {
          isValid: false,
          rejectionReason: `FREEZE RISK INTERLOCK: Chilled water setpoint cannot be configured below 5.0°C to avoid tube rupture.`,
        };
      }

      // Min/Max range validation
      if (numVal < point.min || numVal > point.max) {
        return {
          isValid: false,
          rejectionReason: `Value ${numVal} ${point.unit} is out of safe range [${point.min} - ${point.max} ${point.unit}].`,
        };
      }

      // SAT setpoint safety limit
      if (point.id.includes('SAT_SP') && (numVal < 12.0 || numVal > 24.0)) {
        return {
          isValid: false,
          rejectionReason: `ASHRAE COMFORT LIMIT: Supply Air Setpoint must remain within 12.0°C to 24.0°C.`,
        };
      }

      return {
        isValid: true,
        sanitizedValue: Number(numVal.toFixed(2)),
      };
    }

    return {
      isValid: false,
      rejectionReason: `Unsupported point type [${point.type}] for writing.`,
    };
  }
}
