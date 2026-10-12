import { Button, Heading, Page } from "../../shared/ui";
import { useGoBack } from "../../shared/nav";

export function AddItemScreen({ category }: { category: "jacket" | "shoe" }) {
  const goBack = useGoBack();
  return (
    <Page>
      <Heading title={category === "jacket" ? "Add a jacket" : "Add shoes"} subtitle="Warmth and water protection are enough." />
      <Button label="Save" onPress={goBack} />
    </Page>
  );
}
