"use client";

import Link from "next/link";
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import useConnectedWallet from "@/hooks/useConnectedWallet";

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

          {/* Wallet Connection */}
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
    </nav>
  );
} 