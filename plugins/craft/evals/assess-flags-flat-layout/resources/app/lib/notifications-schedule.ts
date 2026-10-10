import * as Notifications from "expo-notifications";
import type { Habit } from "./habit-types";

export async function scheduleReminder(habit: Habit) {
  if (!habit.reminderAt) return;
  const [hour, minute] = habit.reminderAt.split(":").map(Number);
  await Notifications.scheduleNotificationAsync({
    identifier: habit.id,
    content: { title: habit.name, body: "Time for your habit" },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
}

export const cancelReminder = (habitId: string) => Notifications.cancelScheduledNotificationAsync(habitId);
