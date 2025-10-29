import { NextRequest, NextResponse } from 'next/server';
import { WebSearchRequest, WebSearchResponse, SearchResult } from '@/app/types';
import { getApiKeys } from '@/app/lib/serverEncryption';

export async function POST(request: NextRequest) {
  try {
    const body: WebSearchRequest = await request.json();
    const { query, maxResults = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get API keys (from cookies or env)
    const keys = await getApiKeys();

    console.log('Search API - Keys retrieved:', {
      googleSearchApiKey: keys.googleSearchApiKey ? `${keys.googleSearchApiKey.substring(0, 10)}...` : 'MISSING',
      googleSearchEngineId: keys.googleSearchEngineId ? `${keys.googleSearchEngineId}...` : 'MISSING',
      searchKeyLength: keys.googleSearchApiKey?.length || 0,
      engineIdLength: keys.googleSearchEngineId?.length || 0
    });

    if (!keys.googleSearchApiKey || !keys.googleSearchEngineId) {
      return NextResponse.json(
        { error: 'Google Search API key not configured. Please add it in Settings.' },
        { status: 500 }
      );
    }
    
    // Perform Google Custom Search
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.set('key', keys.googleSearchApiKey);
    searchUrl.searchParams.set('cx', keys.googleSearchEngineId);
    searchUrl.searchParams.set('q', `${query}`);
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
    const results: SearchResult[] = data.items?.map((item: any, index: number) => ({
      id: `search-${index}-${Date.now()}`,
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      source: extractDomain(item.link),
      publishedDate: item.pagemap?.metatags?.[0]?.['article:published_time'],
    })) || [];

    const searchResponse: WebSearchResponse = {
      results,
    };

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Failed to perform web search' },
      { status: 500 }
    );
  }
}

// Extract domain from URL for display
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}
