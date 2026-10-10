import { Link } from "expo-router";
import { Text, View } from "react-native";
import type { Habit } from "../lib/habit-types";

export function HabitRow({ habit, streak }: { habit: Habit; streak: number }) {
  return (
    <Link href={`/habit/${habit.id}`}>
      <View style={{ paddingVertical: 12 }}>
        <Text style={{ fontWeight: "600" }}>{habit.name}</Text>
        <Text>{streak} day streak</Text>
      </View>
    </Link>
  );
}
