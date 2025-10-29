// MCP Tool definitions for AI function calling

export const MCP_TOOLS = {
  youtube_search: {
    name: 'youtube_search',
    description: 'Search for educational YouTube videos related to the topic. Use this when the user wants to learn something or needs video tutorials.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query for finding relevant YouTube videos (e.g., "how to make fried rice tutorial")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of videos to return (default: 10)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  web_search: {
    name: 'web_search',
    description: 'Search the web for articles, tutorials, and guides related to the topic. Use this to find written resources and step-by-step guides.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query for finding relevant articles and tutorials (e.g., "fried rice recipe guide")',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
};

// OpenAI function definitions
export const OPENAI_FUNCTIONS = [
  {
    type: 'function',
    function: {
      name: 'youtube_search',
      description: MCP_TOOLS.youtube_search.description,
      parameters: MCP_TOOLS.youtube_search.parameters,
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: MCP_TOOLS.web_search.description,
      parameters: MCP_TOOLS.web_search.parameters,
    },
  },
];

// Claude tool definitions
export const CLAUDE_TOOLS = [
  {
    name: 'youtube_search',
    description: MCP_TOOLS.youtube_search.description,
    input_schema: MCP_TOOLS.youtube_search.parameters,
  },
  {
    name: 'web_search',
    description: MCP_TOOLS.web_search.description,
    input_schema: MCP_TOOLS.web_search.parameters,
  },
];

// Gemini function declarations (following official docs format)
export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'youtube_search',
        description: MCP_TOOLS.youtube_search.description,
        parameters: MCP_TOOLS.youtube_search.parameters,
      },
      {
        name: 'web_search',
        description: MCP_TOOLS.web_search.description,
        parameters: MCP_TOOLS.web_search.parameters,
      },
    ],
  },
];

// Format Gemini function response
export function formatGeminiFunctionResponse(functionName: string, result: any) {
  return {
    functionResponse: {
      name: functionName,
      response: {
        result: result,
      },
    },
  };
}

// Tool execution function
export async function executeTool(toolName: string, args: any, apiKeys: { youtubeApiKey: string; googleSearchApiKey: string; googleSearchEngineId: string }) {
  switch (toolName) {
    case 'youtube_search':
      return await executeYouTubeSearch(args.query, args.maxResults ?? 10, apiKeys.youtubeApiKey);
    case 'web_search':
      return await executeWebSearch(args.query, args.maxResults ?? 10, apiKeys.googleSearchApiKey, apiKeys.googleSearchEngineId);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

async function executeYouTubeSearch(query: string, maxResults: number, apiKey: string) {
  if (!apiKey) {
    throw new Error('YouTube API key not configured. Please add it in Settings.');
  }

  // Search for videos
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('key', apiKey);
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
    return [];
  }

  // Get video details (including duration and stats)
  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  detailsUrl.searchParams.set('key', apiKey);
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
  const videos = detailsData.items?.map((item: any) => ({
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

  return videos;
}

async function executeWebSearch(query: string, maxResults: number, apiKey: string, searchEngineId: string) {
  if (!apiKey || !searchEngineId) {
    throw new Error('Google Search API key not configured. Please add it in Settings.');
  }

  // Perform Google Custom Search
  const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
  searchUrl.searchParams.set('key', apiKey);
  searchUrl.searchParams.set('cx', searchEngineId);
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('num', Math.min(maxResults, 10).toString());
  searchUrl.searchParams.set('safe', 'active');

  const response = await fetch(searchUrl.toString());

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Google Custom Search API error:', errorData);
    throw new Error('Google search request failed');
  }

  const data = await response.json();

  // Process and format search results
  const results = data.items?.map((item: any, index: number) => ({
    id: `search-${index}-${Date.now()}`,
    title: item.title,
    snippet: item.snippet,
    url: item.link,
    source: extractDomain(item.link),
    publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
  })) || [];

  return results;
}

// Helper functions
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

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}
