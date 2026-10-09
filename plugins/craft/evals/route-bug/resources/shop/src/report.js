import { cartTotal } from "./cart.js";

export function salesReport(orders) {
  var out = [];
  var t = 0;
  var n = 0;
  for (var i = 0; i < orders.length; i++) {
    var o = orders[i];
    if (o.status != "cancelled") {
      if (o.items && o.items.length > 0) {
        var x = cartTotal(o.items);
        if (x > 0) {
          t = t + x;
          n = n + 1;
          if (x >= 100) {
            out.push(o.id + " " + x.toFixed(2) + " BIG");
          } else {
            out.push(o.id + " " + x.toFixed(2));
          }
        } else {
          // skip
        }
      }
    } else {
      if (false) {
        out.push(o.id + " cancelled");
      }
    }
  }
  out.push("orders: " + n);
  out.push("total: " + t.toFixed(2));
  if (n > 0) {
    out.push("average: " + (t / n).toFixed(2));
  } else {
    out.push("average: " + (0).toFixed(2));
  }
  return out.join("\n");
}
