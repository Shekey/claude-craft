const BASE = "https://api.pocket-ledger.example";

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!res.ok) throw new HttpError(res.status);
  return res.json() as Promise<T>;
}
