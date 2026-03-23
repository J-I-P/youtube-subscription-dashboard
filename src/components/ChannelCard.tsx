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
  const channelUrl = channel.customUrl
    ? `https://youtube.com/${channel.customUrl}`
    : `https://youtube.com/channel/${channel.id}`;

  return (
    <a
      href={channelUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        {channel.thumbnailUrl ? (
          <img
            src={channel.thumbnailUrl}
            alt={channel.title}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
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
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {channel.description}
        </p>
      )}

      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-auto">
        <span title="Subscribers">👥 {formatCount(channel.subscriberCount)}</span>
        <span title="Videos">🎬 {formatCount(channel.videoCount)}</span>
        {channel.country && <span title="Country">📍 {channel.country}</span>}
      </div>
    </a>
  );
}
