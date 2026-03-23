import { MdSearch } from "react-icons/md";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
        <MdSearch className="text-lg" />
      </span>
      <input
        type="search"
        placeholder="Search channels..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
      />
    </div>
  );
}
