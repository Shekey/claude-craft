import type { Item } from "@sww/engine";
import { Image, View } from "react-native";
import { color } from "../theme/theme";

export function ItemThumb({ item, size, radiusPx }: { item: Item; size: number; radiusPx: number }) {
  if (!item.photoUri) return <View style={{ width: size, height: size, borderRadius: radiusPx, backgroundColor: color.surface }} />;
  return <Image accessibilityLabel={item.name} source={{ uri: item.photoUri }} style={{ width: size, height: size, borderRadius: radiusPx }} />;
}
