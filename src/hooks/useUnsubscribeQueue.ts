import { useCallback, useEffect, useRef, useState } from "react";

const QUEUE_FILENAME = "yt-dashboard-unsubscribe-queue.json";
const QUEUE_DESCRIPTION = "YouTube Subscription Dashboard - Unsubscribe Queue";

async function findQueueGist(token: string): Promise<string | null> {
  const res = await fetch("https://api.github.com/gists?per_page=100", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to list gists");
  const gists: Array<{ id: string; files: Record<string, unknown> }> = await res.json();
  return gists.find((g) => QUEUE_FILENAME in g.files)?.id ?? null;
}

async function readQueue(token: string, gistId: string): Promise<string[]> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  try {
    return JSON.parse(data.files?.[QUEUE_FILENAME]?.content ?? "[]") as string[];
  } catch {
    return [];
  }
}

async function writeQueue(token: string, gistId: string | null, ids: string[]): Promise<string> {
  const body = {
    description: QUEUE_DESCRIPTION,
    public: false,
    files: { [QUEUE_FILENAME]: { content: JSON.stringify(ids) } },
  };
  if (gistId) {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return gistId;
  }
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.id as string;
}

export function useUnsubscribeQueue(token: string | null) {
  const [queue, setQueue] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const gistIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing queue from Gist when token is available
  useEffect(() => {
    if (!token) {
      setQueue(new Set());
      return;
    }
    (async () => {
      setSyncing(true);
      try {
        const id = await findQueueGist(token);
        if (id) {
          gistIdRef.current = id;
          const ids = await readQueue(token, id);
          setQueue(new Set(ids));
        }
      } catch (e) {
        console.error("Unsubscribe queue load error:", e);
      } finally {
        setSyncing(false);
      }
    })();
  }, [token]);

  const scheduleSyncToGist = useCallback(
    (next: Set<string>) => {
      if (!token) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSyncing(true);
        try {
          const newId = await writeQueue(token, gistIdRef.current, [...next]);
          gistIdRef.current = newId;
        } catch (e) {
          console.error("Unsubscribe queue write error:", e);
        } finally {
          setSyncing(false);
        }
      }, 500);
    },
    [token]
  );

  const addToQueue = useCallback(
    (channelId: string) => {
      setQueue((prev) => {
        const next = new Set(prev);
        next.add(channelId);
        scheduleSyncToGist(next);
        return next;
      });
    },
    [scheduleSyncToGist]
  );

  const removeFromQueue = useCallback(
    (channelId: string) => {
      setQueue((prev) => {
        const next = new Set(prev);
        next.delete(channelId);
        scheduleSyncToGist(next);
        return next;
      });
    },
    [scheduleSyncToGist]
  );

  const isInQueue = useCallback((id: string) => queue.has(id), [queue]);

  return { queue, isInQueue, addToQueue, removeFromQueue, syncing };
}
