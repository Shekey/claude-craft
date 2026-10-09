import type { ReactNode } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

export const Page = ({ children }: { children: ReactNode }) => <View style={{ flex: 1, padding: 16, gap: 12 }}>{children}</View>;
export const Row = ({ children }: { children: ReactNode }) => <View style={{ flexDirection: "row", justifyContent: "space-between" }}>{children}</View>;
export const Label = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: "600" }}>{children}</Text>;
export const Field = (props: { value: string; onChangeText: (v: string) => void; placeholder?: string; keyboardType?: "decimal-pad" }) => (
  <TextInput {...props} style={{ borderWidth: 1, borderRadius: 8, padding: 10 }} />
);
export const Button = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
  <Pressable onPress={onPress} disabled={disabled} style={{ padding: 12, borderRadius: 8, backgroundColor: disabled ? "#ccc" : "#222" }}>
    <Text style={{ color: "white", textAlign: "center" }}>{label}</Text>
  </Pressable>
);
export const ErrorBox = ({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) => (
  <View style={{ padding: 12, backgroundColor: "#fee" }}>
    <Text>{message}</Text>
    {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
  </View>
);
export const Toast = { show: (message: string) => console.log("[toast]", message) };
