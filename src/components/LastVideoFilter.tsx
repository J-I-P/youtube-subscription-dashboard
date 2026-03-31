import { useTranslation } from "react-i18next";

export type LastVideoRange = "7d" | "30d" | "3m" | "6m" | "1y";

const RANGES: LastVideoRange[] = ["7d", "30d", "3m", "6m", "1y"];

export function isWithinRange(dateStr: string | null | undefined, range: LastVideoRange): boolean {
  if (!dateStr) return false;
  const now = Date.now();
  const ms = new Date(dateStr).getTime();
  const diff = now - ms;
  const day = 24 * 60 * 60 * 1000;
  switch (range) {
    case "7d":  return diff <= 7 * day;
    case "30d": return diff <= 30 * day;
    case "3m":  return diff <= 90 * day;
    case "6m":  return diff <= 180 * day;
    case "1y":  return diff <= 365 * day;
  }
}

interface Props {
  selected: LastVideoRange | null;
  onChange: (range: LastVideoRange | null) => void;
}

export function LastVideoFilter({ selected, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">
        {t("lastVideoFilter.label")}
      </span>
      {RANGES.map((range) => (
        <button
          key={range}
          onClick={() => onChange(selected === range ? null : range)}
          className={`px-3 py-1 rounded-full border transition-colors ${
            selected === range
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {t(`lastVideoFilter.${range}`)}
        </button>
      ))}
    </div>
  );
}
