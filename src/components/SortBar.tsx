export type SortKey = "title" | "subscriberCount" | "videoCount";

interface Props {
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
}

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "title", label: "Name" },
  { value: "subscriberCount", label: "Subscribers" },
  { value: "videoCount", label: "Videos" },
];

export function SortBar({ sort, onSortChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">Sort by:</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSortChange(opt.value)}
          className={`px-3 py-1 rounded-full border transition-colors ${
            sort === opt.value
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
