import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile, updateProfile } from "./profile-api";

export const useProfile = () => useQuery({ queryKey: ["me"], queryFn: getProfile });

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({ mutationFn: updateProfile, onSuccess: () => client.invalidateQueries({ queryKey: ["me"] }) });
}
