import { http } from "./http";

export const requestDataExport = () => http.post<{ url: string }>("/me/export", {});
