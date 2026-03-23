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
}

export interface SubscriptionsData {
  lastUpdated: string;
  totalCount: number;
  channels: Channel[];
}
