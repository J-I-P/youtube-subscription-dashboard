import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { MdLanguage, MdCheck } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "zh-TW", label: "繁體中文" },
];

export function LangToggle() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function select(code: string) {
    i18n.changeLanguage(code);
    localStorage.setItem("lang", code);
    setOpen(false);
  }

  const current = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative ml-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-gray-600 dark:text-gray-300 hover:border-gray-500 dark:hover:border-gray-400 transition-colors"
      >
        <MdLanguage className="text-base" />
        <span>{current.label}</span>
        <MdKeyboardArrowDown className={`text-base transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => select(lang.code)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{lang.label}</span>
              {i18n.language === lang.code && <MdCheck className="text-red-500 text-base" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
