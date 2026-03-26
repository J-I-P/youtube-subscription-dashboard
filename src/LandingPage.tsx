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

interface LandingPageProps {
  onEnter: () => void;
}

const features = [
  {
    icon: <MdBarChart className="text-3xl text-red-500" />,
    title: "統計趨勢",
    desc: "以視覺化圖表呈現頻道訂閱成長趨勢，一眼掌握整體數據概況。",
  },
  {
    icon: <MdSearch className="text-3xl text-blue-500" />,
    title: "即時搜尋",
    desc: "輸入關鍵字即時篩選頻道，快速找到你想要的訂閱內容。",
  },
  {
    icon: <MdFilterList className="text-3xl text-green-500" />,
    title: "多維度篩選",
    desc: "依國家、排序方式自由組合篩選，打造專屬的頻道瀏覽體驗。",
  },
  {
    icon: <MdFavorite className="text-3xl text-pink-500" />,
    title: "我的最愛",
    desc: "收藏喜愛的頻道，搭配 GitHub Gist 跨裝置同步，隨時隨地查看。",
  },
  {
    icon: <MdUpdate className="text-3xl text-yellow-500" />,
    title: "本週更新",
    desc: "自動標記 7 天內有新影片的頻道，不錯過任何最新內容。",
  },
  {
    icon: <MdSync className="text-3xl text-purple-500" />,
    title: "自動同步資料",
    desc: "透過 GitHub Actions 每週自動拉取最新訂閱資料，免手動更新。",
  },
];

const techStack = [
  { icon: <SiReact className="text-2xl text-cyan-400" />, name: "React 19" },
  { icon: <SiTypescript className="text-2xl text-blue-500" />, name: "TypeScript" },
  { icon: <SiTailwindcss className="text-2xl text-teal-400" />, name: "Tailwind CSS v4" },
  { icon: <SiVite className="text-2xl text-violet-500" />, name: "Vite" },
  { icon: <FaYoutube className="text-2xl text-red-600" />, name: "YouTube Data API" },
];

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
      {/* 頂部導覽 */}
      <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdSubscriptions className="text-2xl text-red-600" />
          <span className="font-bold text-lg tracking-tight">YouTube 訂閱總覽</span>
        </div>
        <button
          onClick={onEnter}
          className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors cursor-pointer"
        >
          進入 Dashboard →
        </button>
      </nav>

      {/* Hero 區塊 */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <FaYoutube />
          個人 YouTube 訂閱管理工具
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
          掌握你的
          <span className="text-red-600"> YouTube </span>
          訂閱
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          一站式管理所有訂閱頻道，查看統計趨勢、篩選本週更新、收藏喜愛頻道。
          資料每週自動同步，讓你不再錯過任何精彩內容。
        </p>
        <button
          onClick={onEnter}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
        >
          <MdSubscriptions className="text-xl" />
          立即體驗
        </button>
      </section>

      {/* 功能特色 */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">功能特色</h2>
            <p className="text-gray-500 dark:text-gray-400">專為訂閱管理打造的全方位工具</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 技術堆疊 */}
      <section className="py-20 max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-3">技術堆疊</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10">採用現代前端技術，快速、輕量、易維護</p>
        <div className="flex flex-wrap justify-center gap-4">
          {techStack.map((t) => (
            <div
              key={t.name}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-5 py-3 rounded-xl shadow-sm font-medium text-sm"
            >
              {t.icon}
              {t.name}
            </div>
          ))}
        </div>
      </section>

      {/* CTA 底部 */}
      <section className="bg-red-600 py-20 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">準備好了嗎？</h2>
        <p className="text-red-100 mb-8 text-lg">開始整理你的 YouTube 訂閱清單</p>
        <button
          onClick={onEnter}
          className="bg-white text-red-600 font-semibold text-lg px-8 py-4 rounded-xl hover:bg-red-50 transition-colors shadow-lg active:scale-95 cursor-pointer"
        >
          進入 Dashboard
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MdSubscriptions className="text-red-500" />
          <span className="font-medium text-gray-600 dark:text-gray-300">YouTube 訂閱總覽</span>
        </div>
        <p>使用 React + TypeScript + Tailwind CSS 打造</p>
      </footer>
    </div>
  );
}
