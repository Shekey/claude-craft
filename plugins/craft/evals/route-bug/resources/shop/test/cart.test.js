import assert from "node:assert/strict";
import { test } from "node:test";
import { cartTotal, itemCount } from "../src/cart.js";

test("cart total sums price times quantity", () => {
  assert.equal(cartTotal([{ price: 2.5, qty: 2 }, { price: 1.1, qty: 1 }]), 6.1);
});

test("item count sums quantities", () => {
  assert.equal(itemCount([{ price: 1, qty: 2 }, { price: 1, qty: 3 }]), 5);
});
