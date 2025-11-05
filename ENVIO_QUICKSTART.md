# Envio Indexer Quick Start

## TL;DR

```bash
# 1. Install Envio CLI
npm install -g envio

# 2. Generate types
npm run envio:codegen

# 3. Start local indexer (requires Docker)
npm run envio:dev

# 4. Set environment variable
echo "NEXT_PUBLIC_ENVIO_URL=http://localhost:8080/v1/graphql" >> .env.local

# 5. Test GraphQL endpoint
open http://localhost:8080
```

## Quick Deploy to Production

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Envio indexer"
   git push origin main
   ```

2. **Deploy on Envio:**
   - Go to https://envio.dev/app/deployments
   - Sign in with GitHub
   - Install Envio Deployments app
   - Select your repository
   - Deploy!

3. **Get your endpoint URL** from the Envio dashboard

4. **Update .env.local:**
   ```bash
   NEXT_PUBLIC_ENVIO_URL=https://indexer.bigdevenergy.link/YOUR_ENDPOINT/v1/graphql
   ```

## Test a Query

Visit `http://localhost:8080` and run:

```graphql
query {
  Collector(limit: 5, order_by: [{ field: "purchaseTimestamp", direction: "desc" }]) {
    farcasterId
    songId
    purchaseTimestamp
  }
}
```

## Files Overview

- **config.yaml** - Contract address, events to track
- **schema.graphql** - Data structure (Collector, Song entities)
- **src/EventHandlers.ts** - Event processing logic
- **app/lib/envio.ts** - TypeScript API client

## Common Commands

```bash
# Generate TypeScript types
npm run envio:codegen

# Start local development
npm run envio:dev

# View GraphQL playground
open http://localhost:8080

# Check Docker logs
docker logs envio_indexer
```

## Integration in Code

```typescript
// Before (RPC - slow, unreliable)
import { getCollectorsForSong } from './utils/contract';
const fids = await getCollectorsForSong(tokenId, 25);

// After (Envio - fast, reliable)
import { getUniqueCollectorFids } from '@/app/lib/envio';
const fids = await getUniqueCollectorFids(Number(tokenId), 25);
```

## Need Help?

- Full guide: See `ENVIO_SETUP.md`
- Docs: https://docs.envio.dev
- Discord: https://discord.gg/envio
