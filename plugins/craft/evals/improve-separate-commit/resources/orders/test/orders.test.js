import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createOrder, getOrder, resetOrders, shipOrder } from "../src/orders.js";

beforeEach(() => resetOrders());

test("a new order is open", () => {
  assert.equal(createOrder("o1", [{ sku: "a", qty: 1 }]).status, "open");
});

test("an open order can be shipped", () => {
  createOrder("o1", []);
  assert.equal(shipOrder("o1").status, "shipped");
  assert.equal(getOrder("o1").status, "shipped");
});

test("shipping an unknown order fails", () => {
  assert.throws(() => shipOrder("nope"), /not found/);
});
