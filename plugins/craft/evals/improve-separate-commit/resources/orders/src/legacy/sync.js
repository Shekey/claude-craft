const ENDPOINT = "https://erp.example.com/api/orders";

let lastPayload = null;

export function pushOrders(orders) {
  lastPayload = JSON.stringify(orders);
  try {
    if (process.env.ERP_SYNC === "1") {
      fetch(ENDPOINT, { method: "POST", body: lastPayload });
    }
  } catch (e) {}
}

export function lastSyncedPayload() {
  return lastPayload;
}
