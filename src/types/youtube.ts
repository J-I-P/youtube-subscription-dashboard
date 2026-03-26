export interface LastVideo {
  id: string;
  title: string;
  publishedAt: string;
  url: string;
  thumbnailUrl: string | null;
}

export interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  subscriberCount: number | null;
  videoCount: number | null;
  viewCount: number | null;
  publishedAt: string;
  customUrl: string | null;
  country: string | null;
  lastVideo: LastVideo | null;
}

export interface SubscriptionsData {
  lastUpdated: string;
  /** Number of subscription IDs returned by the YouTube subscriptions.list API */
  subscribedChannelCount?: number;
  /** Number of channels with successfully fetched details (may be less than subscribedChannelCount) */
  totalCount: number;
  channels: Channel[];
}
