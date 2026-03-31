import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MdPlayArrow } from "react-icons/md";
import type { Channel } from "../types/youtube";

interface FeedItem {
  channel: Channel;
  video: NonNullable<Channel["lastVideo"]>;
  publishedAt: Date;
}

interface Props {
  channels: Channel[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function groupByTime(items: FeedItem[]): { key: string; items: FeedItem[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86_400_000;

  const groups: { key: string; items: FeedItem[] }[] = [
    { key: "today", items: [] },
    { key: "yesterday", items: [] },
    { key: "thisWeek", items: [] },
  ];

  for (const item of items) {
    const t = item.publishedAt.getTime();
    if (t >= todayStart) groups[0].items.push(item);
    else if (t >= yesterdayStart) groups[1].items.push(item);
    else groups[2].items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timeAgo(date: Date, t: TFunction<any, any>): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return t("channelCard.minutesAgo", { count: Math.max(1, mins) });
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return t("channelCard.hoursAgo", { count: hrs });
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return t("channelCard.daysAgo", { count: days });
  const mos = Math.floor(diff / (30 * 86_400_000));
  if (mos < 12) return t("channelCard.monthsAgo", { count: mos });
  return t("channelCard.yearsAgo", { count: Math.floor(mos / 12) });
}

export function RecentFeed({ channels }: Props) {
  const { t } = useTranslation();

  const groups = useMemo(() => {
    const now = Date.now();
    const items: FeedItem[] = channels
      .filter((c) => c.lastVideo && now - new Date(c.lastVideo.publishedAt).getTime() <= SEVEN_DAYS_MS)
      .map((c) => ({
        channel: c,
        video: c.lastVideo!,
        publishedAt: new Date(c.lastVideo!.publishedAt),
      }))
      .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    return groupByTime(items);
  }, [channels]);

  if (groups.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-20">
        {t("recent.empty")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {groups.map((group) => (
        <section key={group.key}>
          {/* Section header */}
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400 shrink-0">
              {t(`recent.${group.key}`)}
            </h2>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
              {group.items.length}
            </span>
          </div>

          {/* Video grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.items.map(({ channel, video, publishedAt }) => (
              <a
                key={`${channel.id}-${video.id}`}
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-red-300 dark:hover:border-red-700 transition-all duration-200"
              >
                {/* Video thumbnail */}
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                      <MdPlayArrow className="text-4xl text-gray-400" />
                    </div>
                  )}
                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="bg-black/60 rounded-full p-2.5">
                      <MdPlayArrow className="text-white text-2xl" />
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-2 p-3">
                  {/* Channel row */}
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={channel.thumbnailUrl}
                      alt={channel.title}
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                      {channel.title}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 tabular-nums">
                      {timeAgo(publishedAt, t)}
                    </span>
                  </div>

                  {/* Video title */}
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                    {video.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
