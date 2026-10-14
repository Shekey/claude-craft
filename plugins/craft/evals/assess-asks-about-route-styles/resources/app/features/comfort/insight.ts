export type Odds = { comfortable: number; samples: number; coldRisk: number };

/** Turns past feedback into one line for the fit screen; null until there is enough feedback. */
export function oddsLine(odds: Odds): { headline: string; risk: string | null } | null {
  if (odds.samples < 3) return null;
  const headline = `Comfortable on ${Math.round(odds.comfortable * 100)}% of days like this`;
  const risk = odds.coldRisk > 0.25 ? "You felt cold on some of them; consider a warmer layer." : null;
  return { headline, risk };
}
