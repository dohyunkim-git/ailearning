'use client';

import { useState, useEffect, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { AIProviderSelector } from './AIProviderSelector';
import { ApiKeySettings } from './ApiKeySettings';
import { ThemeToggle } from './ThemeToggle';
import { AIProvider } from '@/app/types';

interface MainLayoutProps {
  chatPanel: React.ReactNode;
  resourcePanel: React.ReactNode;
  aiProvider: AIProvider;
  onAIProviderChange: (provider: AIProvider) => void;
}

export function MainLayout({ chatPanel, resourcePanel, aiProvider, onAIProviderChange }: MainLayoutProps) {
  // Desktop: percentage of left panel width (0-100)
  // Mobile: percentage of top panel height (0-100)
  const [panelSize, setPanelSize] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved panel size from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('panelSize');
    if (saved) {
      setPanelSize(parseFloat(saved));
    }
  }, []);

  // Save panel size to localStorage
  const savePanelSize = (size: number) => {
    setPanelSize(size);
    localStorage.setItem('panelSize', size.toString());
  };

  // Handle drag start
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  // Add/remove dragging class to body
  useEffect(() => {
    if (isDragging) {
      document.body.classList.add('dragging-active');
    } else {
      document.body.classList.remove('dragging-active');
    }
  }, [isDragging]);

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 1024; // lg breakpoint

      if (isMobile) {
        // Vertical resize for mobile (up/down)
        const y = e.clientY - rect.top;
        const percentage = (y / rect.height) * 100;
        const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
        savePanelSize(clampedPercentage);
      } else {
        // Horizontal resize for desktop (left/right)
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
        savePanelSize(clampedPercentage);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const isMobile = window.innerWidth < 1024;

      if (isMobile) {
        const y = touch.clientY - rect.top;
        const percentage = (y / rect.height) * 100;
        const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
        savePanelSize(clampedPercentage);
      } else {
        const x = touch.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const clampedPercentage = Math.min(Math.max(percentage, 20), 80);
        savePanelSize(clampedPercentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="flex lg:flex-row flex-col h-screen w-full overflow-hidden bg-background"
    >
      {/* Chat Panel */}
      <div
        className="flex flex-col lg:border-r order-3 lg:order-1"
        style={{
          width: isMobile ? '100%' : `${panelSize}%`,
          height: isMobile ? `${100 - panelSize}%` : '100%',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-base lg:text-lg font-semibold truncate">Learning AI Assistant</h1>
          <div className="flex items-center gap-1 lg:gap-2">
            <AIProviderSelector value={aiProvider} onChange={onAIProviderChange} />
            <ThemeToggle />
            <ApiKeySettings />
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">{chatPanel}</div>
      </div>

      {/* Draggable Divider */}
      <div
        className="relative flex items-center justify-center bg-border hover:bg-primary/20 transition-colors lg:w-1 w-full h-[2px] lg:h-full group order-2"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          cursor: isMobile ? 'row-resize' : 'col-resize',
        }}
      >
        <div className="absolute flex items-center justify-center bg-muted rounded-md group-hover:bg-primary/10 transition-colors lg:w-5 lg:h-10 w-10 h-4 shadow-sm">
          <GripVertical className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors lg:rotate-0 rotate-90" />
        </div>
      </div>

      {/* Resources Panel */}
      <div
        className="flex flex-col order-1 lg:order-3"
        style={{
          width: isMobile ? '100%' : `${100 - panelSize}%`,
          height: isMobile ? `${panelSize}%` : '100%',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-base lg:text-lg font-semibold">Learning Resources</h2>
        </div>

        {/* Resource Content */}
        <div className="flex-1 overflow-hidden">{resourcePanel}</div>
      </div>
    </div>
  );
}
