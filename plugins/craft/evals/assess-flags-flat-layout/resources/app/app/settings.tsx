import { ScrollView } from "react-native";
import {
  AboutCard,
  DataCard,
  LanguageCard,
  NotificationsCard,
  PrivacyCard,
  ProfileCard,
  StorageCard,
  SubscriptionCard,
  ThemeCard,
} from "../components/settings-cards";

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <ProfileCard />
      <NotificationsCard />
      <PrivacyCard />
      <ThemeCard />
      <LanguageCard />
      <SubscriptionCard />
      <StorageCard />
      <DataCard />
      <AboutCard />
    </ScrollView>
  );
}
