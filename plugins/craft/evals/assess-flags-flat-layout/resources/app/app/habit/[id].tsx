import { useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
import { toDateKey } from "../../lib/dates";
import { useCheckIn, useCheckIns, useHabit } from "../../lib/habit-queries";
import { currentStreak } from "../../lib/streaks";

export default function HabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: habit } = useHabit(id);
  const { data: checkIns = [] } = useCheckIns(id);
  const checkIn = useCheckIn(id);
  if (!habit) return null;
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20 }}>{habit.name}</Text>
      <Text>{currentStreak(checkIns, new Date())} day streak</Text>
      <Button title="Check in today" onPress={() => checkIn.mutate(toDateKey(new Date()))} />
    </View>
  );
}
