import { roundCents } from "./money.js";

const DAY_MS = 86_400_000;

export function loyaltyDiscount(customer) {
  const days = (Date.now() - new Date(customer.since).getTime()) / DAY_MS;
  if (customer.blocked) return 0;
  if (days >= 730) return 0.1;
  if (days >= 365) return 0.05;
  return 0;
}

export function priceFor(item, customer) {
  return roundCents(item.price * (1 - loyaltyDiscount(customer)));
}
