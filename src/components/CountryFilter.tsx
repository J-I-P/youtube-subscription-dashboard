import { useTranslation } from "react-i18next";

interface Props {
  countries: string[];
  selected: Set<string>;
  onToggle: (country: string) => void;
  onClear: () => void;
}

export function CountryFilter({ countries, selected, onToggle, onClear }: Props) {
  const { t } = useTranslation();
  if (countries.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400 shrink-0">{t("country.label")}</span>
      {countries.map((country) => (
        <button
          key={country}
          onClick={() => onToggle(country)}
          className={`px-3 py-1 rounded-full border transition-colors ${
            selected.has(country)
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
          }`}
        >
          {country}
        </button>
      ))}
      {selected.size > 0 && (
        <button
          onClick={onClear}
          className="px-3 py-1 rounded-full border border-dashed border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400 hover:border-gray-600 transition-colors"
        >
          {t("country.clear")}
        </button>
      )}
    </div>
  );
}
