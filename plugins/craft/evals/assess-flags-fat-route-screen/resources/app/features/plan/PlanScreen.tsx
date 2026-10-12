import { Button, Heading, Page } from "../../shared/ui";
import { useGoBack } from "../../shared/nav";

export function PlanScreen() {
  const goBack = useGoBack();
  return (
    <Page>
      <Heading title="When will you be home?" subtitle="We plan for the whole time you're outside." />
      <Button label="Done" onPress={goBack} />
    </Page>
  );
}
