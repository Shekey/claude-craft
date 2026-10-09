import { Image, Text, View } from "react-native";
import { CATEGORIES, CATEGORY_KEYS, type Expense, type ExpenseDraft, type Receipt, receiptUri } from "../../../entities/expense";
import { Button, ErrorBox, Field, Label, Page, Row } from "../../../shared/ui";
import { useExpenseForm } from "../model/useExpenseForm";

type Props = { existing: Expense | null; initialDraft: ExpenseDraft; initialReceipt: Receipt };

export function ExpenseForm(props: Props) {
  const { draft, edit, receipt, removeReceipt, scanFrom, scanning, notice, saving, confirmAndSubmit } = useExpenseForm(props);
  const shown = receiptUri(receipt);

  return (
    <Page>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{props.existing ? "Edit expense" : "New expense"}</Text>

      {shown ? (
        <View style={{ gap: 8 }}>
          <Image source={{ uri: shown }} style={{ width: "100%", height: 200, borderRadius: 12 }} />
          {scanning && <Text>Reading your receipt…</Text>}
          <Row>
            <Button label="Replace" onPress={() => scanFrom("library")} disabled={scanning} />
            <Button label="Remove" onPress={removeReceipt} disabled={scanning} />
          </Row>
        </View>
      ) : (
        <Row>
          {receipt.kind === "saved-unavailable" && <Text>Receipt saved, preview unavailable.</Text>}
          <Button label="Scan receipt" onPress={() => scanFrom("camera")} disabled={scanning} />
          <Button label="From gallery" onPress={() => scanFrom("library")} disabled={scanning} />
        </Row>
      )}

      {notice.kind === "low-confidence" && <Text>Not sure about this one. Check the amount and date.</Text>}
      {notice.kind === "error" && <ErrorBox message={notice.message} />}

      <Label>Title</Label>
      <Field value={draft.title} onChangeText={(title) => edit({ title })} placeholder="e.g. Groceries" />
      <Label>Amount</Label>
      <Field value={draft.amount} onChangeText={(amount) => edit({ amount })} keyboardType="decimal-pad" placeholder="0.00" />
      <Label>Date</Label>
      <Field value={draft.date} onChangeText={(date) => edit({ date })} placeholder="YYYY-MM-DD" />
      <Label>Category</Label>
      <Row>
        {CATEGORY_KEYS.map((key) => (
          <Button key={key} label={key === draft.category ? `• ${CATEGORIES[key].label}` : CATEGORIES[key].label} onPress={() => edit({ category: key })} />
        ))}
      </Row>
      <Label>Note</Label>
      <Field value={draft.note} onChangeText={(note) => edit({ note })} />

      <Button label={props.existing ? "Save changes" : "Add expense"} onPress={confirmAndSubmit} disabled={saving || scanning} />
    </Page>
  );
}
