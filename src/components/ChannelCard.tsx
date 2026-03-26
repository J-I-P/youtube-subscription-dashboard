import { useEffect, useState } from "react";
import { MdClose, MdFavorite, MdFavoriteBorder, MdGroup, MdLocationOn, MdOpenInNew, MdPlayCircle, MdVideocam } from "react-icons/md";
import type { Channel } from "../types/youtube";

interface Props {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
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

export function ChannelCard({ channel, isFavorite, onToggleFavorite }: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  const channelUrl = channel.customUrl
    ? `https://youtube.com/${channel.customUrl}`
    : `https://youtube.com/channel/${channel.id}`;

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  return (
    <>
      {/* Card */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setModalOpen(true); }}
        className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500 transition-all cursor-pointer select-none"
      >
        {/* Channel header */}
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
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
              {channel.title}
            </p>
            {channel.customUrl && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {channel.customUrl}
              </p>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
              isFavorite
                ? "text-red-500 hover:text-red-600"
                : "text-gray-300 dark:text-gray-600 hover:text-red-400"
            }`}
            aria-label={isFavorite ? "移除最愛" : "加入最愛"}
            title={isFavorite ? "移除最愛" : "加入最愛"}
          >
            {isFavorite ? <MdFavorite className="text-xl" /> : <MdFavoriteBorder className="text-xl" />}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span title="Subscribers" className="flex items-center gap-1"><MdGroup /> {formatCount(channel.subscriberCount)}</span>
          <span title="Videos" className="flex items-center gap-1"><MdVideocam /> {formatCount(channel.videoCount)}</span>
          {channel.country && <span title="Country" className="flex items-center gap-1"><MdLocationOn /> {channel.country}</span>}
        </div>

        {/* Latest video */}
        {channel.lastVideo ? (
          <a
            href={channel.lastVideo.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-auto rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            title="Latest video"
          >
            <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700">
              <img
                src={
                  channel.lastVideo.thumbnailUrl ||
                  `https://img.youtube.com/vi/${channel.lastVideo.id}/mqdefault.jpg`
                }
                alt={channel.lastVideo.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <MdPlayCircle className="text-4xl text-white drop-shadow" />
              </div>
            </div>
            <div className="px-3 py-2 text-xs">
              <span className="block text-gray-700 dark:text-gray-200 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors font-medium">
                {channel.lastVideo.title}
              </span>
              <span className="text-gray-400 dark:text-gray-500 mt-0.5 block">
                {timeAgo(channel.lastVideo.publishedAt)}
              </span>
            </div>
          </a>
        ) : (
          <div className="mt-auto" />
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
              {channel.thumbnailUrl ? (
                <img
                  src={channel.thumbnailUrl}
                  alt={channel.title}
                  className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                  {channel.title}
                </p>
                {channel.customUrl && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {channel.customUrl}
                  </p>
                )}
                <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><MdGroup /> {formatCount(channel.subscriberCount)}</span>
                  <span className="flex items-center gap-1"><MdVideocam /> {formatCount(channel.videoCount)}</span>
                  {channel.country && <span className="flex items-center gap-1"><MdLocationOn /> {channel.country}</span>}
                </div>
              </div>
              <button
                onClick={() => onToggleFavorite()}
                className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
                  isFavorite
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-300 dark:text-gray-600 hover:text-red-400"
                }`}
                aria-label={isFavorite ? "移除最愛" : "加入最愛"}
                title={isFavorite ? "移除最愛" : "加入最愛"}
              >
                {isFavorite ? <MdFavorite className="text-xl" /> : <MdFavoriteBorder className="text-xl" />}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto p-5 flex-1 flex flex-col gap-5">
              {/* Latest video */}
              {channel.lastVideo && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    最新影片
                  </p>
                  <a
                    href={channel.lastVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="relative w-full aspect-video bg-gray-200 dark:bg-gray-700">
                      <img
                        src={
                          channel.lastVideo.thumbnailUrl ||
                          `https://img.youtube.com/vi/${channel.lastVideo.id}/mqdefault.jpg`
                        }
                        alt={channel.lastVideo.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                        <MdPlayCircle className="text-5xl text-white drop-shadow" />
                      </div>
                    </div>
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug">
                        {channel.lastVideo.title}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {timeAgo(channel.lastVideo.publishedAt)}
                        {" · "}
                        {new Date(channel.lastVideo.publishedAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </a>
                </div>
              )}

              {/* Description */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  頻道描述
                </p>
                {channel.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {channel.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    此頻道沒有提供描述。
                  </p>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2.5 px-4 transition-colors"
              >
                <MdOpenInNew className="text-lg" />
                前往頻道
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
