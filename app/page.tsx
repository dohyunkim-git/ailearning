'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from './components/MainLayout';
import { ChatPanel } from './components/ChatPanel';
import { ResourcePanel } from './components/ResourcePanel';
import { Message, YouTubeVideo, SearchResult, AIProvider } from './types';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [articles, setArticles] = useState<SearchResult[]>([]);
  const [isResourcesLoading, setIsResourcesLoading] = useState(false);
  const [aiProvider, setAIProvider] = useState<AIProvider>('openai');

  // Load AI provider preference from localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('aiProvider') as AIProvider;
    if (savedProvider && ['openai', 'claude', 'gemini'].includes(savedProvider)) {
      setAIProvider(savedProvider);
    }
  }, []);

  // Save AI provider preference to localStorage
  const handleAIProviderChange = (provider: AIProvider) => {
    setAIProvider(provider);
    localStorage.setItem('aiProvider', provider);
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setIsResourcesLoading(true);

    try {
      // Call chat API with selected provider
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages,
          provider: aiProvider,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`${await chatResponse.text()}`);
      }

      const chatData = await chatResponse.json();

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: chatData.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update resources from AI's function calls
      if (chatData.youtubeVideos && chatData.youtubeVideos.length > 0) {
        setYoutubeVideos(chatData.youtubeVideos);
      }

      if (chatData.searchResults && chatData.searchResults.length > 0) {
        // Show all search results in articles tab
        setArticles(chatData.searchResults);
      }
    } catch (error) {
      console.error('Error:', error);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `${error}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsResourcesLoading(false);
    }
  };

  return (
    <MainLayout
      aiProvider={aiProvider}
      onAIProviderChange={handleAIProviderChange}
      chatPanel={
        <ChatPanel
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          aiProvider={aiProvider}
        />
      }
      resourcePanel={
        <ResourcePanel
          youtubeVideos={youtubeVideos}
          articles={articles}
          isLoading={isResourcesLoading}
        />
      }
    />
  );
}
