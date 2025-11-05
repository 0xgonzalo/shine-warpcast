# Envio Indexer Setup Guide

This guide will walk you through setting up, testing, and deploying the Envio indexer for the SongDataBase contract.

## Overview

The Envio indexer tracks song collectors by indexing two events from the SongDataBase contract on Base:
- `UserInstaBuy(uint256 indexed audioId, uint256 indexed farcasterId)` - Single song purchases
- `UserBuy(uint256[] indexed audioIds, uint256 indexed farcasterId)` - Batch song purchases

## Prerequisites

- Node.js v22 or higher
- pnpm v8 or higher
- Docker Desktop (for local development)
- Git

## Installation

### 1. Install Envio CLI

```bash
npm install -g envio
```

Verify installation:

```bash
envio --version
```

### 2. Project Structure

The indexer configuration consists of three main files:

```
shine-onchain-app/
├── config.yaml           # Contract and network configuration
├── schema.graphql        # Data model (entities)
└── src/
    └── EventHandlers.ts  # Event processing logic
```

## Configuration Files

### config.yaml

Defines the contract address, network, start block, and events to index:

```yaml
name: shine-song-indexer
networks:
  - id: 8453  # Base mainnet
    start_block: 35365070
    contracts:
      - name: SongDataBase
        address: 0x3419c1f2d26c1c37092a28cd3a56128d2d25abd7
        handler: src/EventHandlers.ts
        events:
          - event: "UserInstaBuy(uint256 indexed audioId, uint256 indexed farcasterId)"
          - event: "UserBuy(uint256[] indexed audioIds, uint256 indexed farcasterId)"
```

### schema.graphql

Defines the data entities that will be queryable via GraphQL:

- **Collector**: Individual purchase records with songId, farcasterId, timestamp, and txHash
- **Song**: Aggregated song statistics including totalCollectors count

### src/EventHandlers.ts

Contains the event processing logic that:
1. Listens for UserInstaBuy and UserBuy events
2. Creates Collector entities for each purchase
3. Updates Song entity with collector counts

## Local Development

### 1. Generate TypeScript Types

From the project root directory, run:

```bash
pnpm codegen
```

This generates TypeScript types based on your schema and contract ABIs.

### 2. Start Local Indexer

Make sure Docker Desktop is running, then:

```bash
pnpm dev
```

This will:
- Start a local Postgres database
- Start the indexer service
- Begin syncing from block 35365070
- Expose GraphQL API at `http://localhost:8080`

### 3. Test GraphQL Queries

Open `http://localhost:8080` in your browser to access the GraphiQL playground.

#### Example Queries

**Get collectors for a specific song:**

```graphql
query GetCollectors {
  Collector(
    where: { songId: { _eq: "1" } }
    limit: 25
    order_by: [{ field: "purchaseTimestamp", direction: "desc" }]
  ) {
    id
    farcasterId
    purchaseTimestamp
    txHash
  }
}
```

**Get song statistics:**

```graphql
query GetSongStats {
  Song(where: { songId: { _eq: "1" } }) {
    songId
    totalCollectors
  }
}
```

**Get top collected songs:**

```graphql
query GetTopSongs {
  Song(
    limit: 10
    order_by: [{ field: "totalCollectors", direction: "desc" }]
  ) {
    songId
    totalCollectors
  }
}
```

## Deployment to Envio Cloud

### 1. Create GitHub Repository

If not already done, ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Add Envio indexer configuration"
git push origin main
```

### 2. Install Envio Deployments GitHub App

1. Go to https://envio.dev/app/deployments
2. Sign in with your GitHub account
3. Install the Envio Deployments GitHub App
4. Grant access to your repository

### 3. Configure Deployment

1. In the Envio dashboard, create a new deployment
2. Select your repository
3. Choose the branch to deploy from (e.g., `main`)
4. Envio will automatically detect the `config.yaml` file

### 4. Deploy

Push to your designated deployment branch:

```bash
git push origin main
```

Envio will automatically:
- Build and deploy your indexer
- Start syncing from the configured start block
- Provide a production GraphQL endpoint

### 5. Get Your Production URL

After deployment completes:
1. Go to the Envio dashboard
2. Find your deployment
3. Copy the GraphQL endpoint URL (e.g., `https://indexer.bigdevenergy.link/abc123/v1/graphql`)

## Environment Configuration

### Add Envio URL to Your App

Create or update `.env.local` in your Next.js app:

```bash
NEXT_PUBLIC_ENVIO_URL=https://indexer.bigdevenergy.link/YOUR_ENDPOINT/v1/graphql
```

Replace `YOUR_ENDPOINT` with your actual endpoint from the Envio dashboard.

### Verify Integration

The app uses the Envio URL in `app/lib/envio.ts`:

```typescript
const ENVIO_URL = process.env.NEXT_PUBLIC_ENVIO_URL;
```

## Using the Envio API in Your App

The `app/lib/envio.ts` module provides TypeScript functions to query the indexer:

### Get Collectors for a Song

```typescript
import { getUniqueCollectorFids } from '@/app/lib/envio';

const fids = await getUniqueCollectorFids(songId, 25);
```

### Get Song Statistics

```typescript
import { getSongStats } from '@/app/lib/envio';

const stats = await getSongStats(songId);
console.log(`Total collectors: ${stats?.totalCollectors}`);
```

### Get Top Collected Songs

```typescript
import { getTopCollectedSongs } from '@/app/lib/envio';

const topSongs = await getTopCollectedSongs(10);
```

## Monitoring and Debugging

### Check Indexer Status

In the Envio dashboard:
- View current block height
- Monitor sync progress
- Check for errors or warnings

### View Logs

```bash
# Local development
docker logs envio_indexer

# Production (via Envio dashboard)
# Click on your deployment → Logs tab
```

### Common Issues

**Issue: "NEXT_PUBLIC_ENVIO_URL environment variable is not set"**
- Solution: Add the environment variable to `.env.local` and restart your dev server

**Issue: Indexer not syncing**
- Check that the start block is correct
- Verify the contract address matches Base mainnet
- Ensure events are emitted from the contract

**Issue: No data returned from queries**
- Verify the indexer has synced past the blocks where events were emitted
- Check that events exist on-chain using a block explorer

## Migrating from RPC to Envio

The following functions have been replaced:

### Before (RPC-based):

```typescript
import { getCollectorsForSong } from '../../utils/contract';
const fids = await getCollectorsForSong(tokenId, 25);
```

### After (Envio-based):

```typescript
import { getUniqueCollectorFids } from '@/app/lib/envio';
const fids = await getUniqueCollectorFids(Number(tokenId), 25);
```

### Benefits of Envio:

- **Faster**: No need to scan thousands of blocks for events
- **More Reliable**: Indexed data is always available
- **Cheaper**: No RPC rate limiting issues
- **Richer Queries**: GraphQL enables complex queries and filtering

## Testing the Full Integration

1. **Start the indexer locally:**
   ```bash
   pnpm dev
   ```

2. **Set environment variable:**
   ```bash
   echo "NEXT_PUBLIC_ENVIO_URL=http://localhost:8080/v1/graphql" >> .env.local
   ```

3. **Run your Next.js app:**
   ```bash
   npm run dev
   ```

4. **Visit a song page:**
   ```
   http://localhost:3000/token/1
   ```

5. **Verify collectors are loaded** from Envio instead of RPC

## Additional Resources

- [Envio Documentation](https://docs.envio.dev)
- [GraphQL Query Guide](https://docs.envio.dev/docs/HyperIndex/query-api)
- [Event Handler Examples](https://docs.envio.dev/docs/HyperIndex/event-handlers)

## Support

If you encounter issues:
1. Check the Envio dashboard for indexer status
2. Review logs for error messages
3. Join the Envio Discord: https://discord.gg/envio
4. Consult the documentation: https://docs.envio.dev
