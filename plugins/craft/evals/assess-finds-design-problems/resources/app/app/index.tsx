import { Link } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { useApp } from "../lib/app-state";
import { categoryLabel, formatMoney } from "../lib/utils";
import { Page, Row } from "../lib/ui";

export default function Expenses() {
  const { expenses } = useApp();

  return (
    <Page>
      <FlatList
        data={expenses ?? []}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => (
          <Link href={{ pathname: "/add-expense", params: { id: item.id } }}>
            <Row>
              <Text>{item.title}</Text>
              <View>
                <Text>{formatMoney(item.amountCents, item.currency)}</Text>
                <Text>{categoryLabel(item.category)}</Text>
              </View>
            </Row>
          </Link>
        )}
      />
      <Link href="/add-expense">Add expense</Link>
    </Page>
  );
}
