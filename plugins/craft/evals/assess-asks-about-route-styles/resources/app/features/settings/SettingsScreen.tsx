import { Heading, Page } from "../../shared/ui";
import { LocationPicker } from "./LocationPicker";

export function SettingsScreen() {
  return (
    <Page>
      <Heading title="Settings" subtitle="Where you are and how cold you get." />
      <LocationPicker />
    </Page>
  );
}
