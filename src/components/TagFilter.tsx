import { useTranslation } from "react-i18next";

interface Props {
  tagNames: string[];
  tagCounts: Record<string, number>;
  selected: Set<string>;
  onToggle: (tag: string) => void;
  onClear: () => void;
}

export function TagFilter({ tagNames, tagCounts, selected, onToggle, onClear }: Props) {
  const { t } = useTranslation();
  if (tagNames.length === 0) return null;

  const regular = tagNames.filter((tag) => tag !== "__no_tag__");
  const hasNoTag = tagNames.includes("__no_tag__");

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{t("tags.label")}:</span>
      {regular.map((tag) => (
        <button
          key={tag}
          onClick={() => onToggle(tag)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full border transition-colors ${
            selected.has(tag)
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {tag}
          {(tagCounts[tag] ?? 0) > 0 && (
            <span className="text-xs opacity-60">({tagCounts[tag]})</span>
          )}
        </button>
      ))}
      {hasNoTag && (
        <button
          onClick={() => onToggle("__no_tag__")}
          className={`px-3 py-1 rounded-full border transition-colors ${
            selected.has("__no_tag__")
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {t("tags.noTag")}
        </button>
      )}
      {selected.size > 0 && (
        <button
          onClick={onClear}
          className="px-3 py-1 rounded-full border border-dashed border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:border-gray-600 transition-colors"
        >
          {t("tags.clear")}
        </button>
      )}
    </div>
  );
}
