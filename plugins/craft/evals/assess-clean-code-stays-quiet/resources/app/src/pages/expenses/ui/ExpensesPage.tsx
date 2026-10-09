import { Link } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { CATEGORIES, useExpenses } from "../../../entities/expense";
import { formatMoney } from "../../../shared/lib";
import { Button, Page, Row } from "../../../shared/ui";

export function ExpensesPage() {
  const { status, refresh } = useExpenses();

  if (status.kind === "loading") {
    return (
      <Page>
        <Text>Loading…</Text>
      </Page>
    );
  }

  if (status.kind === "failed") {
    return (
      <Page>
        <Text>Couldn't load your expenses.</Text>
        <Button label="Try again" onPress={refresh} />
      </Page>
    );
  }

  return (
    <Page>
      <FlatList
        data={status.expenses}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text>No expenses yet.</Text>}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/add-expense", params: { id: item.id } }}>
            <Row>
              <Text>{item.title}</Text>
              <View>
                <Text>{formatMoney(item.amountCents, item.currency)}</Text>
                <Text>{CATEGORIES[item.category].label}</Text>
              </View>
            </Row>
          </Link>
        )}
      />
      <Link href="/add-expense">Add expense</Link>
    </Page>
  );
}
