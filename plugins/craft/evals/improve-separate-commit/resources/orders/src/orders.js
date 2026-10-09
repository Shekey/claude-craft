import { readFileSync } from "node:fs";
import { pushOrders } from "./legacy/sync.js";

const orders = new Map();

export function createOrder(id, items) {
  const data = { id, items, status: "open", createdAt: new Date().toISOString() };
  orders.set(id, data);
  pushOrders([...orders.values()]);
  return data;
}

export function getOrder(id) {
  const x = orders.get(id);
  if (x == undefined) {
    return null;
  } else {
    return x;
  }
}

export function shipOrder(id) {
  const order = getOrder(id);
  if (!order) throw new Error(`Order ${id} not found`);
  if (order.status !== "open") throw new Error(`Order ${id} is ${order.status}`);
  const updated = { ...order, status: "shipped" };
  orders.set(id, updated);
  pushOrders([...orders.values()]);
  return updated;
}

export function resetOrders() {
  orders.clear();
}
