import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import {
  CATEGORIES,
  checkDraft,
  draftFromScan,
  type Expense,
  type ExpenseDraft,
  type ExpenseFields,
  findDuplicate,
  type Receipt,
  receiptChange,
  useExpenses,
  useSaveExpense,
} from "../../../entities/expense";
import { type Source, useScanReceipt } from "../../../features/scan-receipt";
import { Toast } from "../../../shared/ui";

export type Notice = { kind: "none" } | { kind: "low-confidence" } | { kind: "error"; message: string };

const NONE: Notice = { kind: "none" };

const SCAN_ERRORS = {
  camera: "Camera access is off. Allow it in settings.",
  library: "Photo access is off. Allow it in settings.",
  failed: "That photo couldn't be used. Try another one.",
  unreadable: "We couldn't read that receipt. Fill it in by hand.",
};

const DRAFT_ERRORS = { title: "Add a title.", amount: "Enter an amount like 12.50.", date: "Use a date like 2026-10-09." };

type Options = { existing: Expense | null; initialDraft: ExpenseDraft; initialReceipt: Receipt };

export function useExpenseForm({ existing, initialDraft, initialReceipt }: Options) {
  const router = useRouter();
  const { status } = useExpenses();
  const { save, saving } = useSaveExpense();
  const { scan, scanning } = useScanReceipt();
  const [draft, setDraft] = useState(initialDraft);
  const [receipt, setReceipt] = useState(initialReceipt);
  const [notice, setNotice] = useState<Notice>(NONE);

  const edit = (patch: Partial<ExpenseDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const removeReceipt = () => {
    setReceipt({ kind: "none" });
    setNotice(NONE);
  };

  const scanFrom = async (source: Source) => {
    const result = await scan(source);
    if (result.kind === "cancelled") return;
    if (result.kind === "denied") return setNotice({ kind: "error", message: SCAN_ERRORS[result.source] });
    if (result.kind === "failed") return setNotice({ kind: "error", message: SCAN_ERRORS.failed });
    setReceipt({ kind: "picked", ...result.image });
    if (result.kind === "unreadable") return setNotice({ kind: "error", message: SCAN_ERRORS.unreadable });
    setDraft((d) => draftFromScan(d, result.scan));
    setNotice(result.scan.confidence < 0.6 ? { kind: "low-confidence" } : NONE);
  };

  const submit = async (fields: ExpenseFields) => {
    try {
      const outcome = await save(existing?.id ?? null, fields, receiptChange(initialReceipt, receipt));
      Toast.show(
        outcome.overBudget ? `You're over your ${CATEGORIES[fields.category].label} budget this month` : existing ? "Changes saved" : "Expense added",
      );
      router.back();
    } catch {
      setNotice({ kind: "error", message: "Saving failed. Try again." });
    }
  };

  const confirmAndSubmit = () => {
    const check = checkDraft(draft);
    if (!check.ok) return setNotice({ kind: "error", message: DRAFT_ERRORS[check.problem] });
    setNotice(NONE);
    const known = status.kind === "ready" ? status.expenses : [];
    const duplicate = existing ? undefined : findDuplicate(known, check.fields);
    if (!duplicate) return submit(check.fields);
    Alert.alert("Already added?", `This looks like "${duplicate.title}" on ${duplicate.date}.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Add anyway", onPress: () => submit(check.fields) },
    ]);
  };

  return { draft, edit, receipt, removeReceipt, scanFrom, scanning, notice, saving, confirmAndSubmit };
}
