import type { Item, Sky, Warmth } from "@sww/engine";
import type { IconName } from "../../shared/ui";

export const SKY_ICON: Record<Sky, IconName> = {
  clear: "weather-sunny",
  cloudy: "weather-cloudy",
  rain: "weather-rainy",
  snow: "weather-snowy",
};

export function warmthOf4(warmth: Warmth): string {
  return `Warmth ${warmth}/4`;
}

export function itemSubtitle(item: Item): string {
  return item.category === "jacket" ? "Jacket" : "Shoes";
}

export function fitLine(score: number, label: string): string {
  return `Fit ${score}/10 · ${label}`;
}
