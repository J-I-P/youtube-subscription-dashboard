import { useCallback, useEffect, useRef, useState } from "react";

const GIST_FILENAME = "yt-dashboard-tags.json";
const GIST_DESCRIPTION = "YouTube Subscription Dashboard - Tags";
const LOCAL_KEY = "yt-dashboard-tags";

interface TagsData {
  version: 1;
  userTags: Record<string, string[]>;
  userRemovedTags: Record<string, string[]>;
}

const DEFAULT_DATA: TagsData = { version: 1, userTags: {}, userRemovedTags: {} };

function loadLocal(): TagsData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw) as TagsData;
  } catch { /* ignore */ }
  return { ...DEFAULT_DATA };
}

function mergeTagsData(remote: TagsData, local: TagsData): TagsData {
  const userTags: Record<string, string[]> = { ...remote.userTags };
  for (const [channelId, tags] of Object.entries(local.userTags)) {
    userTags[channelId] = [...new Set([...(userTags[channelId] ?? []), ...tags])];
  }
  const userRemovedTags: Record<string, string[]> = { ...remote.userRemovedTags };
  for (const [channelId, tags] of Object.entries(local.userRemovedTags)) {
    userRemovedTags[channelId] = [...new Set([...(userRemovedTags[channelId] ?? []), ...tags])];
  }
  return { version: 1, userTags, userRemovedTags };
}

async function fetchGistList(token: string): Promise<Array<{ id: string; files: Record<string, unknown> }>> {
  const res = await fetch("https://api.github.com/gists?per_page=100", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to list gists");
  return res.json();
}

async function fetchGistContent(token: string, id: string): Promise<TagsData> {
  const res = await fetch(`https://api.github.com/gists/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const content = data.files?.[GIST_FILENAME]?.content ?? "{}";
  try {
    return JSON.parse(content) as TagsData;
  } catch {
    return { ...DEFAULT_DATA };
  }
}

async function patchGist(token: string, id: string, tagsData: TagsData): Promise<void> {
  await fetch(`https://api.github.com/gists/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(tagsData) } } }),
  });
}

async function createGist(token: string, tagsData: TagsData): Promise<string> {
  const res = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: { [GIST_FILENAME]: { content: JSON.stringify(tagsData) } },
    }),
  });
  const data = await res.json();
  return data.id as string;
}

export function useGistTags(token: string | null) {
  const [tagsData, setTagsData] = useState<TagsData>(loadLocal);
  const [syncing, setSyncing] = useState(false);
  const gistIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      setSyncing(true);
      try {
        const gists = await fetchGistList(token);
        const existing = gists.find((g) => GIST_FILENAME in g.files);
        if (existing) {
          gistIdRef.current = existing.id;
          const remote = await fetchGistContent(token, existing.id);
          const local = loadLocal();
          const merged = mergeTagsData(remote, local);
          setTagsData(merged);
          const hasLocal = Object.keys(local.userTags).length > 0 || Object.keys(local.userRemovedTags).length > 0;
          if (hasLocal) {
            await patchGist(token, existing.id, merged);
            localStorage.removeItem(LOCAL_KEY);
          }
        } else {
          const local = loadLocal();
          const newId = await createGist(token, local);
          gistIdRef.current = newId;
          localStorage.removeItem(LOCAL_KEY);
        }
      } catch (e) {
        console.error("Gist tags sync error:", e);
      } finally {
        setSyncing(false);
      }
    })();
  }, [token]);

  const scheduleSyncToGist = useCallback(
    (next: TagsData) => {
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
          console.error("Gist tags write error:", e);
        } finally {
          setSyncing(false);
        }
      }, 1000);
    },
    [token]
  );

  const getEffectiveTags = useCallback(
    (channelId: string, autoTags?: string[]): string[] => {
      const base = autoTags ?? [];
      const removed = tagsData.userRemovedTags[channelId] ?? [];
      const user = tagsData.userTags[channelId] ?? [];
      const visible = base.filter((t) => !removed.includes(t));
      return [...new Set([...visible, ...user])];
    },
    [tagsData]
  );

  const allUserTagNames = (() => {
    const all = new Set<string>();
    for (const tags of Object.values(tagsData.userTags)) {
      for (const t of tags) all.add(t);
    }
    return [...all].sort();
  })();

  const addUserTag = useCallback(
    (channelId: string, tagName: string) => {
      const trimmed = tagName.trim();
      if (!trimmed) return;
      setTagsData((prev) => {
        const existing = prev.userTags[channelId] ?? [];
        if (existing.includes(trimmed)) return prev;
        const next: TagsData = {
          ...prev,
          userTags: { ...prev.userTags, [channelId]: [...existing, trimmed] },
        };
        if (token) {
          scheduleSyncToGist(next);
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [token, scheduleSyncToGist]
  );

  const removeTag = useCallback(
    (channelId: string, tagName: string, autoTags: string[]) => {
      setTagsData((prev) => {
        let next: TagsData;
        if (autoTags.includes(tagName)) {
          const existingRemoved = prev.userRemovedTags[channelId] ?? [];
          next = {
            ...prev,
            userRemovedTags: {
              ...prev.userRemovedTags,
              [channelId]: [...new Set([...existingRemoved, tagName])],
            },
          };
        } else {
          const existing = prev.userTags[channelId] ?? [];
          next = {
            ...prev,
            userTags: {
              ...prev.userTags,
              [channelId]: existing.filter((t) => t !== tagName),
            },
          };
        }
        if (token) {
          scheduleSyncToGist(next);
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [token, scheduleSyncToGist]
  );

  return { getEffectiveTags, allUserTagNames, addUserTag, removeTag, syncing };
}
