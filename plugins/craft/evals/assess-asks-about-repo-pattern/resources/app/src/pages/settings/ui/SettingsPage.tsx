import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { Muted, Screen, Title } from "../../../shared/ui";

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={{ fontWeight: "600", marginTop: 12 }}>{children}</Text>;
}

function AppVersion() {
  return <Muted>Version 1.4.2</Muted>;
}

export function SettingsPage() {
  const [reminders, setReminders] = useState(true);
  const [weekStartsMonday, setWeekStartsMonday] = useState(true);
  return (
    <Screen>
      <Title>Settings</Title>
      <SectionTitle>Notifications</SectionTitle>
      <ToggleRow label="Daily reminders" value={reminders} onChange={setReminders} />
      <SectionTitle>Calendar</SectionTitle>
      <ToggleRow label="Week starts on Monday" value={weekStartsMonday} onChange={setWeekStartsMonday} />
      <AppVersion />
    </Screen>
  );
}
