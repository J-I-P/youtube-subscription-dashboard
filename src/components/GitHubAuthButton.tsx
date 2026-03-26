import { useState } from "react";
import { MdClose, MdSync } from "react-icons/md";
import type { AuthStatus, GitHubUser } from "../hooks/useGitHubAuth";

interface Props {
  status: AuthStatus;
  user: GitHubUser | null;
  error: string | null;
  syncing: boolean;
  onLoginWithToken: (token: string) => void;
  onLogout: () => void;
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4 fill-current flex-shrink-0" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function GitHubAuthButton({ status, user, error, syncing, onLoginWithToken, onLogout }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pat, setPat] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = pat.trim();
    if (!trimmed) return;
    onLoginWithToken(trimmed);
    setModalOpen(false);
    setPat("");
  }

  if (status === "authenticated" && user) {
    return (
      <div className="flex items-center gap-2 ml-auto">
        {syncing && (
          <MdSync className="text-gray-400 dark:text-gray-500 animate-spin text-base flex-shrink-0" title="同步中…" />
        )}
        <img src={user.avatar_url} alt={user.login} className="w-7 h-7 rounded-full flex-shrink-0" />
        <span className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block">@{user.login}</span>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          登出
        </button>
      </div>
    );
  }

  if (status === "validating") {
    return (
      <div className="flex items-center gap-2 ml-auto text-sm text-gray-500 dark:text-gray-400">
        <MdSync className="animate-spin" />
        <span>驗證中…</span>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="ml-auto flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400 rounded-lg px-3 py-1.5 transition-colors"
        title="登入後可跨裝置同步最愛"
      >
        <GitHubIcon />
        <span className="hidden sm:inline">登入以同步最愛</span>
        <span className="sm:hidden">同步最愛</span>
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
                <GitHubIcon />
                使用 GitHub 同步最愛
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MdClose />
              </button>
            </div>

            <ol className="text-sm text-gray-600 dark:text-gray-300 space-y-1.5 list-decimal list-inside">
              <li>
                點擊開啟{" "}
                <a
                  href="https://github.com/settings/tokens/new?scopes=gist&description=YouTube+Dashboard+Favorites"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  GitHub Token 建立頁面
                </a>
              </li>
              <li>
                確認只勾選{" "}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">gist</code>{" "}
                權限，點擊「Generate token」
              </li>
              <li>複製產生的 token 貼到下方</li>
            </ol>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                autoFocus
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={!pat.trim()}
                className="w-full rounded-lg bg-gray-900 dark:bg-gray-100 hover:bg-gray-700 dark:hover:bg-white text-white dark:text-gray-900 font-semibold py-2 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <GitHubIcon />
                確認並登入
              </button>
            </form>

            <p className="text-xs text-gray-400 dark:text-gray-500">
              Token 只儲存在你的瀏覽器 localStorage，不會傳送給任何第三方。
            </p>
          </div>
        </div>
      )}
    </>
  );
}
