import { NextRequest, NextResponse } from 'next/server';
import { YouTubeSearchRequest, YouTubeSearchResponse, YouTubeVideo } from '@/app/types';
import { getApiKeys } from '@/app/lib/serverEncryption';

export async function POST(request: NextRequest) {
  try {
    const body: YouTubeSearchRequest = await request.json();
    const { query, maxResults = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get API keys (from cookies or env)
    const keys = await getApiKeys();

    console.log('YouTube API - Keys retrieved:', {
      youtubeApiKey: keys.youtubeApiKey ? `${keys.youtubeApiKey.substring(0, 10)}...` : 'MISSING',
      length: keys.youtubeApiKey?.length || 0
    });

    if (!keys.youtubeApiKey) {
      return NextResponse.json(
        { error: 'YouTube API key not configured. Please add it in Settings.' },
        { status: 500 }
      );
    }

    // Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('key', keys.youtubeApiKey);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('maxResults', maxResults.toString());
    searchUrl.searchParams.set('relevanceLanguage', 'ko');
    searchUrl.searchParams.set('safeSearch', 'strict');
    searchUrl.searchParams.set('videoEmbeddable', 'true');

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}));
      console.error('YouTube Search API error:', errorData);
      throw new Error('YouTube search request failed');
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',');

    if (!videoIds) {
      return NextResponse.json({ videos: [] });
    }

    // Get video details (including duration and stats)
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('key', keys.youtubeApiKey);
    detailsUrl.searchParams.set('id', videoIds);
    detailsUrl.searchParams.set('part', 'contentDetails,statistics,snippet');

    const detailsResponse = await fetch(detailsUrl.toString());

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json().catch(() => ({}));
      console.error('YouTube Details API error:', errorData);
      throw new Error('YouTube details request failed');
    }

    const detailsData = await detailsResponse.json();

    // Process and format videos
    const videos: YouTubeVideo[] = detailsData.items?.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: formatDuration(item.contentDetails.duration),
      viewCount: formatViewCount(item.statistics.viewCount),
      url: `https://www.youtube.com/watch?v=${item.id}`,
    })) || [];

    const response: YouTubeSearchResponse = {
      videos,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json(
      { error: 'Failed to search YouTube videos' },
      { status: 500 }
    );
  }
}

// Convert ISO 8601 duration to readable format (e.g., "PT15M33S" -> "15:33")
function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format view count to readable format (e.g., "1234567" -> "1.2M")
function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}
