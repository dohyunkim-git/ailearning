'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface LinkPreviewProps {
  url: string;
  children?: React.ReactNode;
}

interface PreviewData {
  title: string;
  description: string;
  image?: string;
  url: string;
  domain: string;
}

export function LinkPreview({ url, children }: LinkPreviewProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    // Only fetch preview for standalone URLs (not inline links)
    const isStandaloneUrl = typeof children === 'string' && children.trim() === url.trim();

    if (isStandaloneUrl) {
      setShowPreview(true);
      fetchPreview();
    }
  }, [url, children]);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/link-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Failed to fetch preview');

      const data = await response.json();
      setPreview(data);
    } catch (err) {
      console.error('Link preview error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // For inline links, show regular hyperlink
  if (!showPreview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  // For standalone URLs, show preview card
  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card my-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading preview...</span>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card hover:bg-accent transition-colors my-2"
      >
        <ExternalLink className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-primary hover:underline truncate">{url}</span>
      </a>
    );
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors my-2 bg-card group"
    >
      <div className="flex gap-3 p-3">
        {preview.image && (
          <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            <Image
              src={preview.image}
              alt={preview.title}
              fill
              className="object-cover"
              sizes="96px"
              onError={(e) => {
                // Hide image on error
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
            {preview.title}
          </h4>
          {preview.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {preview.description}
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{preview.domain}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
