import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { track } from "../lib/analytics";
import { EVENTS } from "../lib/analytics-events";
import { APP_VERSION } from "../lib/app-version";
import { initials } from "../lib/avatar";
import { queryClient } from "../lib/cache";
import { deleteAccount } from "../lib/delete-account";
import { messageFor } from "../lib/errors";
import { requestDataExport } from "../lib/export-data";
import { sendFeedback } from "../lib/feedback";
import { LANGUAGES, type LanguageCode } from "../lib/language";
import { loadLanguage, saveLanguage } from "../lib/language-settings";
import { ensureNotificationPermission } from "../lib/notifications-permissions";
import { loadNotificationSettings, type NotificationSettings, saveNotificationSettings } from "../lib/notifications-settings";
import { loadPrivacy, type PrivacySettings, savePrivacy } from "../lib/privacy-settings";
import { useProfile, useUpdateProfile } from "../lib/profile-hooks";
import { openStoreReview } from "../lib/rate-app";
import { storageUsageBytes } from "../lib/storage-usage";
import { usePlans, useSubscribe } from "../lib/subscription-hooks";
import type { ThemeName } from "../lib/theme";
import { loadTheme, saveTheme } from "../lib/theme-settings";
import { Card, RowButton, ToggleRow } from "./ui";

export function ProfileCard() {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [name, setName] = useState("");
  if (!profile) return null;
  return (
    <Card title="Profile">
      <Text>{initials(profile.name)} · {profile.email}</Text>
      <TextInput value={name} onChangeText={setName} placeholder={profile.name} style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
      <RowButton label={update.isPending ? "Saving..." : "Save name"} onPress={() => update.mutate({ name })} />
    </Card>
  );
}

export function NotificationsCard() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  useEffect(() => {
    loadNotificationSettings().then(setSettings);
  }, []);
  if (!settings) return null;
  const change = async (next: NotificationSettings) => {
    if (next.enabled && !(await ensureNotificationPermission())) return;
    setSettings(next);
    await saveNotificationSettings(next);
    track(EVENTS.settingsChanged, { notifications: next.enabled });
  };
  return (
    <Card title="Notifications">
      <ToggleRow label="Reminders" value={settings.enabled} onChange={(enabled) => change({ ...settings, enabled })} />
      <ToggleRow
        label="Quiet hours (22:00-07:00)"
        value={settings.quietHours !== null}
        onChange={(on) => change({ ...settings, quietHours: on ? { from: "22:00", to: "07:00" } : null })}
      />
    </Card>
  );
}

export function PrivacyCard() {
  const [privacy, setPrivacy] = useState<PrivacySettings | null>(null);
  useEffect(() => {
    loadPrivacy().then(setPrivacy);
  }, []);
  if (!privacy) return null;
  const change = (next: PrivacySettings) => {
    setPrivacy(next);
    savePrivacy(next);
  };
  return (
    <Card title="Privacy">
      <ToggleRow label="Share anonymous analytics" value={privacy.shareAnalytics} onChange={(v) => change({ ...privacy, shareAnalytics: v })} />
      <ToggleRow label="Show me on the leaderboard" value={privacy.showOnLeaderboard} onChange={(v) => change({ ...privacy, showOnLeaderboard: v })} />
    </Card>
  );
}

export function ThemeCard() {
  const [theme, setTheme] = useState<ThemeName>("system");
  useEffect(() => {
    loadTheme().then(setTheme);
  }, []);
  const choose = (t: ThemeName) => {
    setTheme(t);
    saveTheme(t);
  };
  return (
    <Card title="Appearance">
      {(["light", "dark", "system"] as const).map((t) => (
        <RowButton key={t} label={`${t === theme ? "● " : "○ "}${t}`} onPress={() => choose(t)} />
      ))}
    </Card>
  );
}

export function LanguageCard() {
  const [language, setLanguage] = useState<LanguageCode>("en");
  useEffect(() => {
    loadLanguage().then(setLanguage);
  }, []);
  return (
    <Card title="Language">
      {LANGUAGES.map((l) => (
        <RowButton
          key={l.code}
          label={`${l.code === language ? "● " : "○ "}${l.label}`}
          onPress={() => {
            setLanguage(l.code);
            saveLanguage(l.code);
          }}
        />
      ))}
    </Card>
  );
}

export function SubscriptionCard() {
  const { data: plans } = usePlans();
  const subscribeTo = useSubscribe();
  return (
    <Card title="Subscription">
      {plans?.map((plan) => (
        <RowButton
          key={plan.id}
          label={`${plan.id} · ${plan.price}`}
          onPress={() => subscribeTo.mutate(plan.id, { onSuccess: () => track(EVENTS.subscriptionStarted, { plan: plan.id }) })}
        />
      ))}
    </Card>
  );
}

export function StorageCard() {
  const [bytes, setBytes] = useState<number | null>(null);
  useEffect(() => {
    storageUsageBytes().then(setBytes);
  }, []);
  return (
    <Card title="Storage">
      <Text>{bytes === null ? "Calculating..." : `${Math.round(bytes / 1024)} KB used on this device`}</Text>
      <RowButton label="Clear cached data" onPress={() => queryClient.clear()} />
    </Card>
  );
}

export function DataCard() {
  const [status, setStatus] = useState<string | null>(null);
  const exportData = async () => {
    try {
      const { url } = await requestDataExport();
      setStatus(`Export ready: ${url}`);
    } catch (error) {
      setStatus(messageFor(error));
    }
  };
  return (
    <Card title="Your data">
      <RowButton label="Export my data" onPress={exportData} />
      <RowButton label="Delete my account" onPress={() => deleteAccount().then(() => router.replace("/"))} />
      {status ? <Text>{status}</Text> : null}
    </Card>
  );
}

export function AboutCard() {
  const [message, setMessage] = useState("");
  return (
    <Card title="About">
      <Text>Version {APP_VERSION}</Text>
      <RowButton label="Rate the app" onPress={openStoreReview} />
      <TextInput value={message} onChangeText={setMessage} placeholder="Send us feedback" style={{ borderWidth: 1, borderRadius: 8, padding: 8 }} />
      <RowButton label="Send" onPress={() => sendFeedback(message).then(() => setMessage(""))} />
    </Card>
  );
}
