"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

import { useTheme } from '../context/ThemeContext';
import { useFarcaster } from '../context/FarcasterContext';
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,

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
  const { disconnect } = useDisconnect();
  const { isDarkMode, toggleTheme } = useTheme();
  const { context: farcasterContext } = useFarcaster();
  
  // Extract Farcaster user data from context
  const farcasterUser = farcasterContext?.user;
  const [farcasterProfile, setFarcasterProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Try to get Farcaster profile data from context or fetch it
  useEffect(() => {
    // First check if we have user data in the context
    if (farcasterContext?.user) {
      console.log('📱 [Navbar] Using Farcaster user from context:', farcasterContext.user);
      setFarcasterProfile(farcasterContext.user);
      return;
    }

    // If not, try to fetch from API
    const fetchFarcasterProfile = async () => {
      const fid = farcasterContext?.client?.fid;
      if (!fid) return;
      
      console.log('🔍 [Navbar] Fetching Farcaster profile for FID via internal API:', fid);
      try {
        const response = await fetch(`/api/farcaster/by-address?fid=${encodeURIComponent(String(fid))}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data?.user) setFarcasterProfile(data.user);
        } else {
          console.log('📱 [Navbar] Internal API response not OK:', response.status);
        }
      } catch (error) {
        console.error('❌ [Navbar] Error fetching Farcaster profile via internal API:', error);
      }
    };

    fetchFarcasterProfile();
  }, [farcasterContext]);

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
                <div className="relative" ref={dropdownRef}>
                  {!isConnected ? (
                    <Wallet>
                      <ConnectWallet className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
                        Connect Wallet
                      </ConnectWallet>
                    </Wallet>
                  ) : (
                    <>
                      {/* Profile Button */}
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center space-x-2"
                      >
                        {/* Show Farcaster avatar if available */}
                        {(() => {
                          const avatarUrl =
                            (farcasterProfile as any)?.pfp_url ||
                            (farcasterProfile as any)?.pfp?.url ||
                            (farcasterContext as any)?.user?.pfpUrl ||
                            (farcasterContext as any)?.user?.pfp?.url ||
                            undefined;
                          if (avatarUrl) {
                            return (
                              <img
                                src={avatarUrl}
                                alt={(farcasterProfile as any)?.username || 'Farcaster User'}
                                width={24}
                                height={24}
                                referrerPolicy="no-referrer"
                                crossOrigin="anonymous"
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            );
                          }
                          return (
                            <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                              <span className="text-xs text-white">
                                {address ? address.slice(2, 4).toUpperCase() : '??'}
                              </span>
                            </div>
                          );
                        })()}
                        <span className="text-white">
                          {(farcasterProfile as any)?.username || (farcasterContext as any)?.user?.username || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Profile')}
                        </span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Custom Dropdown */}
                      {isDropdownOpen && (
                        <div className={`absolute right-0 top-full mt-2 z-50 p-4 rounded-lg shadow-xl border min-w-[280px] ${
                          isDarkMode 
                            ? 'bg-gradient-to-br from-gray-900 to-black border-gray-600 shadow-black/50' 
                            : 'bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-blue-100/50'
                        }`}>
                          <div className={`mb-4 text-lg font-bold pb-2 border-b ${
                            isDarkMode ? 'text-white border-gray-600' : 'text-foreground border-blue-200'
                          }`}>
                            <span>Wallet Details</span>
                          </div>
                          
                          {/* User Info */}
                          <div className="mb-4">
                            <div className="flex items-center space-x-3 mb-2">
                              {(() => {
                                const avatarUrl =
                                  (farcasterProfile as any)?.pfp_url ||
                                  (farcasterProfile as any)?.pfp?.url ||
                                  (farcasterContext as any)?.user?.pfpUrl ||
                                  (farcasterContext as any)?.user?.pfp?.url ||
                                  undefined;
                                if (avatarUrl) {
                                  return (
                                    <img
                                      src={avatarUrl}
                                      alt={(farcasterProfile as any)?.username || 'Farcaster User'}
                                      width={32}
                                      height={32}
                                      referrerPolicy="no-referrer"
                                      crossOrigin="anonymous"
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  );
                                }
                                return (
                                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                                    <span className="text-sm text-white">
                                      {address ? address.slice(2, 4).toUpperCase() : '??'}
                                    </span>
                                  </div>
                                );
                              })()}
                              <div>
                                <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-foreground'}`}>
                                  {(farcasterProfile as any)?.username || (farcasterContext as any)?.user?.username || 'Anonymous'}
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-foreground'}`}>
                                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <Link
                              href="/create"
                              onClick={() => setIsDropdownOpen(false)}
                              className={`block w-full text-center py-2 px-4 font-medium transition-all rounded-lg ${
                                isDarkMode 
                                  ? 'bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-500 text-white hover:from-gray-600 hover:to-gray-500 hover:shadow-lg' 
                                  : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-foreground hover:from-blue-100 hover:to-blue-200 hover:shadow-lg'
                              }`}
                            >
                              Create
                            </Link>
                            <Link
                              href={address ? (`/profile/${address}` + (farcasterContext?.client?.fid ? `?fid=${encodeURIComponent(String((farcasterContext as any)?.client?.fid))}` : '')) : '/profile'}
                              onClick={() => setIsDropdownOpen(false)}
                              className={`block w-full text-center py-2 px-4 font-medium transition-all rounded-lg ${
                                isDarkMode 
                                  ? 'bg-gradient-to-r from-gray-700 to-gray-600 border border-gray-500 text-white hover:from-gray-600 hover:to-gray-500 hover:shadow-lg' 
                                  : 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-foreground hover:from-blue-100 hover:to-blue-200 hover:shadow-lg'
                              }`}
                            >
                              Profile
                            </Link>
                            <button
                              onClick={() => {
                                disconnect();
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full text-center py-2 px-4 font-medium transition-all rounded-lg ${
                                isDarkMode 
                                  ? 'bg-gradient-to-r from-red-800 to-red-700 border border-red-600 text-white hover:from-red-700 hover:to-red-600 hover:shadow-lg' 
                                  : 'bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 hover:from-red-100 hover:to-red-200 hover:shadow-lg'
                              }`}
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
