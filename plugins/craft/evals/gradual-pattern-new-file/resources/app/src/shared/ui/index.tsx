import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export const Screen = ({ children }: { children: ReactNode }) => <View style={{ flex: 1, padding: 16, gap: 12 }}>{children}</View>;
export const Title = ({ children }: { children: ReactNode }) => <Text style={{ fontSize: 20, fontWeight: "600" }}>{children}</Text>;
export const Muted = ({ children }: { children: ReactNode }) => <Text style={{ color: "#666" }}>{children}</Text>;
export const Button = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ padding: 12, borderRadius: 8, backgroundColor: "#222" }}>
    <Text style={{ color: "white", textAlign: "center" }}>{label}</Text>
  </Pressable>
);
