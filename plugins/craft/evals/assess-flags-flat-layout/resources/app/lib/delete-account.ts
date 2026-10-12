import { http } from "./http";
import { clearSession } from "./auth-session";

export async function deleteAccount() {
  await http.del<void>("/me");
  await clearSession();
}
