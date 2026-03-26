import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Channel } from "../types/youtube";

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
  const countryCounts = channels.reduce<Record<string, number>>((acc, c) => {
    const key = c.country ?? "Unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0];

  const thisWeekCount = channels.filter((c) => {
    if (!c.lastVideo) return false;
    return Date.now() - new Date(c.lastVideo.publishedAt).getTime() <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  // Format history for chart
  const chartData = history.map((h) => ({
    date: h.date,
    count: h.count,
    label: new Date(h.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  }));

  const firstCount = chartData[0]?.count;
  const lastCount = chartData[chartData.length - 1]?.count;
  const growth = firstCount != null && lastCount != null ? lastCount - firstCount : null;

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
        <StatCard
          label="最多頻道的地區"
          value={topCountry ? topCountry[0] : "—"}
          sub={topCountry ? `${topCountry[1]} 個頻道` : undefined}
        />
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
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-gray-500 dark:text-gray-400"
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "currentColor" }}
                className="text-gray-500 dark:text-gray-400"
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tw-bg-opacity, #fff)",
                  borderRadius: "0.5rem",
                  border: "1px solid #e5e7eb",
                  fontSize: "0.75rem",
                }}
                formatter={(value) => [(value as number).toLocaleString(), "頻道數"]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 3, fill: "#dc2626" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
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
