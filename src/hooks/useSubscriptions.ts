import { useEffect, useState } from "react";
import type { SubscriptionsData } from "../types/youtube";

type Status = "idle" | "loading" | "success" | "error";

export function useSubscriptions() {
  const [data, setData] = useState<SubscriptionsData | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus("loading");
    fetch(import.meta.env.BASE_URL + "data/subscriptions.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<SubscriptionsData>;
      })
      .then((json) => {
        setData(json);
        setStatus("success");
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
        setStatus("error");
      });
  }, []);

  return { data, status, error };
}
