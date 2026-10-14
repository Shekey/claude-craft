import { Stack } from "expo-router";
import { AppProvider } from "../state/app-state";

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
