import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { type CheckIn, currentStreak, useCheckIn, useCheckIns, useHabit } from "../../../entities/habit";
import { toDateKey } from "../../../shared/lib";
import { Button, Muted, Screen, Title } from "../../../shared/ui";

function StreakSummary({ checkIns }: { checkIns: CheckIn[] }) {
  return (
    <View style={{ padding: 12, borderRadius: 8, backgroundColor: "#f3f3f3" }}>
      <Text style={{ fontSize: 32, fontWeight: "700" }}>{currentStreak(checkIns, new Date())}</Text>
      <Muted>day streak</Muted>
    </View>
  );
}

function RecentCheckIns({ checkIns }: { checkIns: CheckIn[] }) {
  return (
    <View style={{ gap: 4 }}>
      {checkIns.slice(-7).map((c) => (
        <Muted key={c.date}>{c.date}</Muted>
      ))}
    </View>
  );
}

function CheckInButton({ habitId }: { habitId: string }) {
  const checkIn = useCheckIn(habitId);
  return <Button label={checkIn.isPending ? "Saving..." : "Check in today"} onPress={() => checkIn.mutate(toDateKey(new Date()))} />;
}

export function HabitPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: habit } = useHabit(id);
  const { data: checkIns = [] } = useCheckIns(id);
  if (!habit) return null;
  return (
    <Screen>
      <Title>{habit.name}</Title>
      <StreakSummary checkIns={checkIns} />
      <CheckInButton habitId={habit.id} />
      <RecentCheckIns checkIns={checkIns} />
    </Screen>
  );
}
