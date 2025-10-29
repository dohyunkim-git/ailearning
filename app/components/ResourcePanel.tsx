'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YouTubeVideo, SearchResult } from '@/app/types';
import { VideoCard } from './VideoCard';
import { ArticleCard } from './ArticleCard';
import { Loader2 } from 'lucide-react';

interface ResourcePanelProps {
  youtubeVideos: YouTubeVideo[];
  articles: SearchResult[];
  isLoading: boolean;
}

export function ResourcePanel({
  youtubeVideos,
  articles,
  isLoading,
}: ResourcePanelProps) {
  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="videos" className="flex flex-col h-full">
        <div className="border-b px-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="videos" className="flex-1 sm:flex-none">
              Videos ({youtubeVideos.length})
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex-1 sm:flex-none">
              Articles & Guides ({articles.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          {/* YouTube Videos Tab */}
          <TabsContent value="videos" className="h-full m-0 p-4 overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : youtubeVideos.length > 0 ? (
              <div className="space-y-4">
                {youtubeVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No videos yet"
                description="Start a conversation and I'll find relevant video tutorials for you."
              />
            )}
          </TabsContent>

          {/* Articles & Guides Tab */}
          <TabsContent value="articles" className="h-full m-0 p-4 overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No articles yet"
                description="Start a conversation and I'll find relevant articles and guides for you."
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin mb-2" />
      <p className="text-sm">Finding resources...</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm max-w-sm">{description}</p>
    </div>
  );
}
