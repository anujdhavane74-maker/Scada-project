/**
 * Industrial Software PID Controller
 * Implements ISA standard continuous-form PID algorithm with anti-windup clamping,
 * derivative filtering, and configurable deadband to eliminate actuator hunting.
 */

export type PidAction = 'DIRECT' | 'REVERSE';

export interface PidConfig {
  id: string;
  name: string;
  kp: number;              // Proportional gain
  tiSeconds: number;       // Integral time constant (seconds)
  tdSeconds: number;       // Derivative time constant (seconds)
  action: PidAction;       // DIRECT (PV > SP -> increase CV) or REVERSE (PV > SP -> increase CV to cool)
  minOutput: number;       // e.g. 0%
  maxOutput: number;       // e.g. 100%
  deadband: number;        // Error deadband to prevent valve hunting (e.g. 0.2°C)
  derivativeFilterAlpha?: number; // Low-pass filter coefficient for derivative term (default 0.1)
}

export interface PidState {
  pv: number;              // Process Variable
  sp: number;              // Setpoint
  error: number;           // Current Error
  pTerm: number;           // Proportional component
  iTerm: number;           // Integral component
  dTerm: number;           // Derivative component
  cv: number;              // Control Variable (Output)
  isClamped: boolean;      // Anti-windup active
  timestamp: string;
}

export class PidController {
  private config: PidConfig;
  private integralSum: number = 0;
  private previousPv: number = 0;
  private filteredDerivative: number = 0;
  private lastState: PidState;

  constructor(config: PidConfig) {
    this.config = {
      derivativeFilterAlpha: 0.1,
      ...config,
    };

    this.lastState = {
      pv: 0,
      sp: 0,
      error: 0,
      pTerm: 0,
      iTerm: 0,
      dTerm: 0,
      cv: config.minOutput,
      isClamped: false,
      timestamp: new Date().toISOString(),
    };
  }

  public getConfig(): PidConfig {
    return { ...this.config };
  }

  public setTuning(kp: number, tiSeconds: number, tdSeconds: number, deadband?: number): void {
    this.config.kp = Math.max(0, kp);
    this.config.tiSeconds = Math.max(0.1, tiSeconds);
    this.config.tdSeconds = Math.max(0, tdSeconds);
    if (deadband !== undefined) {
      this.config.deadband = Math.max(0, deadband);
    }
  }

  public reset(): void {
    this.integralSum = 0;
    this.filteredDerivative = 0;
  }

  /**
   * Execute one PID loop iteration
   * @param pv Process Variable (e.g. actual Supply Air Temp)
   * @param sp Setpoint (e.g. target SAT Setpoint)
   * @param dtSeconds Loop sample interval in seconds (e.g. 1.0s)
   */
  public update(pv: number, sp: number, dtSeconds: number = 1.0): number {
    let error = sp - pv;

    // Apply Reverse/Direct action
    // In HVAC cooling, if actual temp > setpoint, error is negative in standard (sp - pv),
    // but cooling valve needs to OPEN. For REVERSE acting (cooling), error = pv - sp.
    if (this.config.action === 'REVERSE') {
      error = pv - sp;
    }

    // Deadband check: if within deadband, ignore small fluctuations to prevent valve wear
    if (Math.abs(error) < this.config.deadband) {
      error = 0;
    }

    // 1. Proportional Term: P = Kp * e
    const pTerm = this.config.kp * error;

    // 2. Integral Term: I = (Kp / Ti) * integral(e * dt) with anti-windup
    if (this.config.tiSeconds > 0 && error !== 0) {
      const ki = this.config.kp / this.config.tiSeconds;
      this.integralSum += error * dtSeconds * ki;

      // Integral clamping (anti-windup)
      const maxI = this.config.maxOutput - this.config.minOutput;
      this.integralSum = Math.max(-maxI, Math.min(maxI, this.integralSum));
    }
    const iTerm = this.integralSum;

    // 3. Derivative Term on PV (prevents derivative kick on setpoint step changes)
    let dTerm = 0;
    if (this.config.tdSeconds > 0 && dtSeconds > 0) {
      const dpv = (pv - this.previousPv) / dtSeconds;
      const alpha = this.config.derivativeFilterAlpha || 0.1;
      this.filteredDerivative = (alpha * dpv) + ((1 - alpha) * this.filteredDerivative);

      // If Reverse acting: rising PV increases output, so derivative contribution is positive
      const kd = this.config.kp * this.config.tdSeconds;
      dTerm = this.config.action === 'REVERSE'
        ? -kd * this.filteredDerivative
        : kd * this.filteredDerivative;
    }
    this.previousPv = pv;

    // Total raw control variable
    let rawCv = pTerm + iTerm + dTerm;

    // Clamp to engineering output bounds
    let isClamped = false;
    let cv = rawCv;
    if (cv > this.config.maxOutput) {
      cv = this.config.maxOutput;
      isClamped = true;
    } else if (cv < this.config.minOutput) {
      cv = this.config.minOutput;
      isClamped = true;
    }

    cv = Number(cv.toFixed(1));

    this.lastState = {
      pv,
      sp,
      error: Number(error.toFixed(2)),
      pTerm: Number(pTerm.toFixed(2)),
      iTerm: Number(iTerm.toFixed(2)),
      dTerm: Number(dTerm.toFixed(2)),
      cv,
      isClamped,
      timestamp: new Date().toISOString(),
    };

    return cv;
  }

  public getState(): PidState {
    return { ...this.lastState };
  }
}
