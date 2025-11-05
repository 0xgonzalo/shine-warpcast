/**
 * Envio GraphQL Integration
 *
 * This module provides functions to query the Envio indexer for song collector data.
 * Set the NEXT_PUBLIC_ENVIO_URL environment variable to your Envio endpoint.
 */

// TypeScript interfaces for the GraphQL responses
export interface Collector {
  id: string;
  songId: string;
  farcasterId: string;
  purchaseTimestamp: number;
  txHash: string;
  blockNumber: string;
}

export interface Song {
  id: string;
  songId: string;
  totalCollectors: number;
}

interface CollectorsResponse {
  Collector: Collector[];
}

interface SongResponse {
  Song: Song[];
}

// Get Envio URL from environment variable
const ENVIO_URL = process.env.NEXT_PUBLIC_ENVIO_URL;

/**
 * Helper function to execute GraphQL queries against the Envio endpoint
 */
async function queryEnvio<T>(query: string, variables?: Record<string, any>): Promise<T> {
  if (!ENVIO_URL) {
    throw new Error('NEXT_PUBLIC_ENVIO_URL environment variable is not set');
  }

  const response = await fetch(ENVIO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Envio query failed: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }

  return result.data;
}

/**
 * Get all collectors for a specific song
 * @param songId - The song ID to query collectors for
 * @param limit - Maximum number of collectors to return (default: 25)
 * @param orderBy - Order by field (default: purchaseTimestamp descending)
 * @returns Array of collector records
 */
export async function getCollectors(
  songId: number,
  limit: number = 25,
  orderBy: 'purchaseTimestamp' | 'blockNumber' = 'purchaseTimestamp'
): Promise<Collector[]> {
  const query = `
    query GetCollectors($songId: String!, $limit: Int!, $orderBy: String!) {
      Collector(
        where: { songId: { _eq: $songId } }
        limit: $limit
        order_by: [{ field: $orderBy, direction: "desc" }]
      ) {
        id
        songId
        farcasterId
        purchaseTimestamp
        txHash
        blockNumber
      }
    }
  `;

  const data = await queryEnvio<CollectorsResponse>(query, {
    songId: songId.toString(),
    limit,
    orderBy,
  });

  return data.Collector || [];
}

/**
 * Get unique collector Farcaster IDs for a specific song
 * This deduplicates collectors who may have multiple purchases
 * @param songId - The song ID to query collectors for
 * @param limit - Maximum number of unique collectors to return (default: 25)
 * @returns Array of unique Farcaster IDs
 */
export async function getUniqueCollectorFids(
  songId: number,
  limit: number = 25
): Promise<bigint[]> {
  const collectors = await getCollectors(songId, limit * 2); // Fetch more to account for duplicates

  // Deduplicate by farcasterId, keeping the most recent purchase
  const uniqueFids = new Map<string, bigint>();

  for (const collector of collectors) {
    if (!uniqueFids.has(collector.farcasterId)) {
      uniqueFids.set(collector.farcasterId, BigInt(collector.farcasterId));
    }

    if (uniqueFids.size >= limit) break;
  }

  return Array.from(uniqueFids.values());
}

/**
 * Get statistics for a specific song
 * @param songId - The song ID to query stats for
 * @returns Song statistics including total collectors
 */
export async function getSongStats(songId: number): Promise<Song | null> {
  const query = `
    query GetSongStats($songId: String!) {
      Song(where: { songId: { _eq: $songId } }) {
        id
        songId
        totalCollectors
      }
    }
  `;

  const data = await queryEnvio<SongResponse>(query, {
    songId: songId.toString(),
  });

  return data.Song && data.Song.length > 0 ? data.Song[0] : null;
}

/**
 * Get all collectors across all songs (for analytics)
 * @param limit - Maximum number of collectors to return (default: 100)
 * @returns Array of collector records
 */
export async function getAllCollectors(limit: number = 100): Promise<Collector[]> {
  const query = `
    query GetAllCollectors($limit: Int!) {
      Collector(
        limit: $limit
        order_by: [{ field: "purchaseTimestamp", direction: "desc" }]
      ) {
        id
        songId
        farcasterId
        purchaseTimestamp
        txHash
        blockNumber
      }
    }
  `;

  const data = await queryEnvio<CollectorsResponse>(query, { limit });

  return data.Collector || [];
}

/**
 * Get top collected songs (songs with most unique collectors)
 * @param limit - Maximum number of songs to return (default: 10)
 * @returns Array of song statistics ordered by total collectors
 */
export async function getTopCollectedSongs(limit: number = 10): Promise<Song[]> {
  const query = `
    query GetTopSongs($limit: Int!) {
      Song(
        limit: $limit
        order_by: [{ field: "totalCollectors", direction: "desc" }]
      ) {
        id
        songId
        totalCollectors
      }
    }
  `;

  const data = await queryEnvio<SongResponse>(query, { limit });

  return data.Song || [];
}
