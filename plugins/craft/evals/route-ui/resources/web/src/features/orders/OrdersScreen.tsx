import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getOrders } from "./api";
import { toOrdersView } from "./orders-view";

export function OrdersScreen() {
  const query = useQuery({ queryKey: ["orders"], queryFn: getOrders });

  if (query.isPending) return <p className="text-muted-foreground">Loading orders…</p>;
  if (query.isError)
    return (
      <Card role="alert">
        <p className="text-destructive">Couldn't load orders.</p>
        <Button variant="outline" onClick={() => query.refetch()}>
          Try again
        </Button>
      </Card>
    );

  const view = toOrdersView(query.data);
  if (!view.rows.length) return <p className="text-muted-foreground">No orders yet.</p>;

  return (
    <Card>
      <CardTitle>Orders ({view.openCount} open)</CardTitle>
      <ul>
        {view.rows.map((row) => (
          <li key={row.id}>
            {row.label} · {row.total} · {row.status}
          </li>
        ))}
      </ul>
    </Card>
  );
}
