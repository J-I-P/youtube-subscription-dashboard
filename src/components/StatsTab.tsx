import { useEffect, useState } from "react";
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Doughnut, Line } from "react-chartjs-2";
import type { Channel } from "../types/youtube";

ChartJS.register(
  ArcElement,
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
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-1">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500">{sub}</p>}
    </div>
  );
}

export function StatsTab({ channels, totalCount, lastUpdated }: StatsTabProps) {
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
    ...topCountriesForPie.map(([name, value]) => ({ name: name === "Unknown" ? "未知" : name, value })),
    ...(otherCount > 0 ? [{ name: "其他", value: otherCount }] : []),
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
      legend: {
        position: "right" as const,
        labels: {
          boxWidth: 12,
          boxHeight: 12,
          borderRadius: 6,
          useBorderRadius: true,
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: number; label: string }) =>
            ` ${ctx.label}: ${ctx.parsed.toLocaleString()} 個頻道（${((ctx.parsed / totalCount) * 100).toFixed(1)}%）`,
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
    label: new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const firstCount = chartData[0]?.count;
  const lastCount = chartData[chartData.length - 1]?.count;
  const growth = firstCount != null && lastCount != null ? lastCount - firstCount : null;

  const lineData = {
    labels: chartData.map((d) => d.label),
    datasets: [
      {
        label: "頻道數",
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
          label: (ctx: { parsed: { y: number } }) =>
            ` ${ctx.parsed.y.toLocaleString()} 個頻道`,
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

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="訂閱頻道總數" value={totalCount.toLocaleString()} />
        <StatCard
          label="本週有更新"
          value={thisWeekCount.toLocaleString()}
          sub={`佔 ${((thisWeekCount / totalCount) * 100).toFixed(1)}%`}
        />
        <StatCard
          label="有影片的頻道"
          value={channelsWithVideo.toLocaleString()}
          sub={`佔 ${((channelsWithVideo / totalCount) * 100).toFixed(1)}%`}
        />
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5 flex flex-col gap-1">
          <p className="text-xs text-amber-600 dark:text-amber-400">⚠ 停更超過 6 個月</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{inactiveCount.toLocaleString()}</p>
          <p className="text-xs text-amber-500 dark:text-amber-500">
            佔 {((inactiveCount / totalCount) * 100).toFixed(1)}%，建議考慮取消訂閱
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              訂閱頻道數量趨勢
            </h2>
            {growth !== null && (
              <p className={`text-xs mt-0.5 ${growth >= 0 ? "text-green-500" : "text-red-500"}`}>
                {growth >= 0 ? "+" : ""}{growth} 頻道（記錄期間）
              </p>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {chartData.length} 筆資料
          </p>
        </div>
        {chartData.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600 text-sm gap-2">
            <p>資料點不足，無法顯示趨勢圖。</p>
            <p className="text-xs">每週 GitHub Actions 執行後會自動累積資料。</p>
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
            頻道地區分布
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            共 {Object.keys(countryCounts).length} 個地區
            {topCountry && (
              <>，最多為 <span className="font-medium text-gray-600 dark:text-gray-300">{topCountry[0] === "Unknown" ? "未知" : topCountry[0]}</span>（{topCountry[1]} 個頻道）</>
            )}
          </p>
        </div>
        <div style={{ height: 320 }}>
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Last updated:{" "}
        {new Date(lastUpdated).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </p>
    </div>
  );
}
