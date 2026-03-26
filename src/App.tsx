import { useMemo, useState } from "react";
import { MdSubscriptions } from "react-icons/md";
import { ChannelCard } from "./components/ChannelCard";
import { CountryFilter } from "./components/CountryFilter";
import { SearchBar } from "./components/SearchBar";
import { SortBar, type SortKey, type SortOrder } from "./components/SortBar";
import { useFavorites } from "./hooks/useFavorites";
import { useSubscriptions } from "./hooks/useSubscriptions";

const UNKNOWN = "Unknown";
type Tab = "all" | "this-week" | "favorites";

function isThisWeek(dateStr: string): boolean {
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return now - new Date(dateStr).getTime() <= sevenDays;
}

export default function App() {
  const { data, status, error } = useSubscriptions();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set());

  const availableCountries = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.channels.map((c) => c.country ?? UNKNOWN));
    return [...set].sort((a, b) => {
      if (a === UNKNOWN) return 1;
      if (b === UNKNOWN) return -1;
      return a.localeCompare(b);
    });
  }, [data]);

  const thisWeekCount = useMemo(() => {
    if (!data) return 0;
    return data.channels.filter(
      (c) => c.lastVideo && isThisWeek(c.lastVideo.publishedAt)
    ).length;
  }, [data]);

  const channels = useMemo(() => {
    if (!data) return [];

    const filtered = data.channels.filter((c) => {
      if (tab === "this-week") {
        if (!c.lastVideo || !isThisWeek(c.lastVideo.publishedAt)) return false;
      }
      if (tab === "favorites") {
        if (!isFavorite(c.id)) return false;
      }
      if (!c.title.toLowerCase().includes(query.toLowerCase())) return false;
      if (selectedCountries.size > 0) {
        const countryKey = c.country ?? UNKNOWN;
        if (!selectedCountries.has(countryKey)) return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      let cmp: number;
      if (sort === "title") {
        cmp = a.title.localeCompare(b.title);
      } else if (sort === "lastVideo") {
        const aDate = a.lastVideo?.publishedAt ? new Date(a.lastVideo.publishedAt).getTime() : 0;
        const bDate = b.lastVideo?.publishedAt ? new Date(b.lastVideo.publishedAt).getTime() : 0;
        cmp = aDate - bDate;
      } else {
        const aVal = a[sort] ?? -1;
        const bVal = b[sort] ?? -1;
        cmp = aVal - bVal;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [data, tab, query, sort, sortOrder, selectedCountries, favorites, isFavorite]);

  function toggleCountry(country: string) {
    setSelectedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(country)) next.delete(country);
      else next.add(country);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <MdSubscriptions className="text-2xl text-red-600" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            YouTube Subscriptions
          </h1>
          {data && (
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              {data.totalCount} channels
            </span>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">
        {status === "loading" && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-20">
            Loading subscriptions…
          </p>
        )}

        {status === "error" && (
          <p className="text-center text-red-500 py-20">
            Failed to load data: {error}
          </p>
        )}

        {status === "success" && data && (
          <>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setTab("all")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === "all"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                全部頻道
                <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {data.totalCount}
                </span>
              </button>
              <button
                onClick={() => setTab("this-week")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === "this-week"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                本週更新
                {thisWeekCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 min-w-[1.25rem]">
                    {thisWeekCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("favorites")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === "favorites"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                我的最愛
                {favorites.size > 0 && (
                  <span className="ml-1.5 inline-flex items-center justify-center text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 min-w-[1.25rem]">
                    {favorites.size}
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <SearchBar value={query} onChange={setQuery} />
              </div>
              <SortBar sort={sort} sortOrder={sortOrder} onSortChange={setSort} onSortOrderChange={setSortOrder} />
            </div>

            <CountryFilter
              countries={availableCountries}
              selected={selectedCountries}
              onToggle={toggleCountry}
              onClear={() => setSelectedCountries(new Set())}
            />

            {data.lastUpdated && (
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Last updated:{" "}
                {new Date(data.lastUpdated).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}

            {channels.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-20">
                {tab === "this-week" && !query
                  ? "本週沒有頻道更新影片。"
                  : tab === "favorites" && !query
                  ? "還沒有加入最愛的頻道，點擊頻道卡片上的 ♡ 來收藏。"
                  : `No channels match "${query}"`}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {channels.map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isFavorite={isFavorite(channel.id)}
                    onToggleFavorite={() => toggleFavorite(channel.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
