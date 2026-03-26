import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "gh-favorites-token";

export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export type AuthStatus = "idle" | "validating" | "authenticated" | "error";

export function useGitHubAuth() {
  const [status, setStatus] = useState<AuthStatus>(() =>
    localStorage.getItem(TOKEN_KEY) ? "validating" : "idle"
  );
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validate stored token on mount
  useEffect(() => {
    if (!token) return;
    setStatus("validating");
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("invalid");
        return r.json() as Promise<GitHubUser>;
      })
      .then((data) => {
        setUser(data);
        setStatus("authenticated");
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setStatus("idle");
      });
  }, [token]);

  const loginWithToken = useCallback(async (pat: string) => {
    setStatus("validating");
    setError(null);
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${pat}` },
      });
      if (!res.ok) throw new Error("invalid");
      const data: GitHubUser = await res.json();
      localStorage.setItem(TOKEN_KEY, pat);
      setToken(pat);
      setUser(data);
      setStatus("authenticated");
    } catch {
      setStatus("error");
      setError("Token 無效，請確認有 gist 權限。");
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("idle");
    setError(null);
  }, []);

  return { status, token, user, error, loginWithToken, logout };
}

