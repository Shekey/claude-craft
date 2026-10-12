import { Share } from "react-native";

export const shareStreak = (habit: string, days: number) => Share.share({ message: `${days} days of ${habit}!` });
