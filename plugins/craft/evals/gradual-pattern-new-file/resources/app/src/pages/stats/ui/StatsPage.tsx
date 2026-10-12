import { Text, View } from "react-native";
import { useHabits } from "../../../entities/habit";
import { Muted, Screen, Title } from "../../../shared/ui";

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#f3f3f3" }}>
      <Text style={{ fontSize: 24, fontWeight: "700" }}>{value}</Text>
      <Muted>{label}</Muted>
    </View>
  );
}

function BestHabit({ name, streak }: { name: string; streak: number }) {
  return (
    <View style={{ padding: 12 }}>
      <Muted>Longest current streak</Muted>
      <Text style={{ fontWeight: "600" }}>
        {name} · {streak} days
      </Text>
    </View>
  );
}

export function StatsPage() {
  const { data: habits = [] } = useHabits();
  const best = [...habits].sort((a, b) => b.streak - a.streak)[0];
  const total = habits.reduce((sum, h) => sum + h.streak, 0);
  return (
    <Screen>
      <Title>Stats</Title>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <StatTile label="Habits" value={habits.length} />
        <StatTile label="Streak days" value={total} />
      </View>
      {best ? <BestHabit name={best.name} streak={best.streak} /> : null}
    </Screen>
  );
}
