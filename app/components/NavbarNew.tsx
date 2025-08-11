"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, contractABI, getMostCollectedArtists, getTotalPriceForInstaBuy, userOwnsSong, generatePseudoFarcasterId } from '../utils/contract';
import CollectedModal from './CollectedModal';
import { getIPFSGatewayURL } from '@/app/utils/pinata';
import { useTheme } from '../context/ThemeContext';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

// ClientOnly component to prevent hydration errors
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? <>{children}</> : null;
}

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { isDarkMode, toggleTheme } = useTheme();
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

  // Handle collect action
  const handleNavbarCollect = async () => {
    if (!isConnected || !collectToken || !address) return;

    // Generate pseudo-FID from wallet address for collection
    const farcasterId = generatePseudoFarcasterId(address);
    console.log('🎯 [Navbar] Using pseudo-Farcaster ID for wallet:', address, '→', farcasterId.toString());
    
    try {
      // Check if user already owns this song
      const alreadyOwns = await userOwnsSong(farcasterId, collectToken.tokenId);
      if (alreadyOwns) {
        setCollectError('You already own this song!');
        return;
      }

      // Get the total price for instant buy
      const totalPrice = await getTotalPriceForInstaBuy(collectToken.tokenId);
      
      // Execute the transaction
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'instantBuy',
        args: [collectToken.tokenId, farcasterId],
        value: totalPrice,
      });

      setCollectError(null);
    } catch (error) {
      console.error('Error collecting song:', error);
      setCollectError('Failed to collect song');
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isConfirmed && receipt && receipt.status === 'success' && txData && collectToken) {
      setCollectTxHash(txData);
      setShowCollectModal(true);
    }
  }, [isConfirmed, receipt, txData, collectToken]);

  // Clear errors when starting new transaction
  useEffect(() => {
    if (isPending) {
      setCollectError(null);
    }
  }, [isPending]);

  return (
    <>
      <div className={`sticky top-0 z-40 transition-colors ${
        isDarkMode ? 'bg-black' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo */}
            <div className="flex items-center">
              <Link href="/" className="inline-flex items-center" aria-label="Shine Home">
                <Image
                  src={isDarkMode ? "/logo.png" : "/logo-blue.png"}
                  alt="Shine Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>

            {/* Center - Collect Button */}
            <div className="flex items-center">
              {collectToken && (
                <button
                  onClick={handleNavbarCollect}
                  disabled={!isConnected || isPending || isConfirming || collectLoading}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all transform hover:scale-105 ${
                    !isConnected || isPending || isConfirming || collectLoading
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : isDarkMode
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg'
                  } text-white font-medium`}
                >
                  {collectToken.imageURI && (
                    <Image
                      src={getIPFSGatewayURL(collectToken.imageURI)}
                      alt={collectToken.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded object-cover"
                    />
                  )}
                  <span>
                    {isPending || isConfirming 
                      ? 'Collecting...' 
                      : collectLoading 
                        ? 'Loading...'
                        : `Collect ${collectToken.name}`}
                  </span>
                </button>
              )}
              
              {collectError && (
                <div className="ml-2 text-sm text-red-500">
                  {collectError}
                </div>
              )}
            </div>

            {/* Right side - OnchainKit Wallet */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-white/10 text-white' 
                    : 'hover:bg-black/10 text-black'
                }`}
                aria-label="Toggle theme"
              >
                <Image
                  src={isDarkMode ? "/light.svg" : "/dark.svg"}
                  alt="Theme toggle"
                  width={20}
                  height={20}
                />
              </button>

              <ClientOnly>
                <Wallet>
                  <ConnectWallet className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                    <Name address={address}/>
                  </ConnectWallet>
                  <WalletDropdown>
                    <div className={`p-4 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className={`mb-2 text-lg font-bold pb-2 border-b ${
                        isDarkMode ? 'text-white border-gray-700' : 'text-black border-gray-200'
                      }`}>
                        <span>Wallet Details</span>
                      </div>
                      <div>
                        <Identity className="px-2 py-2" hasCopyAddressOnClick>
                          <Avatar />
                          <Name address={address}/>
                          <Address />
                          <EthBalance />
                        </Identity>
                        <Link
                          href="/create"
                          className={`block w-full mt-2 text-center py-2 px-4 font-bold transition-colors rounded ${
                            isDarkMode 
                              ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' 
                              : 'bg-gray-100 border border-gray-300 text-black hover:bg-gray-200'
                          }`}
                        >
                          Create
                        </Link>
                        <Link
                          href={address ? `/profile/${address}` : '/profile'}
                          className={`block w-full mt-2 text-center py-2 px-4 font-bold transition-colors rounded ${
                            isDarkMode 
                              ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' 
                              : 'bg-gray-100 border border-gray-300 text-black hover:bg-gray-200'
                          }`}
                        >
                          Profile
                        </Link>
                        <WalletDropdownDisconnect className={`w-full mt-2 text-center py-2 px-4 font-bold transition-colors rounded ${
                          isDarkMode 
                            ? 'bg-red-900 border border-red-700 text-white hover:bg-red-800' 
                            : 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                        }`} />
                      </div>
                    </div>
                  </WalletDropdown>
                </Wallet>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>

      {/* Collect Success Modal */}
      {showCollectModal && collectToken && collectTxHash && (
        <CollectedModal
          nft={{
            imageURI: collectToken.imageURI,
            name: collectToken.name,
          }}
          txHash={collectTxHash}
          onClose={() => {
            setShowCollectModal(false);
            setCollectTxHash(null);
          }}
        />
      )}
    </>
  );
}
