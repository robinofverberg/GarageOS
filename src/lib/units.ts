const KM_PER_MILE = 1.60934;
const MILES_PER_KM = 0.621371;

export function kmToMiles(km: number): number {
  return Math.round(km * MILES_PER_KM);
}

export function milesToKm(miles: number): number {
  return Math.round(miles * KM_PER_MILE);
}

export function displayMileage(storedKm: number, isMetric: boolean): number {
  return isMetric ? storedKm : kmToMiles(storedKm);
}

export function inputMileageToKm(value: number, isMetric: boolean): number {
  return isMetric ? value : milesToKm(value);
}
