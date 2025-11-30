
export interface Photo {
  id: string;
  dataUrl: string; // Base64 of image or video
  type?: 'image' | 'video';
  thumbnailUrl?: string; // For video preview/AI analysis
  timestamp: number;
  aiMetadata?: AiMetadata;
  isShared?: boolean;
  sharedWith?: string[]; // user IDs
}

export interface AiMetadata {
  caption: string;
  tags: string[];
  vibe: string;
  locationGuess?: string;
  suggestedAlbum?: string;
  socialComment?: string;
  socialCommentType?: 'rizz' | 'roast' | 'compliment';
  ratings?: {
    authenticity: number;
    beauty: number;
    virality: number;
  };
}

export interface User {
  id: string;
  name: string;
  email?: string; // Added for auth
  avatar: string;
  status: 'online' | 'offline' | 'typing';
  handle?: string;
  bio?: string;
  isGuest?: boolean;
  isVerified?: boolean; // Owner/Verified status
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  coverId: string;
  photoIds: string[];
  sharedWith: string[]; // User IDs
  createdAt: number;
  ownerId: string; // 'me' or user ID
}

export interface SocialPost {
  id: string;
  authorId: string;
  photo: Photo; 
  likes: number;
  timestamp: number;
}

// --- CHAT TYPES ---
export interface Message {
  id: string;
  senderId: string; // 'me' or user ID
  text: string;
  timestamp: number;
  isAiGenerated?: boolean;
}

export interface ChatConfig {
  relationship: string; // e.g. "Crush", "Boss", "Best Friend"
  tone: string;         // e.g. "Flirty", "Professional", "Casual"
  motive: string;       // e.g. "Make plans", "End chat", "Impress"
}

export interface ChatSession {
  id: string;
  participantId: string; // The other user
  messages: Message[];
  config: ChatConfig; // User's AI config for this person
  lastRead: number;
}

// --- AI BUDDY TYPES ---
export interface AiAvatarConfig {
  name: string;
  personality: 'sassy' | 'helpful' | 'professional' | 'mysterious';
  enabled: boolean;
}

// --- SETTINGS TYPES ---
export interface UserSettings {
  allowAiAnalysis: boolean;
  publicProfile: boolean;
  notifications: boolean;
  highQualityVideo: boolean;
  saveToCameraRoll: boolean;
}

export enum ViewState {
  AUTH = 'AUTH',
  CAMERA = 'CAMERA',
  LIVE = 'LIVE',
  GALLERY = 'GALLERY',
  SOCIAL = 'SOCIAL',
  CHAT_LIST = 'CHAT_LIST',
  CHAT_DETAIL = 'CHAT_DETAIL',
  PHOTO_DETAIL = 'PHOTO_DETAIL',
  CREATE_ALBUM = 'CREATE_ALBUM',
  ALBUM_DETAIL = 'ALBUM_DETAIL',
  PROFILE = 'PROFILE',
  REVIEW = 'REVIEW',
  SETTINGS = 'SETTINGS'
}

export type ThemeColor = 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber';
