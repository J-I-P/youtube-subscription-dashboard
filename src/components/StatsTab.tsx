import { useEffect, useState } from "react";
import type React from "react";
import { useTranslation } from "react-i18next";
import { FiActivity, FiFilm, FiUsers } from "react-icons/fi";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import type { Channel } from "../types/youtube";
import { FlagIcon } from "./FlagIcon";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
);

interface HistoryPoint {
  date: string;
  count: number;
}

interface StatsTabProps {
  channels: Channel[];
  totalCount: number;
  lastUpdated: string;
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        {icon && <span className="text-gray-300 dark:text-gray-600 text-lg">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

export function StatsTab({ channels, totalCount, lastUpdated }: StatsTabProps) {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "data/history.json")
      .then((r) => r.json())
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  // Compute aggregate stats from channels
  const channelsWithVideo = channels.filter((c) => c.lastVideo).length;
  const inactiveCount = channels.filter((c) => {
    if (!c.lastVideo) return true;
    return Date.now() - new Date(c.lastVideo.publishedAt).getTime() > 180 * 24 * 60 * 60 * 1000;
  }).length;
  const countryCounts = channels.reduce<Record<string, number>>((acc, c) => {
    const key = c.country ?? "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]);
  const topCountry = sortedCountries[0];

  // Pie chart: top 10 countries + "其他"
  const TOP_N = 10;
  const topCountriesForPie = sortedCountries.slice(0, TOP_N);
  const otherCount = sortedCountries.slice(TOP_N).reduce((sum, [, n]) => sum + n, 0);
  const pieData = [
    ...topCountriesForPie.map(([name, value]) => ({
      name: name === "Unknown" ? t("stats.unknown") : name,
      code: name === "Unknown" ? "" : name,
      value,
    })),
    ...(otherCount > 0 ? [{ name: t("stats.others"), code: "__other__", value: otherCount }] : []),
  ];
  const PIE_COLORS = [
    "#dc2626", "#ea580c", "#d97706", "#65a30d", "#16a34a",
    "#0891b2", "#2563eb", "#7c3aed", "#db2777", "#64748b", "#94a3b8",
  ];

  const doughnutData = {
    labels: pieData.map((d) => d.name),
    datasets: [
      {
        data: pieData.map((d) => d.value),
        backgroundColor: PIE_COLORS,
        borderColor: PIE_COLORS.map(() => "transparent"),
        hoverOffset: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    cutout: "55%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: number; label: string }) =>
            t("stats.tooltipChannels", { name: ctx.label, count: ctx.parsed.toLocaleString(), pct: ((ctx.parsed / totalCount) * 100).toFixed(1) }),
        },
      },
    },
  };

  const thisWeekCount = channels.filter((c) => {
    if (!c.lastVideo) return false;
    return Date.now() - new Date(c.lastVideo.publishedAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const chartData = history.map((h) => ({
    date: h.date,
    count: h.count,
    label: new Date(h.date).toLocaleDateString(i18n.language === "zh-TW" ? "zh-TW" : "en", { month: "short", day: "numeric" }),
  }));

  const firstCount = chartData[0]?.count;
  const lastCount = chartData[chartData.length - 1]?.count;
  const growth = firstCount != null && lastCount != null ? lastCount - firstCount : null;

  const lineData = {
    labels: chartData.map((d) => d.label),
    datasets: [
      {
        label: t("stats.totalChannels"),
        data: chartData.map((d) => d.count),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220,38,38,0.08)",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    animation: false as const,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => {
            const y = ctx.parsed.y ?? 0;
            return t("stats.tooltipCount", { count: y.toLocaleString(), pct: ((y / totalCount) * 100).toFixed(1) });
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(156,163,175,0.2)" },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(156,163,175,0.2)" },
        ticks: { font: { size: 11 } },
      },
    },
  };

  // Subscriber scale buckets
  const subBuckets = [
    { label: "< 1K", min: 0, max: 1_000 },
    { label: "1K–10K", min: 1_000, max: 10_000 },
    { label: "10K–100K", min: 10_000, max: 100_000 },
    { label: "100K–1M", min: 100_000, max: 1_000_000 },
    { label: "1M+", min: 1_000_000, max: Infinity },
  ];
  const subBucketCounts = subBuckets.map(
    ({ min, max }) =>
      channels.filter((c) => c.subscriberCount != null && c.subscriberCount >= min && c.subscriberCount < max).length
  );
  const subBucketColors = ["#2563eb", "#0891b2", "#16a34a", "#d97706", "#dc2626"];

  const subBarData = {
    labels: subBuckets.map((b) => b.label),
    datasets: [
      {
        data: subBucketCounts,
        backgroundColor: subBucketColors,
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    animation: false as const,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => {
            const y = ctx.parsed.y ?? 0;
            return t("stats.tooltipCount", { count: y.toLocaleString(), pct: ((y / totalCount) * 100).toFixed(1) });
          },
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12 } } },
      y: { grid: { color: "rgba(156,163,175,0.2)" }, ticks: { font: { size: 11 } } },
    },
  };

  // Update frequency buckets
  const now = Date.now();
  const freqBuckets = [
    { label: t("stats.bucket_week"), maxDays: 7 },
    { label: t("stats.bucket_month"), maxDays: 30 },
    { label: t("stats.bucket_3months"), maxDays: 90 },
    { label: t("stats.bucket_6months"), maxDays: 180 },
    { label: t("stats.bucket_over6months"), maxDays: Infinity },
  ];
  const freqCounts = freqBuckets.map(({ maxDays }, i) => {
    const prevMax = freqBuckets[i - 1]?.maxDays ?? 0;
    return channels.filter((c) => {
      if (!c.lastVideo) return maxDays === Infinity;
      const days = (now - new Date(c.lastVideo.publishedAt).getTime()) / 86400_000;
      return days >= prevMax && (maxDays === Infinity ? true : days < maxDays);
    }).length;
  });
  const freqColors = ["#16a34a", "#65a30d", "#d97706", "#ea580c", "#dc2626"];

  const freqBarData = {
    labels: freqBuckets.map((b) => b.label),
    datasets: [
      {
        data: freqCounts,
        backgroundColor: freqColors,
        borderRadius: 6,
        borderSkipped: false as const,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label={t("stats.totalChannels")} value={totalCount.toLocaleString()} icon={<FiUsers />} />
        <StatCard
          label={t("stats.thisWeekUpdated")}
          value={thisWeekCount.toLocaleString()}
          sub={t("stats.percentage", { value: ((thisWeekCount / totalCount) * 100).toFixed(1) })}
          icon={<FiActivity />}
        />
        <StatCard
          label={t("stats.channelsWithVideo")}
          value={channelsWithVideo.toLocaleString()}
          sub={t("stats.percentage", { value: ((channelsWithVideo / totalCount) * 100).toFixed(1) })}
          icon={<FiFilm />}
        />
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5 flex flex-col gap-1">
          <p className="text-xs text-amber-600 dark:text-amber-400">{t("stats.inactive6m")}</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{inactiveCount.toLocaleString()}</p>
          <p className="text-xs text-amber-500 dark:text-amber-500">
            {t("stats.inactiveSub", { value: ((inactiveCount / totalCount) * 100).toFixed(1) })}
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t("stats.trend")}
            </h2>
            {growth !== null && (
              <p className={`text-xs mt-0.5 ${growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {t("stats.growth", { sign: growth >= 0 ? "+" : "", count: Math.abs(growth) })}
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t("stats.dataPoints", { count: chartData.length })}
          </p>
        </div>
        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 text-sm gap-2">
            <p>{t("stats.noData")}</p>
            <p className="text-xs">{t("stats.noDataSub")}</p>
          </div>
        ) : (
          <div style={{ height: 280 }}>
            <Line data={lineData} options={lineOptions} />
          </div>
        )}
      </div>

      {/* Country doughnut chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("stats.countryDist")}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
            {t("stats.regionCount", { count: Object.keys(countryCounts).length })}
            {topCountry && (
              <>，{t("stats.topCountry", { name: topCountry[0] === "Unknown" ? t("stats.unknown") : topCountry[0], count: topCountry[1] })}</>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-6 overflow-hidden">
          <div className="flex-1 min-w-0" style={{ height: 320 }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <ol className="flex-1 min-w-0 space-y-2 self-center px-4 py-2">
            {pieData.map((item, i) => {
              const pct = (item.value / totalCount) * 100;
              return (
                <li key={item.name} className="flex items-center gap-2 text-sm">
                  <span className="w-5 text-right text-xs text-gray-400 dark:text-gray-500 shrink-0">{i + 1}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  {item.code && item.code !== "__other__"
                    ? <FlagIcon code={item.code} className="w-5 h-4 rounded-sm object-cover shrink-0" />
                    : <span className="text-sm shrink-0">{item.code === "__other__" ? "🌐" : "🏳"}</span>
                  }
                  <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{item.name}</span>
                  <div className="w-24 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 shrink-0">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${(item.value / pieData[0].value * 100).toFixed(1)}%`,
                        backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-gray-500 dark:text-gray-400 shrink-0">
                    {pct.toFixed(1)}%
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Subscriber scale & update frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("stats.subscriberScale")}</h2>
          <div style={{ height: 220 }}>
            <Bar data={subBarData} options={barOptions} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("stats.updateFrequency")}</h2>
          <div style={{ height: 220 }}>
            <Bar data={freqBarData} options={barOptions} />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t("lastUpdated")}{" "}
        {new Date(lastUpdated).toLocaleString(i18n.language === "zh-TW" ? "zh-TW" : "en", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </div>
  );
}
