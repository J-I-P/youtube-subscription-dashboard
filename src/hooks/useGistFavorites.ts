import { useCallback, useEffect, useRef, useState } from "react";

const GIST_FILENAME = "yt-dashboard-favorites.json";
const GIST_DESCRIPTION = "YouTube Subscription Dashboard - Favorites";
const LOCAL_KEY = "yt-dashboard-favorites";

function loadLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

async function fetchGistList(token: string): Promise<Array<{ id: string; files: Record<string, unknown> }>> {
  const res = await fetch("https://api.github.com/gists?per_page=100", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to list gists");
  return res.json();
}

async function fetchGistContent(token: string, id: string): Promise<string> {
  const res = await fetch(`https://api.github.com/gists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return data.files?.[GIST_FILENAME]?.content ?? "[]";
}

async function patchGist(token: string, id: string, set: Set<string>): Promise<void> {
  await fetch(`https://api.github.com/gists/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify([...set]) } } }),
  });
}

async function createGist(token: string, set: Set<string>): Promise<string> {
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify([...set]) } },
    }),
  });
  const data = await res.json();
  return data.id as string;
}

export function useGistFavorites(token: string | null) {
  const [favorites, setFavorites] = useState<Set<string>>(loadLocal);
  const [syncing, setSyncing] = useState(false);
  const gistIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When token becomes available, load from Gist and merge with local
  useEffect(() => {
    if (!token) return;

    (async () => {
      setSyncing(true);
      try {
        const gists = await fetchGistList(token);
        const existing = gists.find((g) => GIST_FILENAME in g.files);

        if (existing) {
          gistIdRef.current = existing.id;
          const content = await fetchGistContent(token, existing.id);
          const remote = new Set<string>(JSON.parse(content) as string[]);
          const local = loadLocal();
          // Merge remote + local, then persist merged back if local had extra items
          const merged = new Set([...remote, ...local]);
          setFavorites(merged);
          if (local.size > 0) {
            await patchGist(token, existing.id, merged);
            localStorage.removeItem(LOCAL_KEY);
          }
        } else {
          // No Gist yet — create one from current local favorites
          const local = loadLocal();
          const newId = await createGist(token, local);
          gistIdRef.current = newId;
          localStorage.removeItem(LOCAL_KEY);
        }
      } catch (e) {
        console.error("Gist sync error:", e);
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
          if (gistIdRef.current) {
            await patchGist(token, gistIdRef.current, next);
          } else {
            const newId = await createGist(token, next);
            gistIdRef.current = newId;
          }
        } catch (e) {
          console.error("Gist write error:", e);
        } finally {
          setSyncing(false);
        }
      }, 1000);
    },
    [token]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);

        if (token) {
          scheduleSyncToGist(next);
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify([...next]));
        }
        return next;
      });
    },
    [token, scheduleSyncToGist]
  );

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  return { favorites, isFavorite, toggleFavorite, syncing };
}
