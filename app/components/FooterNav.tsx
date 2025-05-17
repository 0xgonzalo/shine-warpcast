'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useConnectedWallet from '@/hooks/useConnectedWallet';
// Import icons later if needed, e.g., from 'lucide-react'
// import { Home, Search, PlusSquare, User } from 'lucide-react';

export default function FooterNav() {
  const pathname = usePathname();
  const { connectedWallet } = useConnectedWallet(); // connectedWallet is the address itself or undefined

  const navItems = [
    { name: 'Home', href: '/home', iconSrc: '/home.svg' },
    { name: 'Search', href: '', iconSrc: '/search.svg' },
    { name: 'Create', href: '/create', iconSrc: '/create.svg' },
    {
      name: 'Profile',
      href: connectedWallet ? `/profile/${connectedWallet}` : '/profile',
      iconSrc: '/profile.svg' 
    },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 shadow-md z-40 md:hidden">
      <nav className="max-w-md mx-auto">
        <ul className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            let isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
            if (item.name === 'Profile') {
              if (connectedWallet) {
                isActive = pathname === `/profile/${connectedWallet}` || pathname?.startsWith(`/profile/${connectedWallet}/`);
              } else {
                isActive = pathname === '/profile' || pathname?.startsWith('/profile/');
              }
            }
            
            return (
              <li key={item.name} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors
                              ${
                                isActive
                                  ? 'text-foreground font-semibold'
                                  : 'text-gray-400 hover:text-foreground'
                              }`}
                >
                  {item.iconSrc && (
                    <img src={item.iconSrc} alt={`${item.name} icon`} className="w-6 h-6 mb-0.5" />
                  )}
                  <span className="text-xs sm:text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
} 