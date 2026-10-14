export type Warmth = 1 | 2 | 3 | 4;
export type Sky = "clear" | "cloudy" | "rain" | "snow";
export type VerdictKind = "jacket" | "shoes" | "layer" | "umbrella" | "hood" | "gloves" | "hat" | "sunglasses";

export type Item = {
  id: string;
  name: string;
  category: "jacket" | "shoe";
  warmth: Warmth;
  water: "none" | "resistant" | "waterproof";
  snow: "no" | "ready";
  photoUri?: string;
};

export type Pick = { item: Item; score: number; label: string; meetsNeed: boolean; optional?: boolean; reason?: string };
export type NeedInfo = { title: string; detail: string };
export type Advice = { kind: "wind" | "carry" | "layer" | "sun"; title: string };

export type Recommendation = {
  outfitFits: boolean;
  summary: {
    plannedFrom: string;
    plannedTo: string;
    coldestAt: string;
    designPerceivedC: number;
    firstWetAt: string | null;
    snow: boolean;
    maxGustKmh: number;
    conditions: string;
  };
  hours: { time: string; sky: Sky; perceivedC: number }[];
  jacket: { pick: Pick | null; alternatives: Pick[]; needInfo: NeedInfo };
  shoes: { pick: Pick | null; alternatives: Pick[]; needInfo: NeedInfo; need: { snow: boolean; water: 0 | 1 | 2 } };
  verdict: { items: { kind: VerdictKind; label: string; ownedId?: string; shortfall?: boolean; note?: string }[] };
  advice: Advice[];
  baseLayer: { title: string; detail: string; sleeves: "short" | "long" };
};

/** Replaces `{t:12}` and `{s:30}` tokens with temperatures and speeds in the user's units. */
export function formatUnits(text: string, units: "metric" | "imperial"): string {
  return text
    .replace(/\{t:(-?\d+)\}/g, (_, c) => (units === "metric" ? `${c}°C` : `${Math.round((Number(c) * 9) / 5 + 32)}°F`))
    .replace(/\{s:(\d+)\}/g, (_, s) => (units === "metric" ? `${s} km/h` : `${Math.round(Number(s) / 1.609)} mph`));
}
