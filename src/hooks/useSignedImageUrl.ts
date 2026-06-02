import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'trade-analyses';

export function extractStoragePath(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const marker = `/${BUCKET}/`;
  const idx = stored.indexOf(marker);
  if (idx >= 0) {
    return decodeURIComponent(stored.substring(idx + marker.length).split('?')[0]);
  }
  // Already a path
  return stored.replace(/^\/+/, '');
}

export async function getSignedImageUrl(stored: string | null | undefined, expiresIn = 3600): Promise<string | null> {
  const path = extractStoragePath(stored);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}

export function useSignedImageUrl(stored: string | null | undefined, expiresIn = 3600) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!stored) {
      setUrl(null);
      return;
    }
    getSignedImageUrl(stored, expiresIn).then((u) => {
      if (active) setUrl(u);
    });
    return () => {
      active = false;
    };
  }, [stored, expiresIn]);
  return url;
}
