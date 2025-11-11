import { useAuth } from "@/contexts/AuthContext";

export function useBackend() {
  const { backend } = useAuth();
  return backend;
}
