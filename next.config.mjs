/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  },
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  images: {
    domains: [
      'shine.mypinata.cloud',
      'tba-mobile.mypinata.cloud',
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
      'dweb.link',
      'ipfs.filebase.io',
      // Farcaster / Warpcast profile image hosts
      'imagedelivery.net',
      'i.imgur.com',
      'cdn.neynar.com',
      'cdn.warpcast.com',
      'res.cloudinary.com',
      'i.seadn.io',
      'pbs.twimg.com'
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'cdn.neynar.com' },
      { protocol: 'https', hostname: 'cdn.warpcast.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'i.seadn.io' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'tba-mobile.mypinata.cloud' },
    ],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

export default nextConfig;
  