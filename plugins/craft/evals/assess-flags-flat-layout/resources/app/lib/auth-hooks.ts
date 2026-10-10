import { useMutation } from "@tanstack/react-query";
import { signIn } from "./auth-api";
import { saveSession } from "./auth-session";

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => signIn(email, password),
    onSuccess: saveSession,
  });
}
