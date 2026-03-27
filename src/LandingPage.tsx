import { useTranslation } from "react-i18next";
import {
  MdSubscriptions,
  MdBarChart,
  MdSearch,
  MdFavorite,
  MdSync,
  MdUpdate,
  MdFilterList,
} from "react-icons/md";
import { FaYoutube } from "react-icons/fa";
import { SiReact, SiTypescript, SiTailwindcss, SiVite } from "react-icons/si";
import { LangToggle } from "./components/LangToggle";

interface LandingPageProps {
  onEnter: () => void;
}

const techStack = [
  { icon: <SiReact className="text-2xl text-cyan-400" />, name: "React 19" },
  { icon: <SiTypescript className="text-2xl text-blue-500" />, name: "TypeScript" },
  { icon: <SiTailwindcss className="text-2xl text-teal-400" />, name: "Tailwind CSS v4" },
  { icon: <SiVite className="text-2xl text-violet-500" />, name: "Vite" },
  { icon: <FaYoutube className="text-2xl text-red-600" />, name: "YouTube Data API" },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  const { t } = useTranslation();

  const features = [
    { icon: <MdBarChart className="text-3xl text-red-500" />, key: "stats" },
    { icon: <MdSearch className="text-3xl text-blue-500" />, key: "search" },
    { icon: <MdFilterList className="text-3xl text-green-500" />, key: "filter" },
    { icon: <MdFavorite className="text-3xl text-pink-500" />, key: "favorites" },
    { icon: <MdUpdate className="text-3xl text-yellow-500" />, key: "weekly" },
    { icon: <MdSync className="text-3xl text-purple-500" />, key: "sync" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* 頂部導覽 */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdSubscriptions className="text-2xl text-red-600" />
          <span className="font-bold text-lg tracking-tight">{t("landing.navTitle")}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEnter}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          >
            {t("landing.enterDashboard")}
          </button>
          <LangToggle />
        </div>
      </nav>

      {/* Hero 區塊 */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <FaYoutube />
          {t("landing.badge")}
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
          {t("landing.heroTitle1")}
          <span className="text-red-600"> YouTube </span>
          {t("landing.heroTitle2")}
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t("landing.heroDesc")}
        </p>
        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <MdSubscriptions className="text-xl" />
          {t("landing.cta")}
        </button>
      </section>

      {/* 功能特色 */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{t("landing.featuresTitle")}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t("landing.featuresSub")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.key}
                className="p-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{t(`landing.features.${f.key}.title`)}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(`landing.features.${f.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 技術堆疊 */}
      <section className="py-20 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-3">{t("landing.techTitle")}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10">{t("landing.techSub")}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {techStack.map((t_) => (
            <div
              key={t_.name}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-3 rounded-xl shadow-sm font-medium text-sm"
            >
              {t_.icon}
              {t_.name}
            </div>
          ))}
        </div>
      </section>

      {/* CTA 底部 */}
      <section className="bg-red-600 py-20 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">{t("landing.ctaTitle")}</h2>
        <p className="text-red-100 mb-8 text-lg">{t("landing.ctaSub")}</p>
        <button
          onClick={onEnter}
          className="bg-white text-red-600 font-semibold text-lg px-8 py-4 rounded-xl hover:bg-red-50 transition-colors shadow-lg active:scale-95 cursor-pointer"
        >
          {t("landing.ctaButton")}
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MdSubscriptions className="text-red-500" />
          <span className="font-medium text-gray-600 dark:text-gray-300">{t("landing.footerTitle")}</span>
        </div>
        <p>{t("landing.footerSub")}</p>
      </footer>
    </div>
  );
}
