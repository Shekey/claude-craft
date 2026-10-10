export const messageFor = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong");
