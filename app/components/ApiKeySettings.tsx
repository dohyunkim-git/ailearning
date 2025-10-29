'use client';

import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { encryptApiKey, setEncryptedCookie, getEncryptedCookie } from '@/app/lib/encryption';

export function ApiKeySettings() {
  const [open, setOpen] = useState(false);
  const [showKeys, setShowKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
    youtube: false,
    googleSearch: false,
  });

  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    gemini: '',
    youtube: '',
    googleSearch: '',
    googleSearchEngineId: '',
  });

  const [savedKeys, setSavedKeys] = useState({
    openai: false,
    anthropic: false,
    gemini: false,
    youtube: false,
    googleSearch: false,
    googleSearchEngineId: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Check which keys exist on mount
  useEffect(() => {
    setSavedKeys({
      openai: !!getEncryptedCookie('encrypted_openai_key'),
      anthropic: !!getEncryptedCookie('encrypted_anthropic_key'),
      gemini: !!getEncryptedCookie('encrypted_gemini_key'),
      youtube: !!getEncryptedCookie('encrypted_youtube_key'),
      googleSearch: !!getEncryptedCookie('encrypted_google_search_key'),
      googleSearchEngineId: !!getEncryptedCookie('encrypted_google_search_engine_id'),
    });
  }, [open]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Encrypt and save each key if provided
      if (apiKeys.openai) {
        const encrypted = await encryptApiKey(apiKeys.openai);
        console.log('Encrypted OpenAI key (base64):', encrypted);
        console.log('Encrypted length:', encrypted.length);
        setEncryptedCookie('encrypted_openai_key', encrypted, 7);
      }

      if (apiKeys.anthropic) {
        const encrypted = await encryptApiKey(apiKeys.anthropic);
        setEncryptedCookie('encrypted_anthropic_key', encrypted, 7);
      }

      if (apiKeys.gemini) {
        const encrypted = await encryptApiKey(apiKeys.gemini);
        setEncryptedCookie('encrypted_gemini_key', encrypted, 7);
      }

      if (apiKeys.youtube) {
        const encrypted = await encryptApiKey(apiKeys.youtube);
        setEncryptedCookie('encrypted_youtube_key', encrypted, 7);
      }

      if (apiKeys.googleSearch) {
        const encrypted = await encryptApiKey(apiKeys.googleSearch);
        setEncryptedCookie('encrypted_google_search_key', encrypted, 7);
      }

      if (apiKeys.googleSearchEngineId) {
        const encrypted = await encryptApiKey(apiKeys.googleSearchEngineId);
        setEncryptedCookie('encrypted_google_search_engine_id', encrypted, 7);
      }

      // Update saved keys status
      setSavedKeys({
        openai: !!apiKeys.openai || savedKeys.openai,
        anthropic: !!apiKeys.anthropic || savedKeys.anthropic,
        gemini: !!apiKeys.gemini || savedKeys.gemini,
        youtube: !!apiKeys.youtube || savedKeys.youtube,
        googleSearch: !!apiKeys.googleSearch || savedKeys.googleSearch,
        googleSearchEngineId: !!apiKeys.googleSearchEngineId || savedKeys.googleSearchEngineId,
      });

      setOpen(false);

      // Clear input fields
      setApiKeys({
        openai: '',
        anthropic: '',
        gemini: '',
        youtube: '',
        googleSearch: '',
        googleSearchEngineId: '',
      });

      // Show success message
      const savedCount = Object.values({
        openai: apiKeys.openai,
        anthropic: apiKeys.anthropic,
        gemini: apiKeys.gemini,
        youtube: apiKeys.youtube,
        googleSearch: apiKeys.googleSearch,
        googleSearchEngineId: apiKeys.googleSearchEngineId,
      }).filter(Boolean).length;

      alert(`✅ Success! ${savedCount} API key${savedCount !== 1 ? 's' : ''} saved securely for 7 days.`);
    } catch (error) {
      console.error('Error saving keys:', error);
      alert('Failed to save API keys. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleShowKey = (key: keyof typeof showKeys) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasAnySavedKeys = Object.values(savedKeys).some(Boolean);
  const savedKeysCount = Object.values(savedKeys).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" title={hasAnySavedKeys ? `${savedKeysCount} key${savedKeysCount !== 1 ? 's' : ''} saved` : 'No keys saved'}>
          <Settings className="h-5 w-5" />
          {hasAnySavedKeys && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-500" title={`${savedKeysCount} keys saved`} />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Key Settings</DialogTitle>
          <DialogDescription>
            Enter your API keys securely. They will be encrypted and stored in your browser
            for 7 days. {hasAnySavedKeys && `(${savedKeysCount} key${savedKeysCount !== 1 ? 's' : ''} currently saved)`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Provider Keys */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">AI Providers (Choose at least one)</h3>

            {/* OpenAI */}
            <div className="space-y-2">
              <Label htmlFor="openai" className="flex items-center gap-2">
                OpenAI API Key (GPT)
                {savedKeys.openai && <span className="text-xs text-green-600">✓ Saved</span>}
              </Label>
              <div className="relative">
                <Input
                  id="openai"
                  type={showKeys.openai ? 'text' : 'password'}
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                  placeholder="sk-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShowKey('openai')}
                >
                  {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Anthropic */}
            <div className="space-y-2">
              <Label htmlFor="anthropic" className="flex items-center gap-2">
                Anthropic API Key (Claude)
                {savedKeys.anthropic && <span className="text-xs text-green-600">✓ Saved</span>}
              </Label>
              <div className="relative">
                <Input
                  id="anthropic"
                  type={showKeys.anthropic ? 'text' : 'password'}
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShowKey('anthropic')}
                >
                  {showKeys.anthropic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Gemini */}
            <div className="space-y-2">
              <Label htmlFor="gemini" className="flex items-center gap-2">
                Google Gemini API Key
                {savedKeys.gemini && <span className="text-xs text-green-600">✓ Saved</span>}
              </Label>
              <div className="relative">
                <Input
                  id="gemini"
                  type={showKeys.gemini ? 'text' : 'password'}
                  value={apiKeys.gemini}
                  onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                  placeholder="AIza..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShowKey('gemini')}
                >
                  {showKeys.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Resource Provider Keys */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Resource Providers</h3>

            {/* YouTube */}
            <div className="space-y-2">
              <Label htmlFor="youtube" className="flex items-center gap-2">
                YouTube Data API Key
                {savedKeys.youtube && <span className="text-xs text-green-600">✓ Saved</span>}
              </Label>
              <div className="relative">
                <Input
                  id="youtube"
                  type={showKeys.youtube ? 'text' : 'password'}
                  value={apiKeys.youtube}
                  onChange={(e) => setApiKeys({ ...apiKeys, youtube: e.target.value })}
                  placeholder="AIza..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShowKey('youtube')}
                >
                  {showKeys.youtube ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Google Search */}
            <div className="space-y-2">
              <Label htmlFor="googleSearch" className="flex items-center gap-2">
                Google Custom Search API Key
                {savedKeys.googleSearch && <span className="text-xs text-green-600">✓ Saved</span>}
              </Label>
              <div className="relative">
                <Input
                  id="googleSearch"
                  type={showKeys.googleSearch ? 'text' : 'password'}
                  value={apiKeys.googleSearch}
                  onChange={(e) => setApiKeys({ ...apiKeys, googleSearch: e.target.value })}
                  placeholder="AIza..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleShowKey('googleSearch')}
                >
                  {showKeys.googleSearch ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="googleSearchEngineId" className="flex items-center gap-2">
                Google Search Engine ID
                {savedKeys.googleSearchEngineId && <span className="text-xs text-green-600">✓ Saved</span>}
              </Label>
              <Input
                id="googleSearchEngineId"
                type="text"
                value={apiKeys.googleSearchEngineId}
                onChange={(e) => setApiKeys({ ...apiKeys, googleSearchEngineId: e.target.value })}
                placeholder="cx:..."
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save API Keys (7 days)'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Your API keys are encrypted using AES-256-GCM before being stored as secure cookies.
            They will automatically expire after 7 days.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
