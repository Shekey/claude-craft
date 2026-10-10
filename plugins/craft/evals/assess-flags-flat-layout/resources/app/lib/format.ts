export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
export const formatTime = (hhmm: string) => hhmm.replace(/^0/, "");
