import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center rounded-md text-sm font-medium disabled:opacity-50", {
  variants: {
    variant: { default: "bg-foreground text-background", outline: "border border-border", ghost: "hover:bg-border" },
    size: { default: "h-9 px-4", sm: "h-8 px-3" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
