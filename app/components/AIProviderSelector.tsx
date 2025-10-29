'use client';

import { AIProvider } from '@/app/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bot } from 'lucide-react';

interface AIProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
}

export function AIProviderSelector({ value, onChange }: AIProviderSelectorProps) {
  return (
    <Select value={value} onValueChange={(val) => onChange(val as AIProvider)}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          <SelectValue placeholder="Select AI" />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="openai">
          <div className="flex flex-col">
            <span className="font-medium">GPT-5</span>
            <span className="text-xs text-muted-foreground">by OpenAI</span>
          </div>
        </SelectItem>
        <SelectItem value="claude">
          <div className="flex flex-col">
            <span className="font-medium">Sonnet 4.5</span>
            <span className="text-xs text-muted-foreground">by Anthropic</span>
          </div>
        </SelectItem>
        <SelectItem value="gemini">
          <div className="flex flex-col">
            <span className="font-medium">Gemini pro</span>
            <span className="text-xs text-muted-foreground">by Google</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
