import { useLocalSearchParams } from "expo-router";
import { AddItemScreen } from "../features/closet/AddItemScreen";

export default function AddItem() {
  const { category } = useLocalSearchParams<{ category?: "jacket" | "shoe" }>();
  return <AddItemScreen category={category ?? "jacket"} />;
}
