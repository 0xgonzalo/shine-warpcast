"use client";

import Link from "next/link";
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import useConnectedWallet from "@/hooks/useConnectedWallet";
import { useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getMostCollectedArtists } from '../utils/contract';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { login, logout } = usePrivy();
  const { isDarkMode, toggleTheme } = useTheme();
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
    <nav className="w-full bg-white/10 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            href="/" 
            className={`text-xl font-bold transition-colors ${
              isDarkMode 
                ? 'text-white hover:text-gray-200' 
                : 'text-[#0000FE] hover:text-gray-600'
            }`}
          >
            Shine
          </Link>

          {/* Right Side Controls */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? (
                // Sun icon for light mode
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon icon for dark mode
                <svg className="w-5 h-5 text-[#0000FE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            {/* Wallet Connection/Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              {isAuthenticated && (farcasterUsername || connectedWallet) ? (
                <div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-black' : 'bg-[#0000FE]'} transition-colors text-white`}
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
                      stroke="#FFFFFF" 
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