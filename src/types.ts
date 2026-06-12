export type Platform = "tiktok" | "instagram" | "youtube" | "whatsapp" | "facebook" | "system";

export interface SocialAccount {
  id: string;
  platform: Platform;
  handle: string;
  name: string;
  avatar: string;
  followers: number;
  active: boolean;
}

export interface TrendTopic {
  id: string;
  title: string;
  platform: Platform;
  change: string;
  category: string;
  engagement: string;
  desc: string;
  hashtags: string[];
}

export interface SentimentData {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ViralCampaign {
  id: string;
  title: string;
  platform: Platform;
  accountId: string;
  status: "active" | "paused" | "boosted";
  views: number;
  likes: number;
  shares: number;
  saves: number;
  comments: number;
  conversionRate: number;
  sentiment: SentimentData;
  scheduledTime: string;
  leadsCaptured: number;
  retention: number[]; // 0s, 3s, 5s, 10s, 15s, 30s, 60s
}

export interface CaptureLead {
  id: string;
  name: string;
  email: string;
  handle: string;
  interest: string;
  triggerComment: string;
  sourceVideo: string;
  date: string;
  crmStatus: "Synced" | "Pending";
  crm: string;
}

export interface SchedulerItem {
  id: string;
  title: string;
  platform: Platform;
  accountId: string;
  scheduledFor: string;
  status: "scheduled" | "published";
  reason: string;
}

export interface PushAlert {
  id: string;
  title: string;
  message: string;
  platform: Platform;
  type: "alert" | "crm" | "recommendation";
  time: string;
  read: boolean;
}

export interface CrmConfig {
  status: string;
  selectedCrm: string;
  apiKeyConfigured: boolean;
  webhookUrl: string;
  autoDm: boolean;
  triggerKeywords: string[];
}

export interface GeneratedScriptScene {
  scene: number;
  visuals: string;
  vocals: string;
}

export interface GeneratedContent {
  title: string;
  hook: string;
  script: GeneratedScriptScene[];
  caption: string;
  hashtags: string[];
  postingRecommendations: string;
  crmLeadWorkflow: string;
}

export interface BroadcastItem {
  id: string;
  title: string;
  message: string;
  platform: Platform;
  category: string;
  sentCount: number;
  conversions: number;
  status: "active" | "sent";
  date: string;
}

export interface ProductItem {
  name: string;
  category: string;
  defaultPrompt: string;
}
