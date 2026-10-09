import { Stack } from "expo-router";
import { ExpensesProvider } from "../src/entities/expense";

export default function Layout() {
  return (
    <ExpensesProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ExpensesProvider>
  );
}
