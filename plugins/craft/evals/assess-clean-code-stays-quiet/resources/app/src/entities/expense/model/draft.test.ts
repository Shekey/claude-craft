import { describe, expect, it } from "vitest";
import { checkDraft, emptyDraft, findDuplicate } from "./draft";

const draft = { ...emptyDraft("2026-10-09"), title: "Groceries", amount: "12,50" };

describe("checkDraft", () => {
  it("accepts comma decimals", () => {
    expect(checkDraft(draft)).toMatchObject({ ok: true, fields: { amountCents: 1250 } });
  });

  it("rejects amounts that are not money", () => {
    expect(checkDraft({ ...draft, amount: "abc" })).toEqual({ ok: false, problem: "amount" });
    expect(checkDraft({ ...draft, amount: "0" })).toEqual({ ok: false, problem: "amount" });
  });

  it("rejects malformed dates", () => {
    expect(checkDraft({ ...draft, date: "9.10.2026" })).toEqual({ ok: false, problem: "date" });
  });
});

describe("findDuplicate", () => {
  it("matches title case-insensitively within the same currency", () => {
    const check = checkDraft(draft);
    if (!check.ok) throw new Error("fixture draft must be valid");
    const existing = [{ ...check.fields, id: "1", title: "groceries " }];
    expect(findDuplicate(existing, check.fields)?.id).toBe("1");
    expect(findDuplicate(existing, { ...check.fields, currency: "USD" })).toBeUndefined();
  });
});
