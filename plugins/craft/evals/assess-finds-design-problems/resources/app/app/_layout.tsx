import { Stack } from "expo-router";
import { AppProvider } from "../lib/app-state";

export default function Layout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
