import { SongDataBase } from "generated";

// Handler for UserInstaBuy event - single song purchase
SongDataBase.UserInstaBuy.handler(async ({ event, context }) => {
  const audioId = event.params.audioId;
  const farcasterId = event.params.farcasterId;
  const txHash = event.transaction.hash;
  const blockNumber = BigInt(event.block.number);
  const timestamp = event.block.timestamp;

  // Create a unique ID for this collector entry (combination of songId, farcasterId, and txHash)
  const collectorId = `${audioId}-${farcasterId}-${txHash}`;

  // Get or create Song entity
  const songId = audioId.toString();
  let song = await context.Song.get(songId);

  if (!song) {
    // First time this song is being collected
    song = {
      id: songId,
      songId: audioId,
      totalCollectors: 0,
    };
  }

  // Check if this collector already exists (shouldn't happen, but just in case)
  const existingCollector = await context.Collector.get(collectorId);

  if (!existingCollector) {
    // Create new Collector entry
    const collector = {
      id: collectorId,
      songId: audioId,
      farcasterId: farcasterId,
      purchaseTimestamp: timestamp,
      txHash: txHash,
      blockNumber: blockNumber,
    };

    context.Collector.set(collector);

    // Update song total collectors count
    song.totalCollectors += 1;
    context.Song.set(song);
  }
});

// Handler for UserBuy event - multiple songs purchase
SongDataBase.UserBuy.handler(async ({ event, context }) => {
  const audioIds = event.params.audioIds;
  const farcasterId = event.params.farcasterId;
  const txHash = event.transaction.hash;
  const blockNumber = BigInt(event.block.number);
  const timestamp = event.block.timestamp;

  // Process each song in the batch purchase
  for (const audioId of audioIds) {
    const collectorId = `${audioId}-${farcasterId}-${txHash}`;
    const songId = audioId.toString();

    // Get or create Song entity
    let song = await context.Song.get(songId);

    if (!song) {
      song = {
        id: songId,
        songId: audioId,
        totalCollectors: 0,
      };
    }

    // Check if this collector already exists
    const existingCollector = await context.Collector.get(collectorId);

    if (!existingCollector) {
      // Create new Collector entry
      const collector = {
        id: collectorId,
        songId: audioId,
        farcasterId: farcasterId,
        purchaseTimestamp: timestamp,
        txHash: txHash,
        blockNumber: blockNumber,
      };

      context.Collector.set(collector);

      // Update song total collectors count
      song.totalCollectors += 1;
      context.Song.set(song);
    }
  }
});
