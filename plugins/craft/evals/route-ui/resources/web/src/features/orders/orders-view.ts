import type { Order } from "./api";

export function toOrdersView(orders: Order[]) {
  const open = orders.filter((o) => o.status === "open");
  return { rows: orders.map((o) => ({ id: o.id, label: `#${o.id}`, total: o.total.toFixed(2), status: o.status })), openCount: open.length };
}
