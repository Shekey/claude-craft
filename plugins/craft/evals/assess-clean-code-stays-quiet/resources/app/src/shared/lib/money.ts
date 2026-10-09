export type Currency = "EUR" | "USD" | "BAM";

export function formatMoney(cents: number, currency: Currency) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}

const AMOUNT = /^\d+([.,]\d{1,2})?$/;

export function parseAmount(input: string): number | null {
  const value = input.trim();
  if (!AMOUNT.test(value)) return null;
  const cents = Math.round(Number(value.replace(",", ".")) * 100);
  return cents > 0 ? cents : null;
}

export const formatAmount = (cents: number) => (cents / 100).toFixed(2);
