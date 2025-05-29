"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useFarcaster } from '../context/FarcasterContext';
import Image from 'next/image';

export default function Navbar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { context } = useFarcaster();
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

  const handleDisconnect = async () => {
    try {
      disconnect();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  // Get user info from Farcaster context
  const farcasterUsername = context?.user?.username;
  const farcasterPfpUrl = context?.user?.pfpUrl;
  const farcasterDisplayName = context?.user?.displayName;

  return (
    <nav className="w-full bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand with Shine logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 text-xl font-bold text-white hover:text-gray-200 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">✨</span>
            </div>
            <span>Shine</span>
          </Link>

          {/* User Profile */}
          <div className="relative" ref={dropdownRef}>
            {isConnected && address ? (
              <div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 transition-colors text-white hover:bg-black/60"
                >
                  {/* Farcaster Profile Picture */}
                  {farcasterPfpUrl ? (
                    <Image 
                      src={farcasterPfpUrl} 
                      alt={farcasterDisplayName || farcasterUsername || 'User'} 
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-xs text-white">👤</span>
                    </div>
                  )}
                  
                  {/* Username or Display Name */}
                  {farcasterDisplayName ? (
                    <span className="text-sm font-medium">{farcasterDisplayName}</span>
                  ) : farcasterUsername ? (
                    <span className="text-sm">@{farcasterUsername}</span>
                  ) : (
                    <span className="text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  )}
                  
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
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-black/80 backdrop-blur-sm border border-white/10 shadow-lg py-1 z-50">
                    <Link
                      href="/create"
                      className="block px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>🎵</span>
                        <span>Create Music</span>
                      </div>
                    </Link>
                    <Link
                      href={`/profile/${address}`}
                      className="block px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>👤</span>
                        <span>Profile</span>
                      </div>
                    </Link>
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={handleDisconnect}
                      className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span>🚪</span>
                        <span>Disconnect</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                Connect via Farcaster
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 