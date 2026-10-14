import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveKept(entry: { recId: string; home: string; via: string }): Promise<void> {
  await AsyncStorage.setItem(`kept:${entry.recId}`, JSON.stringify(entry));
}
