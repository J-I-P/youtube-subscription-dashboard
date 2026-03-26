import { useMemo, useState } from "react";
import { MdSubscriptions } from "react-icons/md";
import { ChannelCard } from "./components/ChannelCard";
import { CountryFilter } from "./components/CountryFilter";
import { SearchBar } from "./components/SearchBar";
import { SortBar, type SortKey, type SortOrder } from "./components/SortBar";
import { useSubscriptions } from "./hooks/useSubscriptions";

const UNKNOWN = "Unknown";

export default function App() {
  const { data, status, error } = useSubscriptions();
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

  const channels = useMemo(() => {
    if (!data) return [];

    const filtered = data.channels.filter((c) => {
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
      } else {
        const aVal = a[sort] ?? -1;
        const bVal = b[sort] ?? -1;
        cmp = aVal - bVal;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }, [data, query, sort, sortOrder, selectedCountries]);

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
                No channels match &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {channels.map((channel) => (
                  <ChannelCard key={channel.id} channel={channel} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
