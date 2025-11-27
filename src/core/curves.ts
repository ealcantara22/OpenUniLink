import type { FanCurvePoint } from './types';

/**
 * Interpolates the PWM percentage for a given temperature based on a set of fan curve points.
 *
 * @param {FanCurvePoint[]} points - An array of fan curve points, where each point represents a temperature (tempC) and its corresponding PWM percentage (pwmPercent).
 * @param {number} tempC - The temperature in degrees Celsius for which to calculate the interpolated PWM percentage.
 * @return {number} The interpolated PWM percentage value corresponding to the given temperature.
 * If the temperature is below the lowest point, the PWM percentage of the first point is returned.
 * If it is above the highest point, the PWM percentage of the last point is returned.
 */
export function interpolateCurve(
  points: FanCurvePoint[],
  tempC: number,
): number {
  if (points.length === 0) return 0;

  // Ensure sorted by temp
  const sorted = [...points].sort((a, b) => a.tempC - b.tempC);

  if (tempC <= sorted[0].tempC) {
    return sorted[0].pwmPercent;
  }
  if (tempC >= sorted[sorted.length - 1].tempC) {
    return sorted[sorted.length - 1].pwmPercent;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];

    if (tempC >= a.tempC && tempC <= b.tempC) {
      const t = (tempC - a.tempC) / (b.tempC - a.tempC);

      return a.pwmPercent + t * (b.pwmPercent - a.pwmPercent);
    }
  }

  return sorted[sorted.length - 1].pwmPercent;
}
