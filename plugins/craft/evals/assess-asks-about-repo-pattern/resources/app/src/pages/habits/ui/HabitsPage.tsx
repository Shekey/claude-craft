import { Link } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { type Habit, useHabits } from "../../../entities/habit";
import { Muted, Screen, Title } from "../../../shared/ui";

type Row = Habit & { streak: number };

function HabitRow({ habit }: { habit: Row }) {
  return (
    <Link href={`/habit/${habit.id}`}>
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ fontWeight: "600" }}>{habit.name}</Text>
        <Muted>{habit.streak} day streak</Muted>
      </View>
    </Link>
  );
}

function EmptyState() {
  return (
    <View style={{ alignItems: "center", padding: 32 }}>
      <Title>No habits yet</Title>
      <Muted>Add one to start a streak.</Muted>
    </View>
  );
}

function HabitsHeader({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Title>Habits</Title>
      <Muted>{count} active</Muted>
    </View>
  );
}

export function HabitsPage() {
  const { data: habits = [] } = useHabits();
  return (
    <Screen>
      <HabitsHeader count={habits.length} />
      <FlatList data={habits} keyExtractor={(h) => h.id} renderItem={({ item }) => <HabitRow habit={item} />} ListEmptyComponent={EmptyState} />
    </Screen>
  );
}
