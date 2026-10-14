import { useState } from "react";
import { Button, Small } from "../../shared/ui";

export function LocationPicker() {
  const [area, setArea] = useState<string | null>(null);
  return area ? <Small>Using {area}</Small> : <Button label="Use my rough location" kind="soft" onPress={() => setArea("your area")} />;
}
