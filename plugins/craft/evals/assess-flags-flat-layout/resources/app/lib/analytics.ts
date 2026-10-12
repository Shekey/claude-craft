export const track = (event: string, props?: Record<string, unknown>) => console.log("[track]", event, props ?? {});
