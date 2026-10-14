import { useRouter } from "expo-router";
import { Button, Heading, Page } from "../../shared/ui";
import { useApp } from "../../state/app-state";

export function TodayScreen() {
  const { rec } = useApp();
  const router = useRouter();
  return (
    <Page>
      <Heading title="Today" subtitle={rec ? "Your outfit is ready." : "Loading your plan…"} />
      {rec && <Button label="Settings" onPress={() => router.push("/settings")} />}
    </Page>
  );
}
