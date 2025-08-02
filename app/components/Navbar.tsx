"use client";

import Link from "next/link";
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import useConnectedWallet from "@/hooks/useConnectedWallet";
import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getMostCollectedArtists } from '../utils/contract';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';

export default function Navbar() {
  const { login, logout } = usePrivy();
  const { 
    connectedWallet,
    isReady,
    isAuthenticated,
    isConnecting,
    connectWallet,
    hasExternalWallet,
    farcasterUsername,
    farcasterPfpUrl
  } = useConnectedWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [collectToken, setCollectToken] = useState<{ tokenId: bigint, name: string, imageURI: string } | null>(null);
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectTxHash, setCollectTxHash] = useState<string | null>(null);

  const { writeContract, isPending, isSuccess, data: txData, error: txError } = useWriteContract();

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch the most collected token for the Collect button
  useEffect(() => {
    let mounted = true;
    async function fetchToken() {
      setCollectLoading(true);
      setCollectError(null);
      try {
        const artists = await getMostCollectedArtists(1);
        if (mounted && artists && artists.length > 0 && artists[0].exampleToken) {
          setCollectToken({
            tokenId: artists[0].exampleToken.tokenId,
            name: artists[0].exampleToken.name,
            imageURI: artists[0].exampleToken.imageURI,
          });
        }
      } catch (e) {
        setCollectError('Failed to load collectable song');
      } finally {
        setCollectLoading(false);
      }
    }
    fetchToken();
    return () => { mounted = false; };
  }, []);

  const handleConnect = async () => {
    const result = await connectWallet();
    if (result.needsLogin) {
      await login();
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  // Handle collect action
  const handleNavbarCollect = () => {
    if (!isAuthenticated || !collectToken) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI,
      functionName: 'buy',
      args: [collectToken.tokenId],
      value: BigInt(777000000000000), // 0.000777 ETH in wei
    });
  };

  // Show modal on success
  useEffect(() => {
    if (isSuccess && txData && collectToken) {
      setCollectTxHash(txData as string);
      setShowCollectModal(true);
    }
  }, [isSuccess, txData, collectToken]);

  if (!isReady) {
    return null; // Don't render until Privy is ready
  }

  return (
    <nav className="w-full bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            href="/" 
            className="text-xl font-bold text-white hover:text-gray-200 transition-colors"
          >
            Shine
          </Link>

          {/* Collect Button */}
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <button
                onClick={handleNavbarCollect}
                disabled={collectLoading || isPending || !collectToken || !isAuthenticated}
                className="px-4 py-2 bg-gradient-to-r from-[#5D2DA0] to-[#821FA5] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                title={collectToken ? `Collect ${collectToken.name}` : 'Collect'}
              >
                {collectLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                ) : isPending ? (
                  'Collecting...'
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    Collect
                  </>
                )}
              </button>
            )}
            {/* Wallet Connection/Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated && (farcasterUsername || connectedWallet) ? (
                <div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black transition-colors text-white"
                  >
                    {/* Prioritize Farcaster avatar and username when available */}
                    {farcasterPfpUrl ? (
                      <>
                        <img src={farcasterPfpUrl} alt={farcasterUsername || 'Farcaster User'} className="w-6 h-6 rounded-full" />
                        {farcasterUsername && <span className="text-sm">{farcasterUsername}</span>}
                      </>
                    ) : farcasterUsername ? (
                      /* Show username even without avatar */
                      <span className="text-sm">{farcasterUsername}</span>
                    ) : connectedWallet ? (
                      /* Fallback to wallet address only when no Farcaster data */
                      <span className="text-sm">
                        {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
                      </span>
                    ) : null}
                    <svg 
                      className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg bg-black backdrop-blur-sm border border-white/10 shadow-lg py-1 z-50">
                      <Link
                        href="/create"
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Create
                      </Link>
                      <Link
                        href={connectedWallet ? `/profile/${connectedWallet}` : farcasterUsername ? `/profile/@${farcasterUsername}` : '/profile'}
                        className="block px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleDisconnect}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 transition-colors"
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className={`px-4 py-2 rounded-lg transition-colors text-white font-medium ${
                    isConnecting 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isConnecting 
                    ? 'Connecting...' 
                    : isAuthenticated
                      ? 'Link Wallet'
                      : 'Connect Wallet'
                  }
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collect Success Modal */}
      {showCollectModal && collectToken && collectTxHash && (
        <CollectedModal
          nft={{ imageURI: collectToken.imageURI, name: collectToken.name }}
          txHash={collectTxHash}
          onClose={() => setShowCollectModal(false)}
        />
      )}
    </nav>
  );
} 