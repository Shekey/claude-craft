export type Units = "metric" | "imperial";

export function formatTemp(celsius: number, units: Units): string {
  return units === "metric" ? `${Math.round(celsius)}°` : `${Math.round((celsius * 9) / 5 + 32)}°`;
}
