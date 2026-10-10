import { http } from "./http";

export const sendFeedback = (message: string) => http.post<void>("/feedback", { message });
