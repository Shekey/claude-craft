import type { IconName } from "../../shared/ui";

/** The perceived temperature, in °C, at which someone starts to feel cold. */
export const DEFAULT_COLD_C = 12;

export const LEVELS: { value: number; label: string; sub: string; icon: IconName }[] = [
  { value: 16, label: "I get cold easily", sub: "A jacket by 16°", icon: "snowflake" },
  { value: DEFAULT_COLD_C, label: "About average", sub: "A jacket by 12°", icon: "thermometer" },
  { value: 8, label: "I run warm", sub: "T-shirt weather down to 8°", icon: "white-balance-sunny" },
];
