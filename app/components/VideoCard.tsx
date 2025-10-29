'use client';

import { YouTubeVideo } from '@/app/types';
import { ExternalLink, Clock } from 'lucide-react';
import Image from 'next/image';

interface VideoCardProps {
  video: YouTubeVideo;
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group rounded-lg border bg-card hover:bg-accent/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {video.duration}
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">{video.channelTitle}</p>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          {video.viewCount && (
            <span className="text-xs text-muted-foreground">{video.viewCount} views</span>
          )}
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </a>
  );
}
