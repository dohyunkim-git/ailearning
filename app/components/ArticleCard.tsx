'use client';

import { SearchResult } from '@/app/types';
import { ExternalLink, FileText } from 'lucide-react';

interface ArticleCardProps {
  article: SearchResult;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group rounded-lg border bg-card hover:bg-accent/50 transition-colors p-4"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{article.snippet}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate">{article.source}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </div>
        </div>
      </div>
    </a>
  );
}
