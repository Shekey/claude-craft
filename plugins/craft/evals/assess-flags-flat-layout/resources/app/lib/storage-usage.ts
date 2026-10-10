import AsyncStorage from "@react-native-async-storage/async-storage";

export async function storageUsageBytes() {
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  return pairs.reduce((sum, [, v]) => sum + (v?.length ?? 0), 0);
}
