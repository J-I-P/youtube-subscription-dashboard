import type { Channel } from "./types/youtube";

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

/** Returns true if the channel has had no new video for over 6 months, or has never uploaded. */
export function isChannelInactive(channel: Channel): boolean {
  if (!channel.lastVideo) return true;
  return Date.now() - new Date(channel.lastVideo.publishedAt).getTime() > SIX_MONTHS_MS;
}
