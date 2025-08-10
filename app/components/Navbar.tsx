"use client";

import Link from "next/link";
import Image from "next/image";
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import useConnectedWallet from "@/hooks/useConnectedWallet";
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getMostCollectedArtists, getTotalPriceForInstaBuy, userOwnsSong, generatePseudoFarcasterId } from '../utils/contract';
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
    farcasterPfpUrl,
    isInFarcaster,
    hasAttemptedAutoConnect,
    farcasterUser,
    isQuickAuthAuthenticated,
    quickAuthToken
  } = useConnectedWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [collectToken, setCollectToken] = useState<{ tokenId: bigint, name: string, imageURI: string } | null>(null);
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectTxHash, setCollectTxHash] = useState<string | null>(null);

  const { writeContract, isPending, isSuccess, data: txData, error: txError } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, isError: isReceiptError } = useWaitForTransactionReceipt({
    hash: (txData as `0x${string}` | undefined),
  });

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
        setCollectError("Failed to load collectable song");
      } finally {
        setCollectLoading(false);
      }
    }
    fetchToken();
    return () => { mounted = false; };
  }, []);

  const handleConnect = async () => {
    const result = await connectWallet();
    
    // If Quick Auth was used, no need for Privy login
    if (result.quickAuth) {
      console.log('✅ Connected with Quick Auth');
      return;
    }
    
    // Only use Privy login if not in Farcaster or Quick Auth failed
    if (result.needsLogin && !isQuickAuthAuthenticated) {
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
  const handleNavbarCollect = async () => {
    if (!isAuthenticated || !collectToken || !connectedWallet) return;

    // Get Farcaster ID - use real FID if available, otherwise generate pseudo-FID from wallet
    let farcasterId: bigint;
    if (farcasterUser?.fid) {
      farcasterId = BigInt(farcasterUser.fid);
      console.log('🎯 [Navbar] Using real Farcaster ID:', farcasterId.toString());
    } else {
      farcasterId = generatePseudoFarcasterId(connectedWallet);
      console.log('🎯 [Navbar] Using pseudo-Farcaster ID for wallet:', connectedWallet, '→', farcasterId.toString());
    }
    
    try {
      // Check if user already owns this song
      const alreadyOwns = await userOwnsSong(farcasterId, collectToken.tokenId);
      if (alreadyOwns) {
        setCollectError('You already own this song!');
        return;
      }

      // Get the correct total price (song price + operation fee)
      const totalPrice = await getTotalPriceForInstaBuy(collectToken.tokenId);
      console.log('💰 [Navbar] Total price (including fees):', totalPrice.toString(), 'wei');

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'instaBuy',
        args: [
          collectToken.tokenId, // songId
          farcasterId // Use actual or pseudo Farcaster ID
        ],
        value: totalPrice, // Use correct price including operation fee
      });
    } catch (error) {
      console.error('❌ [Navbar] Error preparing collect transaction:', error);
      setCollectError('Failed to prepare transaction. Please try again.');
    }
  };

  // Show modal on success
  useEffect(() => {
    if (isConfirmed && receipt && receipt.status === 'success' && collectToken) {
      setCollectTxHash((txData as string) || null);
      setShowCollectModal(true);
    }
    if ((isReceiptError || (isConfirmed && receipt && receipt.status === 'reverted')) && txData) {
      setCollectError('Transaction failed or was reverted.');
      setShowCollectModal(false);
      setCollectTxHash(null);
    }
  }, [isConfirmed, isReceiptError, receipt, txData, collectToken]);

  return (
    <nav className={`w-full border-b z-20 ${
      isDarkMode 
        ? 'bg-black border-white/10' 
        : 'bg-white border-gray-200'
    }`}>
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
            {/* Leaderboard Trophy Icon */}
            <Link
              href="/leaderboard"
              className="flex items-center space-x-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Leaderboard"
            >
              <Image 
                src={isDarkMode ? '/trophy.svg' : '/trophy-blue.svg'} 
                alt="Leaderboard" 
                width={20}
                height={20}
                className="w-5 h-5" 
              />
              <span className={`text-sm font-medium hidden sm:block ${
                isDarkMode 
                  ? 'text-white' 
                  : 'text-[#0000FE]'
              }`}>
                Leaderboard
              </span>
            </Link>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
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
              {isReady && isAuthenticated && (farcasterUsername || connectedWallet) ? (
                <div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-black' : 'bg-[#0000FE]'} transition-colors text-white z-10`}
                  >
                    {/* Prioritize Farcaster avatar and username when available */}
                    {farcasterPfpUrl ? (
                      <>
                        <Image src={farcasterPfpUrl} alt={farcasterUsername || "Farcaster User"} width={24} height={24} className="w-6 h-6 rounded-full" />
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
                    <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 ${
                      isDarkMode 
                        ? 'bg-black border border-white/10' 
                        : 'bg-white border border-gray-200'
                    }`}>
                      <Link
                        href="/create"
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-white hover:bg-white/10' 
                            : 'text-[#0000FE] hover:bg-gray-100'
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Create
                      </Link>
                      <Link
                        href={connectedWallet ? `/profile/${connectedWallet}` : farcasterUsername ? `/profile/@${farcasterUsername}` : '/profile'}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-white hover:bg-white/10' 
                            : 'text-[#0000FE] hover:bg-gray-100'
                        }`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                      <button
                        onClick={handleDisconnect}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          isDarkMode 
                            ? 'text-red-400 hover:bg-white/10' 
                            : 'text-red-500 hover:bg-gray-100'
                        }`}
                      >
                        Disconnect Wallet
                      </button>
                    </div>
                  )}
                </div>
              ) : isReady ? (
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || (isInFarcaster && !hasAttemptedAutoConnect)}
                  className={`px-4 py-2 rounded-lg transition-colors text-white font-medium ${
                    isConnecting || (isInFarcaster && !hasAttemptedAutoConnect)
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isConnecting 
                    ? (isInFarcaster && !hasAttemptedAutoConnect 
                        ? "Auto-connecting..." 
                        : "Connecting...")
                    : isAuthenticated
                      ? "Link Wallet"
                      : "Connect Wallet"
                  }
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Collect Success Modal */}
      {isReady && showCollectModal && collectToken && collectTxHash && (
        <CollectedModal
          nft={{ imageURI: collectToken.imageURI, name: collectToken.name }}
          txHash={collectTxHash}
          onClose={() => setShowCollectModal(false)}
        />
      )}
    </nav>
  );
} 