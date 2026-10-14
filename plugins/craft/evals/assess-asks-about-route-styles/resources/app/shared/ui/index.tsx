import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, type TextStyle, View, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { color, type } from "../theme/theme";

export type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];
type Tone = "default" | "warn";
const BUTTON_BG = { primary: color.accent, soft: color.surface, text: "transparent" } as const;

export const Page = ({ children, bottomPad = 24 }: { children: ReactNode; bottomPad?: number }) => (
  <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: bottomPad }}>{children}</ScrollView>
);
export const TopBar = ({ back }: { back?: boolean }) => {
  const router = useRouter();
  if (!back) return null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ height: 44, justifyContent: "center" }}>
      <MaterialCommunityIcons name="chevron-left" size={28} color={color.body} />
    </Pressable>
  );
};
export const Heading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={{ gap: 6 }}>
    <Text style={type.title}>{title}</Text>
    {subtitle ? <Text style={type.small}>{subtitle}</Text> : null}
  </View>
);
export const Title = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[type.title, style]}>{children}</Text>;
export const Small = ({ children, style }: { children: ReactNode; style?: TextStyle }) => <Text style={[type.small, style]}>{children}</Text>;
export const Caps = ({ children }: { children: ReactNode }) => <Text style={[type.small, { textTransform: "uppercase" }]}>{children}</Text>;
export const Card = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <View style={[{ backgroundColor: "#fff", borderRadius: 20, padding: 16 }, style]}>{children}</View>
);
export const Panel = ({ children, tone = "default" }: { children: ReactNode; tone?: Tone }) => (
  <View style={{ backgroundColor: tone === "warn" ? "#FFF4E5" : color.surface, borderRadius: 20, padding: 16, gap: 10 }}>{children}</View>
);
export const Divider = () => <View style={{ height: 1, backgroundColor: "#E4E7EC" }} />;
export const Chip = ({ label }: { label: string }) => <Text style={[type.small, { borderRadius: 12, paddingHorizontal: 10 }]}>{label}</Text>;
export const SectionHeader = ({ title, action }: { title: string; action?: string }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <Caps>{title}</Caps>
    {action ? <Caps>{action}</Caps> : null}
  </View>
);
export const Row = ({ icon, title, detail, tone = "default" }: { icon: IconName; title: string; detail?: string; tone?: Tone }) => (
  <View style={{ flexDirection: "row", gap: 12 }}>
    <MaterialCommunityIcons name={icon} size={22} color={tone === "warn" ? color.warn : color.accent} />
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={type.title}>{title}</Text>
      {detail ? <Text style={type.small}>{detail}</Text> : null}
    </View>
  </View>
);
export const Button = ({ label, onPress, busy, disabled, kind = "primary" }: { label: string; onPress: () => void; busy?: boolean; disabled?: boolean; icon?: IconName; kind?: "primary" | "soft" | "text" }) => (
  <Pressable
    accessibilityRole="button"
    accessibilityState={{ busy, disabled: busy || disabled }}
    onPress={onPress}
    disabled={busy || disabled}
    style={{ minHeight: 48, justifyContent: "center", alignItems: "center", borderRadius: 14, backgroundColor: BUTTON_BG[kind] }}
  >
    {busy ? <ActivityIndicator /> : <Text style={[type.title, { color: kind === "primary" ? "#fff" : color.accent }]}>{label}</Text>}
  </Pressable>
);
export const Display = ({ children }: { children: ReactNode }) => <Text style={type.big}>{children}</Text>;
export const ErrorPanel = ({ title, body, reference }: { title: string; body: string; reference?: string }) => (
  <Panel tone="warn">
    <Text style={type.title}>{title}</Text>
    <Text style={type.small}>{reference ? `${body} (ref ${reference})` : body}</Text>
  </Panel>
);
export const Tap = ({ children, label, selected, onPress, className, style }: { children: ReactNode; label: string; selected?: boolean; onPress: () => void; className?: string; style?: ViewStyle }) => (
  <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress} className={className} style={style}>
    {children}
  </Pressable>
);
export const TextLink = ({ label, size = 16, onPress, style }: { label: string; size?: number; onPress: () => void; style?: TextStyle }) => (
  <Text accessibilityRole="link" onPress={onPress} style={[type.body, { fontSize: size, color: color.accent }, style]}>
    {label}
  </Text>
);
