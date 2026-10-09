import { roundCents } from "./money.js";

export function cartTotal(items) {
  let total;
  for (const item of items) {
    total = (total ?? 0) + item.price * item.qty;
  }
  return roundCents(total);
}

export function itemCount(items) {
  return items.reduce((count, item) => count + item.qty, 0);
}
