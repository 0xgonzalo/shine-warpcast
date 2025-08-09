/** @type {import('next').NextConfig} */
const nextConfig = {
    // Silence warnings
    // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
    images: {
      domains: [
        'gateway.pinata.cloud',
        'ipfs.io',
        'cloudflare-ipfs.com',
        'dweb.link',
        'ipfs.filebase.io'
      ],
    },
    webpack: (config) => {
      config.externals.push('pino-pretty', 'lokijs', 'encoding');
      return config;
    },
  };
  
  export default nextConfig;
  