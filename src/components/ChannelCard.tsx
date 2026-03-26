import { useState } from "react";
import { MdGroup, MdLocationOn, MdVideocam } from "react-icons/md";
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

export function ChannelCard({ channel }: Props) {
  const [expanded, setExpanded] = useState(false);

  const channelUrl = channel.customUrl
    ? `https://youtube.com/${channel.customUrl}`
    : `https://youtube.com/channel/${channel.id}`;

  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 min-h-56 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
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
      </div>

      {channel.description && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className={expanded ? undefined : "line-clamp-3"}>
            {channel.description}
          </p>
          <button
            onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
            className="mt-1 text-xs text-blue-500 hover:underline block ml-auto"
          >
            {expanded ? "收起" : "閱讀更多"}
          </button>
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-auto">
        <span title="Subscribers" className="flex items-center gap-1"><MdGroup /> {formatCount(channel.subscriberCount)}</span>
        <span title="Videos" className="flex items-center gap-1"><MdVideocam /> {formatCount(channel.videoCount)}</span>
        {channel.country && <span title="Country" className="flex items-center gap-1"><MdLocationOn /> {channel.country}</span>}
      </div>
    </a>
  );
}
