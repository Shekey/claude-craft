export type Order = { id: string; total: number; status: "open" | "shipped" | "cancelled" };

export async function getOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders");
  if (!response.ok) throw new Error(`Orders failed: ${response.status}`);
  return response.json();
}
