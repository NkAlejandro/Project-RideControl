import { useLiveQuery } from "dexie-react-hooks";
import { distributionRepository } from "@/database/repositories/distribution-repository";
import { useAppStore } from "@/store/use-app-store";

export function useDistributions() {
  const profile = useAppStore((s) => s.profile);

  const distributions = useLiveQuery(
    () => profile ? distributionRepository.getByProfile(profile.id) : Promise.resolve([]),
    [profile],
    [],
  );

  const loading = distributions === undefined;

  return { distributions, loading };
}
