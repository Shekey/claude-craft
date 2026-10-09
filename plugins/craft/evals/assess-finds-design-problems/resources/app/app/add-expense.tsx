import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Text, View } from "react-native";
import { track } from "../lib/analytics";
import { api, receiptUrl, type Category, type Currency, type ScannedReceipt } from "../lib/api";
import { useApp } from "../lib/app-state";
import { Button, ErrorBox, Field, Label, Page, Row, Toast } from "../lib/ui";
import { CATEGORY_OPTIONS, isLikelyDuplicate, isOverMonthlyLimit } from "../lib/utils";

export default function AddExpense() {
  const router = useRouter();
  const app = useApp();
  const params = useLocalSearchParams<{ id?: string }>();
  const editing = app.expenses?.find((e) => e.id === params.id) ?? null;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [category, setCategory] = useState<Category>("food");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [receipt, setReceipt] = useState<{ uri: string; base64: string } | null>(null);
  const [savedReceipt, setSavedReceipt] = useState<string | null>(null);
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const loaded = useRef<string | null>(null);

  useEffect(() => {
    if (!editing || loaded.current === editing.id) return;
    loaded.current = editing.id;
    setTitle(editing.title);
    setAmount((editing.amountCents / 100).toFixed(2));
    setCurrency(editing.currency);
    setCategory(editing.category);
    setDate(editing.date);
    setNote(editing.note);
    if (editing.receiptId) receiptUrl(editing.receiptId).then(setSavedReceipt);
  }, [editing]);

  const categoryOption = CATEGORY_OPTIONS.find((o) => o.value === category)!;
  const shownReceipt = receipt ? receipt.uri : savedReceipt && !removeReceipt ? savedReceipt : null;

  const applyScan = (scan: ScannedReceipt) => {
    setTitle(scan.title);
    setAmount((scan.amountCents / 100).toFixed(2));
    setCurrency(scan.currency);
    setCategory(scan.category);
    setDate(scan.date);
    setLowConfidence(scan.confidence < 0.6);
  };

  const scan = async (source: "camera" | "library") => {
    setError(null);
    const permission =
      source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError({ message: source === "camera" ? "Camera access is off. Allow it in settings." : "Photo access is off. Allow it in settings." });
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };
    const result = source === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;
    const resized = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 900 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    const image = { uri: resized.uri, base64: resized.base64 ?? "" };
    setReceipt(image);
    setRemoveReceipt(false);
    setScanning(true);
    try {
      applyScan(await api.scanReceipt(image.base64));
      track("receipt_scanned", { source });
    } catch (e) {
      setError({ message: "We couldn't read that receipt. Fill it in by hand.", status: (e as { status?: number }).status });
    } finally {
      setScanning(false);
    }
  };

  const saveChecked = () => {
    const duplicate = editing
      ? null
      : isLikelyDuplicate(app.expenses ?? [], {
          title: title.trim(),
          amountCents: Math.round(Number.parseFloat(amount) * 100),
          currency,
          category,
          date,
          note: note.trim(),
        });
    if (!duplicate) return save();
    Alert.alert("Already added?", `This looks like "${duplicate.title}" on ${duplicate.date}.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Add anyway", onPress: () => save() },
    ]);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const body = {
      title: title.trim(),
      amountCents: Math.round(Number.parseFloat(amount) * 100),
      currency,
      category,
      date,
      note: note.trim(),
    };
    try {
      if (editing) {
        await api.updateExpense(editing.id, { ...body, ...(receipt ? { receiptBase64: receipt.base64 } : removeReceipt ? { removeReceipt: true } : {}) });
      } else {
        await api.addExpense({ ...body, ...(receipt ? { receiptBase64: receipt.base64 } : {}) });
      }
      await app.refreshExpenses();
      if (!editing) track("expense_added", { scanned: receipt !== null, category });
      if (isOverMonthlyLimit(app.expenses ?? [], category, date.slice(0, 7))) Toast.show(`You're over your ${categoryOption.label} budget this month`);
      else Toast.show(editing ? "Changes saved" : "Expense added");
      router.back();
    } catch (e) {
      setError({ message: "Saving failed. Try again.", status: (e as { status?: number }).status });
    } finally {
      setSaving(false);
    }
  };

  const errorAction =
    error?.status === 402
      ? { label: "See plans", run: () => router.push("/paywall") }
      : error?.status === 401
        ? { label: "Sign in again", run: () => router.push("/login") }
        : null;

  return (
    <Page>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>{editing ? "Edit expense" : "New expense"}</Text>

      {shownReceipt ? (
        <View style={{ gap: 8 }}>
          <Image source={{ uri: shownReceipt }} style={{ width: "100%", height: 200, borderRadius: 12 }} />
          {scanning && <Text>Reading your receipt…</Text>}
          <Row>
            <Button label="Replace" onPress={() => scan("library")} disabled={scanning} />
            <Button
              label="Remove"
              onPress={() => {
                setReceipt(null);
                setRemoveReceipt(true);
              }}
            />
          </Row>
        </View>
      ) : (
        <Row>
          <Button label="Scan receipt" onPress={() => scan("camera")} disabled={scanning} />
          <Button label="From gallery" onPress={() => scan("library")} disabled={scanning} />
        </Row>
      )}

      {lowConfidence && <Text>Not sure about this one. Check the amount and date.</Text>}
      {error && <ErrorBox message={error.message} actionLabel={errorAction?.label} onAction={errorAction?.run} />}

      <Label>Title</Label>
      <Field value={title} onChangeText={setTitle} placeholder="e.g. Groceries" />
      <Label>Amount</Label>
      <Field value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
      <Label>Date</Label>
      <Field value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
      <Label>Category</Label>
      <Row>
        {CATEGORY_OPTIONS.map((o) => (
          <Button key={o.value} label={o.value === category ? `• ${o.label}` : o.label} onPress={() => setCategory(o.value)} />
        ))}
      </Row>
      <Label>Note</Label>
      <Field value={note} onChangeText={setNote} />

      <Button label={editing ? "Save changes" : "Add expense"} onPress={saveChecked} disabled={saving || scanning || !title.trim() || !amount} />
    </Page>
  );
}
