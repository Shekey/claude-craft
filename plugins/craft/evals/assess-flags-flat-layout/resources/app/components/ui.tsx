import type { ReactNode } from "react";
import { Pressable, Switch, Text, View } from "react-native";

export const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ padding: 16, borderRadius: 12, backgroundColor: "#f5f5f5", gap: 8 }}>
    <Text style={{ fontWeight: "600" }}>{title}</Text>
    {children}
  </View>
);
export const RowButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ paddingVertical: 8 }}>
    <Text>{label}</Text>
  </Pressable>
);
export const ToggleRow = ({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
    <Text>{label}</Text>
    <Switch value={value} onValueChange={onChange} />
  </View>
);
