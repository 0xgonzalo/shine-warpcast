"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

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
  const { isDarkMode, toggleTheme } = useTheme();
  const { context: farcasterContext } = useFarcaster();
  
  // Extract Farcaster user data from context
  const farcasterUser = farcasterContext?.user;









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
                <Wallet>
                  <ConnectWallet className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center space-x-2">
                    {/* Show Farcaster avatar if available */}
                    {farcasterUser?.pfpUrl && (
                      <Image
                        src={farcasterUser.pfpUrl}
                        alt={farcasterUser.username || "Farcaster User"}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span className="text-white">
                      {farcasterUser?.username || <Name address={address}/>}
                    </span>
                  </ConnectWallet>
                  <WalletDropdown>
                    <div className={`p-4 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className={`mb-2 text-lg font-bold pb-2 border-b ${
                        isDarkMode ? 'text-white border-gray-700' : 'text-white border-gray-200'
                      }`}>
                        <span>Wallet Details</span>
                      </div>
                      <div>
                        <Identity className="px-2 py-2" hasCopyAddressOnClick>
                          {/* Show Farcaster avatar in dropdown too */}
                          {farcasterUser?.pfpUrl ? (
                            <Image
                              src={farcasterUser.pfpUrl}
                              alt={farcasterUser.username || "Farcaster User"}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <Avatar />
                          )}
                          <Name address={address} className="text-white"/>
                          <Address className="text-white"/>
                          <EthBalance className="text-white"/>
                        </Identity>
                        <Link
                          href="/create"
                          className={`block w-full mt-2 text-center py-2 px-4 font-bold transition-colors rounded ${
                            isDarkMode 
                              ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' 
                              : 'bg-gray-100 border border-gray-300 text-white hover:bg-gray-200'
                          }`}
                        >
                          Create
                        </Link>
                        <Link
                          href={address ? `/profile/${address}` : '/profile'}
                          className={`block w-full mt-2 text-center py-2 px-4 font-bold transition-colors rounded ${
                            isDarkMode 
                              ? 'bg-gray-700 border border-gray-600 text-white hover:bg-gray-600' 
                              : 'bg-gray-100 border border-gray-300 text-white hover:bg-gray-200'
                          }`}
                        >
                          Profile
                        </Link>
                        <WalletDropdownDisconnect className={`w-full mt-2 text-center py-2 px-4 font-bold transition-colors rounded ${
                          isDarkMode 
                            ? 'bg-red-900 border border-red-700 text-white hover:bg-red-800' 
                            : 'bg-red-100 border border-red-300 text-white hover:bg-red-200'
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


    </>
  );
}
