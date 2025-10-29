// Core type definitions for Learning Support AI Platform

// Chat related types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

// Resource related types
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount?: string;
  url: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  publishedDate?: string;
}

export interface Resource {
  type: 'youtube' | 'article' | 'tutorial';
  data: YouTubeVideo | SearchResult;
}

export interface ResourceState {
  youtubeVideos: YouTubeVideo[];
  searchResults: SearchResult[];
  isLoading: boolean;
  error: string | null;
}

// AI Provider types
export type AIProvider = 'openai' | 'claude' | 'gemini';

// API request/response types
export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
  provider?: AIProvider;
}

export interface ChatResponse {
  message: string;
  keywords?: string[];
  youtubeVideos?: YouTubeVideo[];
  searchResults?: SearchResult[];
  error?: string;
}

export interface YouTubeSearchRequest {
  query: string;
  maxResults?: number;
}

export interface YouTubeSearchResponse {
  videos: YouTubeVideo[];
  error?: string;
}

export interface WebSearchRequest {
  query: string;
  maxResults?: number;
}

export interface WebSearchResponse {
  results: SearchResult[];
  error?: string;
}

// UI State types
export interface AppState {
  chatState: ChatState;
  resourceState: ResourceState;
  uiState: UIState;
}

export interface UIState {
  isMobileMenuOpen: boolean;
  activeResourceTab: 'youtube' | 'articles' | 'tutorials';
  theme: 'light' | 'dark' | 'system';
}

// Conversation management types
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
