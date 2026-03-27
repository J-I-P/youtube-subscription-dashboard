import { useTranslation } from "react-i18next";

export type SortKey = "title" | "subscriberCount" | "videoCount" | "lastVideo";
export type SortOrder = "asc" | "desc";

interface Props {
  sort: SortKey;
  sortOrder: SortOrder;
  onSortChange: (sort: SortKey) => void;
  onSortOrderChange: (order: SortOrder) => void;
}

export function SortBar({ sort, sortOrder, onSortChange, onSortOrderChange }: Props) {
  const { t } = useTranslation();

  const OPTIONS: { value: SortKey; labelKey: string }[] = [
    { value: "title", labelKey: "sort.name" },
    { value: "subscriberCount", labelKey: "sort.subscribers" },
    { value: "videoCount", labelKey: "sort.videos" },
    { value: "lastVideo", labelKey: "sort.lastVideo" },
  ];

  function handleSortClick(key: SortKey) {
    if (key === sort) {
      onSortOrderChange(sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key);
    }
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{t("sort.label")}</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSortClick(opt.value)}
          className={`px-3 py-1 rounded-full border transition-colors flex items-center gap-1 ${
            sort === opt.value
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {t(opt.labelKey)}
          {sort === opt.value && (
            <span aria-label={sortOrder === "asc" ? t("sort.ascending") : t("sort.descending")}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
