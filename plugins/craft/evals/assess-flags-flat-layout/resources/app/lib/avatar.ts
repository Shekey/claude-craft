export const initials = (name: string) => name.split(" ").map((p) => p[0]?.toUpperCase() ?? "").join("").slice(0, 2);
