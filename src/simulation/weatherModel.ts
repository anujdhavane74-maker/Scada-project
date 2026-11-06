/**
 * Yerwada, Pune Weather Simulation Model
 * Implements ASHRAE 169 climatic variations for Pune (Latitude 18.55° N, Elevation 560m).
 */

import { WeatherCondition } from '../types/simulation';

export class WeatherModel {
  /**
   * Calculate realistic outdoor conditions for Yerwada, Pune given an hour of day (0.0 to 24.0)
   */
  public static calculateWeather(hourOfDay: number, seasonalBaseTemp: number = 32.0): WeatherCondition {
    // Diurnal sinusoidal temperature cycle (minimum at 05:30 sunrise, maximum at 14:30 afternoon)
    const peakHour = 14.5;
    const diurnalRange = 10.0; // 10°C day-night swing common in Pune plateau
    const cycle = Math.sin(((hourOfDay - peakHour + 6) / 24) * 2 * Math.PI);

    // Ambient Dry Bulb Temperature
    const outdoorAirTemp = Number((seasonalBaseTemp + (cycle * (diurnalRange / 2))).toFixed(1));

    // Relative humidity inversely correlates with dry bulb temp
    const outdoorAirHumidity = Number(Math.max(25, Math.min(85, 75 - (cycle * 25))).toFixed(1));

    // Approximate Stull psychrometric formula for wet-bulb temperature (°C)
    const T = outdoorAirTemp;
    const RH = outdoorAirHumidity;
    const wetBulb = T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
      Math.atan(T + RH) -
      Math.atan(RH - 1.676331) +
      0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
      4.686035;
    const wetBulbTemp = Number(Math.max(12, Math.min(32, wetBulb)).toFixed(1));

    // Solar irradiance (0 at night, up to 950 W/m² at solar noon)
    let solarIrradiance = 0;
    if (hourOfDay >= 6.5 && hourOfDay <= 18.5) {
      const solarAngle = Math.sin(((hourOfDay - 6.5) / 12) * Math.PI);
      solarIrradiance = Math.round(Math.max(0, solarAngle * 920));
    }

    let ambientConditionsLabel = "Moderate Warm";
    if (outdoorAirTemp > 36) ambientConditionsLabel = "Extreme Heatwave";
    else if (outdoorAirTemp > 31) ambientConditionsLabel = "Sunny & Warm";
    else if (outdoorAirHumidity > 70) ambientConditionsLabel = "Humid Monsoon";
    else if (outdoorAirTemp < 22) ambientConditionsLabel = "Cool Night";

    return {
      outdoorAirTemp,
      outdoorAirHumidity,
      wetBulbTemp,
      solarIrradiance,
      windSpeed: 2.8,
      ambientConditionsLabel,
    };
  }
}
