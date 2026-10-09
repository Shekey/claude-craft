export type Receipt =
  | { kind: "none" }
  | { kind: "saved"; id: string; url: string }
  | { kind: "saved-unavailable"; id: string }
  | { kind: "picked"; uri: string; base64: string };

export type ReceiptChange = { receiptBase64: string } | { removeReceipt: true } | Record<string, never>;

export function receiptChange(initial: Receipt, current: Receipt): ReceiptChange {
  if (current.kind === "picked") return { receiptBase64: current.base64 };
  const hadSaved = initial.kind === "saved" || initial.kind === "saved-unavailable";
  if (current.kind === "none" && hadSaved) return { removeReceipt: true };
  return {};
}

export const receiptUri = (r: Receipt) => (r.kind === "saved" ? r.url : r.kind === "picked" ? r.uri : null);
