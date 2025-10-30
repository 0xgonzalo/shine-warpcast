const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY as string;
const PINATA_SECRET_KEY = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY as string;

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  throw new Error('Missing Pinata API credentials. Please check your .env file. Make sure to prefix them with NEXT_PUBLIC_');
}

const PINATA_BASE_URL = 'https://api.pinata.cloud';

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

export async function uploadToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const headers: HeadersInit = {
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    };

    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Pinata API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to upload to IPFS: ${response.statusText} - ${errorData}`);
    }

    const data: PinataResponse = await response.json();
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error('Upload error details:', error);
    throw error;
  }
}

export async function uploadMetadataToIPFS(metadata: {
  name: string;
  description: string;
  audioURI: string;
  imageURI: string;
  tags?: string[];
}): Promise<string> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'pinata_api_key': PINATA_API_KEY,
      'pinata_secret_api_key': PINATA_SECRET_KEY,
    };

    const response = await fetch(`${PINATA_BASE_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers,
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Pinata API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Failed to upload metadata to IPFS: ${response.statusText} - ${errorData}`);
    }

    const data: PinataResponse = await response.json();
    return `ipfs://${data.IpfsHash}`;
  } catch (error) {
    console.error('Metadata upload error details:', error);
    throw error;
  }
}

// List of IPFS gateways to try (in order of preference)
// Custom Pinata gateway is first to utilize dedicated gateway for faster loading
const IPFS_GATEWAYS = [
  'https://shine.mypinata.cloud/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://ipfs.io/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
  'https://ipfs.filebase.io/ipfs'
];

// Helper function to get IPFS gateway URL
export function getIPFSGatewayURL(ipfsURI: string, gatewayIndex: number = 0): string {
  if (!ipfsURI.startsWith('ipfs://')) {
    return ipfsURI;
  }
  const hash = ipfsURI.replace('ipfs://', '');
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}/${hash}`;
}

// Helper function to get all possible gateway URLs for an IPFS URI
export function getAllIPFSGatewayURLs(ipfsURI: string): string[] {
  if (!ipfsURI.startsWith('ipfs://')) {
    return [ipfsURI];
  }
  const hash = ipfsURI.replace('ipfs://', '');
  return IPFS_GATEWAYS.map(gateway => `${gateway}/${hash}`);
} 