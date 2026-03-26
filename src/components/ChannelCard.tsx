import { useState } from "react";
import { MdGroup, MdLocationOn, MdPlayCircle, MdVideocam } from "react-icons/md";
import type { Channel } from "../types/youtube";

interface Props {
  channel: Channel;
}

function formatCount(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ChannelCard({ channel }: Props) {
  const [expanded, setExpanded] = useState(false);

  const channelUrl = channel.customUrl
    ? `https://youtube.com/${channel.customUrl}`
    : `https://youtube.com/channel/${channel.id}`;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 min-h-56 shadow-sm hover:shadow-md transition-shadow">
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4"
      >
        {channel.thumbnailUrl ? (
          <img
            src={channel.thumbnailUrl}
            alt={channel.title}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
            {channel.title}
          </p>
          {channel.customUrl && (
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {channel.customUrl}
            </p>
          )}
        </div>
      </a>

      {channel.description && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className={expanded ? undefined : "line-clamp-3"}>
            {channel.description}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs text-blue-500 hover:underline block ml-auto"
          >
            {expanded ? "收起" : "閱讀更多"}
          </button>
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span title="Subscribers" className="flex items-center gap-1"><MdGroup /> {formatCount(channel.subscriberCount)}</span>
        <span title="Videos" className="flex items-center gap-1"><MdVideocam /> {formatCount(channel.videoCount)}</span>
        {channel.country && <span title="Country" className="flex items-center gap-1"><MdLocationOn /> {channel.country}</span>}
      </div>

      {channel.lastVideo ? (
        <a
          href={channel.lastVideo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
          title="Latest video"
        >
          <MdPlayCircle className="mt-0.5 text-base text-red-500 shrink-0" />
          <span className="min-w-0">
            <span className="block text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {channel.lastVideo.title}
            </span>
            <span className="text-gray-400 dark:text-gray-500 mt-0.5 block">
              {timeAgo(channel.lastVideo.publishedAt)}
            </span>
          </span>
        </a>
      ) : (
        <div className="mt-auto" />
      )}
    </div>
  );
}
