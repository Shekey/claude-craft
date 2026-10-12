import { FlatList } from "react-native";
import { HabitRow } from "../components/habit-row";
import { useHabits } from "../lib/habit-queries";

export default function HabitsScreen() {
  const { data: habits = [] } = useHabits();
  return <FlatList data={habits} keyExtractor={(h) => h.id} renderItem={({ item }) => <HabitRow habit={item} streak={0} />} />;
}
