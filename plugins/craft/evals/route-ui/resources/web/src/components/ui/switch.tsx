import * as SwitchPrimitive from "@radix-ui/react-switch";
import type * as React from "react";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root className={cn("h-5 w-9 rounded-full border border-border data-[state=checked]:bg-foreground", className)} {...props}>
      <SwitchPrimitive.Thumb className="block size-4 rounded-full bg-background data-[state=checked]:translate-x-4" />
    </SwitchPrimitive.Root>
  );
}
