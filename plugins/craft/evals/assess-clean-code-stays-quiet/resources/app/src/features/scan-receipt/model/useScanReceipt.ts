import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { expenseApi, type ScannedReceipt } from "../../../entities/expense";
import { track } from "../../../shared/lib";

export type Source = "camera" | "library";

type PickedImage = { uri: string; base64: string };

export type ScanResult =
  | { kind: "cancelled" }
  | { kind: "denied"; source: Source }
  | { kind: "failed" }
  | { kind: "unreadable"; image: PickedImage }
  | { kind: "read"; image: PickedImage; scan: ScannedReceipt };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };

async function pickImage(source: Source): Promise<PickedImage | "denied" | "cancelled" | "failed"> {
  const permission =
    source === "camera" ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return "denied";
  const result = source === "camera" ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS) : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return "cancelled";
  const resized = await ImageManipulator.manipulateAsync(asset.uri, [{ resize: { width: 900 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  return resized.base64 ? { uri: resized.uri, base64: resized.base64 } : "failed";
}

export function useScanReceipt() {
  const [scanning, setScanning] = useState(false);

  const scan = async (source: Source): Promise<ScanResult> => {
    if (scanning) return { kind: "cancelled" };
    setScanning(true);
    try {
      const image = await pickImage(source);
      if (image === "denied") return { kind: "denied", source };
      if (image === "cancelled") return { kind: "cancelled" };
      if (image === "failed") return { kind: "failed" };
      try {
        const result = await expenseApi.scanReceipt(image.base64);
        track("receipt_scanned", { source });
        return { kind: "read", image, scan: result };
      } catch {
        return { kind: "unreadable", image };
      }
    } catch {
      return { kind: "failed" };
    } finally {
      setScanning(false);
    }
  };

  return { scan, scanning };
}
