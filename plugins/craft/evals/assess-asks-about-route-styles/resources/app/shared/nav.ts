import { useRouter } from "expo-router";

export function useGoBack() {
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace("/"));
}
