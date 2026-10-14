import { useRouter } from "expo-router";
import { Button, Display, Page, Small } from "../shared/ui";
import { useApp } from "../state/app-state";

export default function Welcome() {
  const router = useRouter();
  const { place } = useApp();
  return (
    <Page>
      <Display>What to wear, decided.</Display>
      <Small>{place ? `Planning for ${place.label.split(",")[0]}.` : "Two quick questions and you're set."}</Small>
      <Button label="Get started" onPress={() => router.push(place ? "/" : "/onboarding")} />
    </Page>
  );
}
