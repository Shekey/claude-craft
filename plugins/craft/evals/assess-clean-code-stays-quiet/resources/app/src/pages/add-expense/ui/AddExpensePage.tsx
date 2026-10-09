import { useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { draftFromExpense, emptyDraft, useExpenses, useReceipt } from "../../../entities/expense";
import { localToday } from "../../../shared/lib";
import { Page } from "../../../shared/ui";
import { ExpenseForm } from "./ExpenseForm";

const Message = ({ text }: { text: string }) => (
  <Page>
    <Text>{text}</Text>
  </Page>
);

export function AddExpensePage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { status } = useExpenses();
  const expense = id && status.kind === "ready" ? (status.expenses.find((e) => e.id === id) ?? null) : null;
  const initialReceipt = useReceipt(expense);

  if (id) {
    if (status.kind === "loading") return <Message text="Loading…" />;
    if (status.kind === "failed") return <Message text="Couldn't load your expenses. Check your connection and try again." />;
    if (!expense) return <Message text="This expense no longer exists." />;
  }
  if (!initialReceipt) return <Message text="Loading…" />;

  return (
    <ExpenseForm
      key={expense?.id ?? "new"}
      existing={expense}
      initialDraft={expense ? draftFromExpense(expense) : emptyDraft(localToday())}
      initialReceipt={initialReceipt}
    />
  );
}
