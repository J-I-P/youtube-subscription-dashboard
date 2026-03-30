import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdClose, MdFavorite, MdFavoriteBorder, MdGroup, MdLocationOn, MdOpenInNew, MdPlayCircle, MdVideocam, MdWarning } from "react-icons/md";
import { isChannelInactive } from "../channelHealth";
import type { Channel } from "../types/youtube";
import { FlagIcon } from "./FlagIcon";
import { TagManager } from "./TagManager";

interface Props {
  channel: Channel;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onUnsubscribe?: () => Promise<void>;
  onCancelUnsubscribe?: () => void;
  canUnsubscribe?: boolean;
  isInUnsubscribeQueue?: boolean;
  getEffectiveTags: (channelId: string, autoTags: string[]) => string[];
  addUserTag: (channelId: string, tagName: string) => void;
  removeTag: (channelId: string, tagName: string, autoTags: string[]) => void;
  allUserTagNames: string[];
}

function formatCount(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ChannelCard({ channel, isFavorite, onToggleFavorite, onUnsubscribe, onCancelUnsubscribe, canUnsubscribe, isInUnsubscribeQueue, getEffectiveTags, addUserTag, removeTag, allUserTagNames }: Props) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const inactive = isChannelInactive(channel);
  const [unsubState, setUnsubState] = useState<"idle" | "confirm" | "loading" | "done" | "error">("idle");

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return t("channelCard.minutesAgo", { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t("channelCard.hoursAgo", { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 30) return t("channelCard.daysAgo", { count: days });
    const months = Math.floor(days / 30);
    if (months < 12) return t("channelCard.monthsAgo", { count: months });
    return t("channelCard.yearsAgo", { count: Math.floor(months / 12) });
  }

  const channelUrl = channel.customUrl
    ? `https://youtube.com/${channel.customUrl}`
    : `https://youtube.com/channel/${channel.id}`;

  useEffect(() => {
    if (!modalOpen) {
      setUnsubState("idle");
      return;
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModalOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  async function handleUnsubscribeConfirm() {
    if (!onUnsubscribe) return;
    setUnsubState("loading");
    try {
      await onUnsubscribe();
      setUnsubState("done");
    } catch {
      setUnsubState("error");
    }
  }

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
            aria-label={isFavorite ? t("channelCard.removeFavorite") : t("channelCard.addFavorite")}
            title={isFavorite ? t("channelCard.removeFavorite") : t("channelCard.addFavorite")}
          >
            {isFavorite ? <MdFavorite className="text-xl" /> : <MdFavoriteBorder className="text-xl" />}
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><MdGroup /> {formatCount(channel.subscriberCount)}</span>
          <span className="flex items-center gap-1"><MdVideocam /> {formatCount(channel.videoCount)}</span>
          {channel.country && <span className="flex items-center gap-1"><MdLocationOn /><FlagIcon code={channel.country} className="w-4 h-3 rounded-sm shrink-0" /> {channel.country}</span>}
        </div>

        {/* Tag badges */}
        {(() => {
          const tags = getEffectiveTags(channel.id, channel.autoTags ?? []);
          if (tags.length === 0) return null;
          const visible = tags.slice(0, 2);
          const extra = tags.length - visible.length;
          return (
            <div className="flex flex-wrap gap-1">
              {visible.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {tag}
                </span>
              ))}
              {extra > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  +{extra}
                </span>
              )}
            </div>
          );
        })()}

        {/* Inactive warning */}
        {inactive && (
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
            <MdWarning className="flex-shrink-0 text-sm" />
            <span>{t("channelCard.inactive")}</span>
          </div>
        )}

        {/* Latest video */}
        {channel.lastVideo ? (
          <a
            href={channel.lastVideo.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-auto rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
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
                  {channel.country && <span className="flex items-center gap-1"><MdLocationOn /><FlagIcon code={channel.country} className="w-4 h-3 rounded-sm shrink-0" /> {channel.country}</span>}
                </div>
                {inactive && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <MdWarning className="flex-shrink-0" />
                    <span>{t("channelCard.inactiveShort")}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onToggleFavorite()}
                className={`flex-shrink-0 p-1.5 rounded-full transition-colors ${
                  isFavorite
                    ? "text-red-500 hover:text-red-600"
                    : "text-gray-300 dark:text-gray-600 hover:text-red-400"
                }`}
                aria-label={isFavorite ? t("channelCard.removeFavorite") : t("channelCard.addFavorite")}
                title={isFavorite ? t("channelCard.removeFavorite") : t("channelCard.addFavorite")}
              >
                {isFavorite ? <MdFavorite className="text-xl" /> : <MdFavoriteBorder className="text-xl" />}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t("channelCard.close")}
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
                    {t("channelCard.latestVideo")}
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
                  {t("channelCard.description")}
                </p>
                {channel.description ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                    {channel.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                    {t("channelCard.noDescription")}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                  {t("tags.label")}
                </p>
                <TagManager
                  channelId={channel.id}
                  autoTags={channel.autoTags ?? []}
                  getEffectiveTags={getEffectiveTags}
                  addUserTag={addUserTag}
                  removeTag={removeTag}
                  allUserTagNames={allUserTagNames}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
              {/* Unsubscribe section */}
              {channel.subscriptionId && (
                <>
                  {isInUnsubscribeQueue ? (
                    <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
                      <span className="flex-1">⏳ {t("channelCard.unsubscribeQueued")}</span>
                      <button
                        onClick={() => onCancelUnsubscribe?.()}
                        className="text-xs underline hover:no-underline flex-shrink-0"
                      >
                        {t("channelCard.unsubscribeConfirmNo")}
                      </button>
                    </div>
                  ) : (
                    <>
                      {unsubState === "idle" && (
                        <button
                          onClick={() => canUnsubscribe ? setUnsubState("confirm") : undefined}
                          disabled={!canUnsubscribe}
                          title={!canUnsubscribe ? t("channelCard.unsubscribeNoToken") : undefined}
                          className={`flex items-center justify-center gap-2 w-full rounded-lg border font-semibold py-2.5 px-4 transition-colors text-sm ${
                            canUnsubscribe
                              ? "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-red-400 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-400"
                              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          }`}
                        >
                          {t("channelCard.unsubscribe")}
                        </button>
                      )}
                      {unsubState === "confirm" && (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-center text-gray-700 dark:text-gray-300">
                            {t("channelCard.unsubscribeConfirm", { title: channel.title })}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setUnsubState("idle")}
                              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 text-sm transition-colors"
                            >
                              {t("channelCard.unsubscribeConfirmNo")}
                            </button>
                            <button
                              onClick={handleUnsubscribeConfirm}
                              className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-2 text-sm transition-colors"
                            >
                              {t("channelCard.unsubscribeConfirmYes")}
                            </button>
                          </div>
                        </div>
                      )}
                      {unsubState === "loading" && (
                        <div className="flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          {t("channelCard.unsubscribe")}…
                        </div>
                      )}
                      {unsubState === "done" && (
                        <p className="text-sm text-center text-green-600 dark:text-green-400 py-1">
                          ✓ {t("channelCard.unsubscribeTriggered")}
                        </p>
                      )}
                      {unsubState === "error" && (
                        <p className="text-sm text-center text-red-500 py-1">
                          {t("channelCard.unsubscribeFailed")}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
              <a
                href={channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-2.5 px-4 transition-colors"
              >
                <MdOpenInNew className="text-lg" />
                {t("channelCard.goToChannel")}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
