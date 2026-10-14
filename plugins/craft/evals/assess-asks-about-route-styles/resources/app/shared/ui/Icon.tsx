import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { IconName } from "./index";

export function Icon({ name, size, color }: { name: IconName; size: number; color: string }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
