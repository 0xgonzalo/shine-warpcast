'use client';

import { useState, useEffect } from 'react';
import { getIPFSGatewayURL } from '@/app/utils/pinata';

/**
 * Metadata format for songs - normalized across old and new formats
 */
export interface TokenMetadata {
  imageURI: string | null;
  description: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Detects if a URL points to an image by checking magic bytes or content-type
 */
async function isImageURL(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') || '';
    return contentType.startsWith('image/');
  } catch {
    // If HEAD fails, try to detect by extension
    const lowered = url.toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => lowered.includes(ext));
  }
}

/**
 * Fetches metadata from IPFS with support for both old and new formats
 *
 * OLD FORMAT: metadataURI points directly to an image file
 * NEW FORMAT: metadataURI points to a JSON file containing { imageURI, description, ... }
 */
export async function fetchTokenMetadata(metadataURI: string | undefined): Promise<Omit<TokenMetadata, 'isLoading'>> {
  if (!metadataURI || metadataURI === 'ipfs://placeholder-metadata-uri' || metadataURI === 'ipfs://placeholder-image-uri') {
    return { imageURI: null, description: null, error: null };
  }

  // Try multiple gateways
  const gateways = [0, 1, 2, 3];

  for (const gatewayIndex of gateways) {
    try {
      const url = getIPFSGatewayURL(metadataURI, gatewayIndex);
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';

      // If response is JSON, parse it (NEW FORMAT)
      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
        try {
          const text = await response.text();
          // Try to parse as JSON
          const json = JSON.parse(text);

          // Validate it's actually a metadata object (not an error page)
          if (typeof json === 'object' && json !== null) {
            return {
              imageURI: json.imageURI || json.image || null,
              description: json.description || null,
              error: null
            };
          }
        } catch {
          // Not valid JSON, might be an image with wrong content-type
          // Fall through to image handling
        }
      }

      // If response is an image or we couldn't parse JSON, use metadataURI as imageURI (OLD FORMAT)
      if (contentType.startsWith('image/') || !contentType.includes('json')) {
        return {
          imageURI: metadataURI,
          description: null,
          error: null
        };
      }

      // If we got here, try treating it as an image anyway (fallback)
      return {
        imageURI: metadataURI,
        description: null,
        error: null
      };

    } catch (error) {
      // Try next gateway
      continue;
    }
  }

  // All gateways failed - fallback to treating metadataURI as image (old format assumption)
  // This is better than showing nothing
  return {
    imageURI: metadataURI,
    description: null,
    error: 'Failed to fetch metadata from all gateways'
  };
}

/**
 * React hook for fetching token metadata with loading state
 */
export function useTokenMetadata(metadataURI: string | undefined): TokenMetadata {
  const [state, setState] = useState<TokenMetadata>({
    imageURI: null,
    description: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await fetchTokenMetadata(metadataURI);

      if (!cancelled) {
        setState({
          ...result,
          isLoading: false
        });
      }
    }

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [metadataURI]);

  return state;
}
